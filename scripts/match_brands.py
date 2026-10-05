"""Map inventory items to brands using brand_list.csv (generalized, longest-alias-wins matching).
Usage: python scripts/match_brands.py LocationInventory.csv scripts/brand_list.csv
Writes inventory_brand_map.csv and lists items with no brand match (candidates for new brands).

Rules:
 1. Names are normalized (lowercase, apostrophes dropped, & -> and, punctuation -> spaces).
 2. The brand name itself is always an alias; the aliases column holds extras (typos, short forms).
 3. Aliases match whole words only, so 'corona' does not match 'coronado'.
 4. The longest alias wins, so 'bud light' beats 'bud' and 'smirnoff ice' beats 'smirnoff'.
    To give a sub-brand its own logo, add it as its own brand row.
 5. Flavor, size, and pack words are ignored. Non-drink items are skipped via EXCLUDE.
"""
import csv, re, sys
EXCLUDE = {"tostitos", "totitos", "ramen", "coffee", "salsa", "crakan", "thca", "tips", "pepto", "labs", "swabs"}

def norm(s):
    s = str(s).lower().replace("\u2019", "'").replace("'", "").replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", " ", s).split()

brands, idx, seen = [], [], set()
for row in csv.DictReader(open(sys.argv[2])):
    bi = len(brands); brands.append(row)
    for a in [row["brand"]] + row["aliases"].split(";"):
        t = tuple(norm(a))
        if t and t not in seen:
            seen.add(t); idx.append((len(t), sum(map(len, t)), t, bi))
idx.sort(reverse=True)

def match(name):
    t = norm(name)
    if set(t) & EXCLUDE: return None
    for L, _, a, bi in idx:
        if any(tuple(t[i:i + L]) == a for i in range(len(t) - L + 1)): return bi
    return None

out, miss = [], []
for r in csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")):
    cat = r.get("Categories", "") or ""
    if not re.search(r"BEER|RTD|LIQUOR/SPIRITS|WINE|ALLOCATED", cat): continue
    bi = match(r["Item Name"])
    out.append([r["Item Name"], cat, brands[bi]["brand"] if bi is not None else ""])
    if bi is None: miss.append(r["Item Name"])
csv.writer(open("inventory_brand_map.csv", "w", newline="")).writerows([["item", "categories", "brand"]] + out)
print(f"matched {len(out) - len(miss)} of {len(out)}")
for m in miss: print("NO MATCH:", m)
