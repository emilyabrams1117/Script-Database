"""
Re-match plays to Drive file IDs using a LIVE listing of the folder the
service account can actually read (scripts/backfill/drive_files.json),
rather than the old CSV exports whose file IDs may be stale.

Live, verified-accessible matches take priority over the old CSV-derived
matches (which we keep as a fallback since some may still be valid, but
we can't currently verify them without the right sharing scope).
"""
import difflib
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


def candidate_titles(name: str):
    """Try the several filename conventions seen across Emily's Drive folders."""
    candidates = []

    # "Last, First - Title (notes)" or "Last, First - Title - notes"
    m = re.match(r"^[^,]+,\s*[^-]+-\s*(.+)$", name)
    if m:
        rest = m.group(1)
        rest = re.split(r"\s+-\s+", rest)[0]
        rest = re.split(r"\(", rest)[0]
        candidates.append(rest.strip())

    # "Title by Author [extra]" -- both with and without stripping a
    # parenthetical, since some real titles legitimately end in "(...)"
    # (e.g. "The Wundelsteipen (And Other Difficult Roles for Young People)")
    # while others have a note in parens we want to ignore (e.g. "(via agent)")
    parts = re.split(r"\s+by\s+", name, maxsplit=1, flags=re.IGNORECASE)
    candidates.append(parts[0].strip())
    candidates.append(re.split(r"\(", parts[0])[0].strip())

    # whole filename, with and without a trailing parenthetical note
    candidates.append(name.strip())
    candidates.append(re.split(r"\(", name)[0].strip())

    return [c for c in candidates if c]


def main(plays_path, drive_files_path, out_path):
    with open(plays_path, encoding="utf-8") as f:
        plays = json.load(f)
    with open(drive_files_path, encoding="utf-8") as f:
        drive_files = json.load(f)

    pdfs = [f for f in drive_files if f.get("mimeType") == "application/pdf"]

    by_title = defaultdict(list)
    for f in pdfs:
        name = re.sub(r"\.pdf$", "", f["name"], flags=re.IGNORECASE)
        for title in candidate_titles(name):
            by_title[normalize_title(title)].append(f)

    all_norm_keys = list(by_title.keys())

    stats = {"live_matched": 0, "fuzzy_matched": 0, "kept_old_match": 0, "still_unmatched": 0}
    fuzzy_report = []
    unmatched_report = []

    for play in plays:
        key = play["title_norm"]
        candidates = by_title.get(key)

        last = (play.get("author_last") or "").strip().lower()

        if not candidates and last:
            # Fuzzy fallback: catches near-miss filenames (extra suffix like
            # "Libretto"/"Script", slightly different naming convention).
            # Only trust a fuzzy title match if the author's last name also
            # appears in the filename -- title-similarity alone produced
            # false positives across completely different plays/authors.
            close = difflib.get_close_matches(key, all_norm_keys, n=5, cutoff=0.85)
            fuzzy_candidates = []
            for k in close:
                fuzzy_candidates.extend(by_title[k])
            fuzzy_candidates = [c for c in fuzzy_candidates if last in c["name"].lower()]
            candidates = fuzzy_candidates or None
            is_fuzzy = bool(candidates)
        else:
            is_fuzzy = False

        if candidates:
            last = (play.get("author_last") or "").strip().lower()
            chosen = next((c for c in candidates if last and last in c["name"].lower()), candidates[0])
            play["drive_file_id"] = chosen["id"]
            play["link_source"] = "fuzzy_match" if is_fuzzy else "drive_live"
            if is_fuzzy:
                stats["fuzzy_matched"] += 1
                fuzzy_report.append(
                    {"title": play["title"], "author": play["author"], "matched_file": chosen["name"]}
                )
            else:
                stats["live_matched"] += 1
        elif play.get("drive_file_id"):
            stats["kept_old_match"] += 1
        else:
            stats["still_unmatched"] += 1
            unmatched_report.append({"title": play["title"], "author": play["author"], "type": play.get("type")})

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(plays, f, indent=2)

    print(f"Total plays: {len(plays)}")
    print(f"Live-verified matches (exact): {stats['live_matched']}")
    print(f"Live-verified matches (fuzzy/near-miss filename): {stats['fuzzy_matched']}")
    print(f"Kept old (unverified) match: {stats['kept_old_match']}")
    print(f"Still unmatched: {stats['still_unmatched']}")
    print(f"Wrote -> {out_path}")

    return fuzzy_report, unmatched_report


if __name__ == "__main__":
    fuzzy_report, unmatched_report = main(sys.argv[1], sys.argv[2], sys.argv[3])
    if len(sys.argv) > 4:
        with open(sys.argv[4], "w", encoding="utf-8") as f:
            json.dump({"fuzzy_matched": fuzzy_report, "still_unmatched": unmatched_report}, f, indent=2)
        print(f"Wrote match report -> {sys.argv[4]}")
