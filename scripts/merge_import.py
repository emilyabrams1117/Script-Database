"""
One-time ETL: merges the three raw Google Sheets exports (Scripts, Studio_Scripts,
Links) into a single clean dataset for seeding the database.

Usage:
    python3 merge_import.py <scripts.csv> <studio_scripts.csv> <links.csv> <out.json>

This does NOT hit the network or the Drive API. It only reconciles titles across
the three CSVs to attach a Google Drive file ID to as many plays as possible.
Plays that still have no drive_file_id after this pass need to be found manually
or matched by hand later -- see the "unmatched" report printed at the end.
"""
import csv
import json
import re
import sys
from collections import defaultdict


def normalize_title(title: str) -> str:
    t = title.strip().lower()
    t = t.strip("\"'")
    t = re.sub(r"[^a-z0-9]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"^(the|a|an) ", "", t)
    return t


def parse_scripts(path):
    """Main index tab. Row 0 is a corrupted header (real headers are Title,
    Author, Last Name, Read, Seen, Type, Publication; the first three cells of
    row 0 are leftover data, not a header, and are dropped)."""
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        rows = list(csv.reader(f))

    records = []
    for r in rows[1:]:
        r = r + [""] * (13 - len(r))
        title = r[0].strip()
        if not title:
            continue
        records.append({
            "title": title,
            "title_norm": normalize_title(title),
            "author": r[1].strip(),
            "author_last": r[2].strip(),
            "read": bool(r[3].strip()),
            "seen": bool(r[4].strip()),
            "type": r[5].strip(),
            "publication": r[6].strip(),
        })
    return records


def parse_studio_scripts(path):
    """Title in col 7 (== col 19), author full name col 8, last name col 1/9,
    Drive file link col 20 (https://drive.google.com/file/d/{ID}/view...)."""
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        rows = list(csv.reader(f))

    by_norm_title = defaultdict(list)
    for r in rows:
        r = r + [""] * (21 - len(r))
        title = r[7].strip().strip('"')
        link = r[20].strip()
        if not title or not link:
            continue
        m = re.search(r"/d/([a-zA-Z0-9_-]+)", link)
        if not m:
            continue
        by_norm_title[normalize_title(title)].append({
            "drive_file_id": m.group(1),
            "author": r[8].strip(),
            "last_name": r[1].strip() or r[9].strip(),
            "source": "studio_scripts",
        })
    return by_norm_title


def parse_links(path):
    """Legacy 'PLAYS' folder listing. Filenames look like
    '{Title} by {Author}[ extra].pdf' in col 2. Direct-download link in col 4
    (https://drive.google.com/uc?id={ID}&export=download)."""
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        rows = list(csv.reader(f))

    by_norm_title = defaultdict(list)
    for r in rows:
        r = r + [""] * (8 - len(r))
        filename = r[2].strip()
        link = r[4].strip()
        if not filename or not link:
            continue
        m = re.search(r"[?&]id=([a-zA-Z0-9_-]+)", link)
        if not m:
            continue
        name = re.sub(r"\.pdf$", "", filename, flags=re.IGNORECASE)
        parts = re.split(r"\s+by\s+", name, maxsplit=1, flags=re.IGNORECASE)
        title = parts[0].strip()
        author = parts[1].strip() if len(parts) > 1 else ""
        by_norm_title[normalize_title(title)].append({
            "drive_file_id": m.group(1),
            "author": author,
            "source": "links",
        })
    return by_norm_title


def merge(scripts_path, studio_path, links_path):
    plays = parse_scripts(scripts_path)
    studio_index = parse_studio_scripts(studio_path)
    links_index = parse_links(links_path)

    stats = {"matched_studio_scripts": 0, "matched_links": 0, "unmatched": 0, "ambiguous": 0}
    unmatched_titles = []

    for play in plays:
        key = play["title_norm"]
        candidates = studio_index.get(key)
        source = "studio_scripts"
        if not candidates:
            candidates = links_index.get(key)
            source = "links"

        if not candidates:
            play["drive_file_id"] = None
            play["link_source"] = None
            stats["unmatched"] += 1
            unmatched_titles.append(play["title"])
            continue

        if len(candidates) > 1:
            stats["ambiguous"] += 1
            last = play["author_last"].strip().lower()
            narrowed = [c for c in candidates if last and last in c.get("author", "").lower()]
            chosen = narrowed[0] if narrowed else candidates[0]
        else:
            chosen = candidates[0]

        play["drive_file_id"] = chosen["drive_file_id"]
        play["link_source"] = source
        stats["matched_" + source] += 1

    return plays, stats, unmatched_titles


if __name__ == "__main__":
    scripts_path, studio_path, links_path, out_path = sys.argv[1:5]
    plays, stats, unmatched_titles = merge(scripts_path, studio_path, links_path)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(plays, f, indent=2)

    print(f"Total plays: {len(plays)}")
    print(f"Matched via Studio_Scripts: {stats['matched_studio_scripts']}")
    print(f"Matched via Links (fallback): {stats['matched_links']}")
    print(f"Ambiguous (multiple candidates, picked best guess): {stats['ambiguous']}")
    print(f"Unmatched (no drive link found): {stats['unmatched']}")
    print(f"\nWrote merged dataset -> {out_path}")

    unmatched_out = out_path.replace(".json", "_unmatched.txt")
    with open(unmatched_out, "w", encoding="utf-8") as f:
        f.write("\n".join(unmatched_titles))
    print(f"Wrote unmatched title list -> {unmatched_out}")
