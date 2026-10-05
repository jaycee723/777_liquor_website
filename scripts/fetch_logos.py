"""Download brand logos (SVG, PNG, JPG/JPEG) from Wikimedia Commons and build brands.json.
Usage (from repo root):  pip install requests  &&  python scripts/fetch_logos.py scripts/brand_list.csv
Outputs: <OUT>/<slug>.<svg|png|jpg|webp>, <OUT>/brands.json (real extensions), attribution.csv
Brands not found get logo = null; the site should fall back to /images/placeholder.svg."""
import csv, sys, os, re, json, time, requests

API = "https://commons.wikimedia.org/w/api.php"
OUT = "777-Liquor-Website/website/public/images/brands"
HDR = {"User-Agent": "777LiquorLogoFetcher/1.0 (store website)"}
OK_EXT = {"svg", "png", "jpg", "jpeg", "webp"}
CT_EXT = {"image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
os.makedirs(OUT, exist_ok=True)

def find(brand):
    key = re.sub(r"[^a-z0-9]", "", brand.split()[0].lower())
    for ftype in ("drawing", "bitmap"):
        r = requests.get(API, headers=HDR, params={
            "action": "query", "generator": "search", "gsrnamespace": 6, "gsrlimit": 8,
            "gsrsearch": f"{brand} logo filetype:{ftype}", "prop": "imageinfo",
            "iiprop": "url|mime|extmetadata", "format": "json"}, timeout=30).json()
        pages = sorted(r.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
        for p in pages:
            title = re.sub(r"[^a-z0-9]", "", p["title"].lower())
            if key in title:
                return p
    return None

index, log = [], []
for row in csv.DictReader(open(sys.argv[1])):
    brand, cat = row["brand"], row["category"]
    base = row["target_file"].rsplit(".", 1)[0]
    p = find(brand)
    logo = None
    if p:
        info = p["imageinfo"][0]
        resp = requests.get(info["url"], headers=HDR, timeout=60)
        ext = CT_EXT.get(resp.headers.get("content-type", "").split(";")[0]) or info["url"].rsplit(".", 1)[-1].lower().replace("jpeg", "jpg")
        if resp.ok and ext in OK_EXT:
            open(f"{OUT}/{base}.{ext}", "wb").write(resp.content)
            logo = f"/images/brands/{base}.{ext}"
            lic = info.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "")
            log.append([brand, f"{base}.{ext}", info["descriptionurl"], lic])
    if not logo:
        log.append([brand, "NOT FOUND", "", ""])
    print("ok  " if logo else "miss", brand)
    index.append({"brand": brand, "category": cat, "logo": logo})
    time.sleep(1)

json.dump({"fallback": "/images/placeholder.svg", "brands": index},
          open(f"{OUT}/brands.json", "w"), indent=1)
csv.writer(open("attribution.csv", "w", newline="")).writerows([["brand", "file", "source", "license"]] + log)
