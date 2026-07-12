"""
Re-match plays to Drive file IDs using a LIVE listing of the folder the
service account can actually read (scripts/backfill/drive_files.json),
rather than the old CSV exports whose file IDs may be stale.

Live, verified-accessible matches take priority over the old CSV-derived
matches (which we keep as a fallback since some may still be valid, but
we can't currently verify them without the right sharing scope).
"""
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


def main(plays_path, drive_files_path, out_path):
    with open(plays_path, encoding="utf-8") as f:
        plays = json.load(f)
    with open(drive_files_path, encoding="utf-8") as f:
        drive_files = json.load(f)

    pdfs = [f for f in drive_files if f.get("mimeType") == "application/pdf"]

    by_title = defaultdict(list)
    for f in pdfs:
        name = re.sub(r"\.pdf$", "", f["name"], flags=re.IGNORECASE)
        # "{Title} by {Author}[ extra]" pattern, else whole filename as title
        parts = re.split(r"\s+by\s+", name, maxsplit=1, flags=re.IGNORECASE)
        title = parts[0].strip()
        by_title[normalize_title(title)].append(f)
        # also index the raw filename (minus extension) in case there's no " by "
        by_title[normalize_title(name)].append(f)

    stats = {"live_matched": 0, "kept_old_match": 0, "still_unmatched": 0}

    for play in plays:
        key = play["title_norm"]
        candidates = by_title.get(key)
        if candidates:
            last = (play.get("author_last") or "").strip().lower()
            chosen = next((c for c in candidates if last and last in c["name"].lower()), candidates[0])
            play["drive_file_id"] = chosen["id"]
            play["link_source"] = "drive_live"
            stats["live_matched"] += 1
        elif play.get("drive_file_id"):
            stats["kept_old_match"] += 1
        else:
            stats["still_unmatched"] += 1

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(plays, f, indent=2)

    print(f"Total plays: {len(plays)}")
    print(f"Live-verified matches (new): {stats['live_matched']}")
    print(f"Kept old (unverified) match: {stats['kept_old_match']}")
    print(f"Still unmatched: {stats['still_unmatched']}")
    print(f"Wrote -> {out_path}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
