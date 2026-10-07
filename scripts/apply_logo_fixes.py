#!/usr/bin/env python3
"""Rename mislabeled logo files and delete unwanted ones.

Usage (repo root): python scripts/apply_logo_fixes.py scripts/logo_fixes.csv [scripts/logo_deletes.txt]
logo_fixes.csv columns: old_file,new_file,belongs_to  (renames the file, freeing the brand's slot)
logo_deletes.txt: one file name per line (blank lines and # comments ignored)
Both are idempotent: missing files are skipped. The next fetch re-searches emptied brand slots (with the
stricter filters) and rewrites brands.json.
"""
import csv, os, sys

IMG_DIR = "777-Liquor-Website/website/public/images/brands"
REPORT = "reports/logo-fetch/mismatched.csv"

moved = []
for row in csv.DictReader(open(sys.argv[1], encoding="utf-8")):
    old, new = f"{IMG_DIR}/{row['old_file']}", f"{IMG_DIR}/{row['new_file']}"
    if os.path.exists(old) and not os.path.exists(new):
        os.rename(old, new)
        moved.append([row["old_file"], row["new_file"], row["belongs_to"]])
        print("renamed", row["old_file"], "->", row["new_file"])
    else:
        print("skip rename", row["old_file"])

deleted = 0
if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
    for line in open(sys.argv[2], encoding="utf-8"):
        name = line.strip()
        if not name or name.startswith("#") or "/" in name or ".." in name:
            continue
        path = f"{IMG_DIR}/{name}"
        if os.path.exists(path):
            os.remove(path)
            deleted += 1
            print("deleted", name)
        else:
            print("skip delete", name)

if moved:
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    existing = list(csv.reader(open(REPORT, encoding="utf-8"))) if os.path.exists(REPORT) else [["old_file", "new_file", "belongs_to"]]
    seen = {tuple(r) for r in existing}
    for r in moved:
        if tuple(r) not in seen:
            existing.append(r)
    with open(REPORT, "w", newline="", encoding="utf-8") as f:
        csv.writer(f, lineterminator="\n").writerows(existing)
print(f"{len(moved)} renamed, {deleted} deleted")
