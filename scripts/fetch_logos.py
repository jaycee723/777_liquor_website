#!/usr/bin/env python3
"""Fetch brand logos (SVG preferred; PNG/JPG/WebP accepted) and build brands.json.

Run from the repo root:
    pip install requests
    python scripts/fetch_logos.py scripts/brand_list.csv [--category Beer] [--limit 20] [--only "Heineken,Modelo"] [--force]

Sources, in order: Wikimedia Commons logo search -> brand's English Wikipedia infobox logo.
Safety/quality: strict title matching, generic-word brands go to manual review instead of being saved,
SVGs containing scripts are rejected, size caps, retries with backoff, per-brand error isolation, resumable.

Outputs
  <IMG_DIR>/<slug>.<ext>              logo files
  <IMG_DIR>/brands.json               site index (logo is null unless a verified logo exists)
  reports/logo-fetch/attribution.csv  source page + license for every saved logo
  reports/logo-fetch/review.csv       candidates that need a human look (generic names, non-free logos)
  reports/logo-fetch/missing.csv      brands with no usable logo
"""
import argparse, csv, json, os, re, sys, time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

IMG_DIR = "777-Liquor-Website/website/public/images/brands"
REPORT_DIR = "reports/logo-fetch"
UA = "777LiquorLogoFetcher/2.0 (https://github.com/jaycee723/777_liquor_website; store website logo index)"
COMMONS = "https://commons.wikimedia.org/w/api.php"
ENWIKI = "https://en.wikipedia.org/w/api.php"
OK_EXT = {"svg", "png", "jpg", "webp"}
MIME_EXT = {"image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
MAX_BYTES = 750_000
HINT = {"Beer": "beer", "RTD": "hard seltzer cocktail", "Spirits": "liquor", "Wine": "wine"}
GENERIC = {  # common words: a logo match is probably a different company, so require manual review
    "press", "tiger", "cass", "victoria", "orion", "hite", "calypso", "onda", "stone", "rogue", "founders",
    "cooks", "decoy", "cupcake", "steel", "hurricane", "monaco", "truly", "nectar", "aloha", "the beast",
    "the club", "xxl", "big wave", "kua bay", "fresh haze", "mind haze", "gold cliff", "still gin", "bells",
    "bogle", "caymus", "avion", "kraken", "yoju", "foger", "olympia", "hamms", "pinnacle", "milagro",
    "coronado", "elysian", "longboard", "harken", "risata", "matua", "wente", "postmark", "apothic",
}

def session():
    s = requests.Session()
    s.headers["User-Agent"] = UA
    retry = Retry(total=5, backoff_factor=2, status_forcelist=(429, 500, 502, 503, 504),
                  allowed_methods=("GET",), respect_retry_after_header=True)
    s.mount("https://", HTTPAdapter(max_retries=retry))
    return s

def toks(s):
    s = str(s).lower().replace("\u2019", "'").replace("'", "").replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", " ", s).split()

def slugify(b):
    return "-".join(toks(b))

def title_ok(brand, title):
    """Brand words must appear contiguously at the start of the file name ('Heineken logo.svg')."""
    b, t = toks(brand), toks(re.sub(r"^File:", "", title, flags=re.I).rsplit(".", 1)[0])
    return t[:len(b)] == b and "logo" in t

def api(s, url, **params):
    params.update(format="json", formatversion=2)
    r = s.get(url, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def imageinfo_by_search(s, brand, ftype):
    d = api(s, COMMONS, action="query", generator="search", gsrnamespace=6, gsrlimit=10,
            gsrsearch=f"{brand} logo filetype:{ftype}", prop="imageinfo",
            iiprop="url|mime|size|extmetadata", iiextmetadatafilter="LicenseShortName|Restrictions")
    pages = sorted(d.get("query", {}).get("pages", []), key=lambda p: p.get("index", 99))
    return [p for p in pages if p.get("imageinfo") and title_ok(brand, p["title"])]

def wikipedia_logo(s, brand, category):
    d = api(s, ENWIKI, action="query", list="search", srsearch=f"{brand} {HINT.get(category, '')}", srlimit=3)
    for hit in d.get("query", {}).get("search", []):
        if toks(hit["title"])[:len(toks(brand))] != toks(brand):
            continue
        d2 = api(s, ENWIKI, action="query", prop="revisions", rvprop="content", rvslots="main",
                 titles=hit["title"], rvsection=0)
        pg = d2["query"]["pages"][0]
        text = pg.get("revisions", [{}])[0].get("slots", {}).get("main", {}).get("content", "")
        m = re.search(r"\|\s*(?:logo|image|image_name)\s*=\s*(?:\[\[)?(?:File:|Image:)?([^|\]\n{}]+\.(?:svg|png|jpe?g|webp))",
                      text, re.I)
        if m:
            fn = m.group(1).strip()
            d3 = api(s, ENWIKI, action="query", titles=f"File:{fn}", prop="imageinfo",
                     iiprop="url|mime|size|extmetadata", iiextmetadatafilter="LicenseShortName|Restrictions")
            p3 = d3["query"]["pages"][0]
            if p3.get("imageinfo"):
                p3["wiki_article"] = hit["title"]
                return p3
    return None

def clean_svg(data):
    low = data[:200000].lower()
    return b"<svg" in low and b"<script" not in low and b"onload=" not in low and b"javascript:" not in low

def download(s, info):
    r = s.get(info["url"], timeout=60)
    r.raise_for_status()
    ext = MIME_EXT.get(r.headers.get("content-type", "").split(";")[0].strip()) or MIME_EXT.get(info.get("mime", ""))
    data = r.content
    if ext not in OK_EXT or not data or len(data) > MAX_BYTES:
        return None, None
    if ext == "svg" and not clean_svg(data):
        return None, None
    if ext == "png" and not data.startswith(b"\x89PNG"):
        return None, None
    return ext, data

def existing_file(slug):
    for e in OK_EXT:
        p = f"{IMG_DIR}/{slug}.{e}"
        if os.path.exists(p) and os.path.getsize(p) > 0:
            return e
    return None

def read_csv(path):
    return list(csv.DictReader(open(path, encoding="utf-8"))) if os.path.exists(path) else []

def write_csv(path, header, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n"); w.writerow(header); w.writerows(rows)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv"); ap.add_argument("--category"); ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only"); ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    rows = read_csv(a.csv)
    if a.category and a.category.lower() != "all":
        rows = [r for r in rows if r["category"].lower() == a.category.lower()]
    if a.only:
        want = {slugify(x) for x in a.only.split(",")}
        rows = [r for r in rows if slugify(r["brand"]) in want]
    if a.limit:
        rows = rows[:a.limit]

    os.makedirs(IMG_DIR, exist_ok=True)
    prev = {r["brand"]: r for r in read_csv(f"{REPORT_DIR}/attribution.csv")}
    s = session()
    attribution, review, missing, index = {}, [], [], []
    stats = {"ok": 0, "kept": 0, "review": 0, "missing": 0, "error": 0}

    for n, row in enumerate(rows, 1):
        brand, cat = row["brand"], row["category"]
        slug = slugify(brand)
        entry = {"slug": slug, "brand": brand, "category": cat, "logo": None, "status": "missing"}
        try:
            ext = None if a.force else existing_file(slug)
            if ext:
                entry.update(logo=f"/images/brands/{slug}.{ext}", status="ok")
                if brand in prev: attribution[brand] = list(prev[brand].values())
                stats["kept"] += 1
            else:
                info, src = None, ""
                for ftype in ("drawing", "bitmap"):
                    c = imageinfo_by_search(s, brand, ftype)
                    if c:
                        info, src = c[0], "commons"; break
                    time.sleep(0.5)
                if not info:
                    info = wikipedia_logo(s, brand, cat)
                    src = "wikipedia" if info else ""
                if not info:
                    missing.append([brand, cat, "no logo found"]); stats["missing"] += 1
                else:
                    ii = info["imageinfo"][0]
                    meta = ii.get("extmetadata", {})
                    lic = meta.get("LicenseShortName", {}).get("value", "")
                    restr = meta.get("Restrictions", {}).get("value", "")
                    page = ii.get("descriptionurl", "")
                    nonfree = src == "wikipedia" or "fair use" in lic.lower() or "non-free" in lic.lower()
                    if toks(brand) and " ".join(toks(brand)) in GENERIC or nonfree:
                        why = "generic brand name" if " ".join(toks(brand)) in GENERIC else "non-free/fair-use logo"
                        review.append([brand, cat, ii["url"], page, lic, why]); stats["review"] += 1
                        entry["status"] = "review"
                    else:
                        ext, data = download(s, ii)
                        if not ext:
                            missing.append([brand, cat, "download rejected (type/size/unsafe svg)"]); stats["missing"] += 1
                        else:
                            open(f"{IMG_DIR}/{slug}.{ext}", "wb").write(data)
                            entry.update(logo=f"/images/brands/{slug}.{ext}", status="ok")
                            attribution[brand] = [brand, f"{slug}.{ext}", page, lic, restr, src]
                            stats["ok"] += 1
        except Exception as e:  # isolate failures so one bad brand never kills the run
            missing.append([brand, cat, f"error: {type(e).__name__}: {e}"[:200]]); stats["error"] += 1
        print(f"[{n}/{len(rows)}] {entry['status']:7} {brand}", flush=True)
        index.append(entry)
        time.sleep(0.7)

    # brands.json: merge with the existing index so partial runs (--category/--only) never drop other brands
    jpath = f"{IMG_DIR}/brands.json"
    old = {}
    if os.path.exists(jpath):
        try: old = {b["slug"]: b for b in json.load(open(jpath))["brands"]}
        except Exception: pass
    for e in index: old[e["slug"]] = e
    allrows = read_csv(a.csv)
    order = {slugify(r["brand"]): i for i, r in enumerate(allrows)}
    merged = sorted(old.values(), key=lambda b: order.get(b["slug"], 10**6))
    json.dump({"fallback": "/images/placeholder.svg", "brands": merged}, open(jpath, "w"), indent=1)
    open(jpath, "a").write("\n")

    done = {r["brand"] for r in rows}
    def merge(name, header, fresh, key=0):
        prev_rows = [list(r.values()) for r in read_csv(f"{REPORT_DIR}/{name}.csv") if r[header[key]] not in done]
        write_csv(f"{REPORT_DIR}/{name}.csv", header, sorted(prev_rows + fresh))
    still_ok = {e["brand"] for e in merged if e["status"] == "ok"}
    att_prev = {r["brand"]: list(r.values()) for r in read_csv(f"{REPORT_DIR}/attribution.csv")}
    att_prev.update(attribution)
    write_csv(f"{REPORT_DIR}/attribution.csv", ["brand", "file", "source_page", "license", "restrictions", "source"],
              sorted(v for k, v in att_prev.items() if k in still_ok))
    merge("review", ["brand", "category", "file_url", "source_page", "license", "reason"], review)
    merge("missing", ["brand", "category", "reason"], missing)

    summary = ", ".join(f"{k}={v}" for k, v in stats.items())
    print("DONE:", summary)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as f:
            f.write(f"### Logo fetch\n\n{summary}\n\nReview and missing lists are in `reports/logo-fetch/`.\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())
