#!/usr/bin/env python3
"""Rename mislabeled logo files to the entity they actually belong to and drop them from the brand slot.

Usage (repo root): python scripts/apply_logo_fixes.py scripts/logo_fixes.csv
CSV columns: old_file,new_file,belongs_to
Idempotent: skips rows whose old file is already gone. After this runs, the next fetch re-searches the
now-empty brand slots (using the stricter filters) and rewrites brands.json.
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
        print("skip", row["old_file"])

if moved:
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    existing = list(csv.reader(open(REPORT, encoding="utf-8"))) if os.path.exists(REPORT) else [["old_file", "new_file", "belongs_to"]]
    seen = {tuple(r) for r in existing}
    for r in moved:
        if tuple(r) not in seen:
            existing.append(r)
    with open(REPORT, "w", newline="", encoding="utf-8") as f:
        csv.writer(f, lineterminator="\n").writerows(existing)
print(f"{len(moved)} file(s) renamed")
