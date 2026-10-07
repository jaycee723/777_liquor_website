"""Extra safety filters for fetch_logos.py: reject logos that belong to a different entity than the brand.

Found by auditing the first runs: Commons search returned e.g. 'Busch Gardens', 'Guinness Six Nations',
'Mahou Sensei Negima', 'Black box logo', 'Busch Glatz', 'Keystone Symposia' for beer/liquor brands.
Use via scripts/run_fetch.py (installs these filters, then runs fetch_logos.main()).

Filters, in order:
  1. file-name checks (reject words after the brand name + exact known-bad file names)
  2. Commons category check: the file must be in a beverage/alcohol/brewery/winery-style category
  3. deterministic extension order when a brand has files in several formats
"""
import os
import re

# Words that, when they follow the brand name in a file name, mean a different organization/product.
REJECT_WORDS = {
    "gardens", "school", "conference", "university", "college", "sensei", "shores", "nations", "bulls", "honke",
    "kani", "biscuits", "ncaa", "corporation", "budvar", "film", "series", "television", "tv", "fc", "club",
    "team", "league", "party", "festival", "hospital", "bank", "airlines", "motors", "magazine", "merry",
    "christmas", "wolf", "rugby", "football", "cricket", "theatre", "museum", "band", "album", "records",
    "studios", "software", "games", "hotel", "casino", "resort", "airport", "stadium", "church", "foundation",
    "institute", "association", "society", "council", "department", "ministry", "symposia", "literary",
    "glatz", "philharmagic",
}

# Exact file names (normalized by fetch_logos.toks) confirmed wrong in audits.
BAD_SOURCES = {
    "black box corporation logo svg", "black box logo svg", "budweiser budvar logo svg", "busch gardens logo 2 svg",
    "busch glatz logo 01 2023 svg", "guinness six nations logo png", "keystone logo from ncaa svg",
    "keystone symposia logo png", "korbel school red and gold logo new 2025 png", "layer cake 2004 logo png",
    "lone star conference old logo svg", "lone star literary logo 190x60 jpg", "mahou sensei negima logo svg",
    "malibu shores spelling television text logo svg", "malibu country logo png",
    "mickeys very merry christmas party logo svg", "mickeys philharmagic logo svg",
    "newcastle red bulls text logo placeholder webp", "sapporo kani honke logo svg", "sheep dog n wolf logo jpg",
    "the prisoner logo line2 svg", "the prisoner logo line jpg", "yamazaki biscuits company logo svg",
}

# A Commons file must sit in at least one category matching this (beverage/alcohol related).
CATEGORY_RE = re.compile(
    r"beer|brew|alcohol|liquor|spirits|whisk|bourbon|vodka|tequila|\brum\b|\bgin\b|cognac|brandy|liqueur|"
    r"wine|vineyard|winery|champagne|\bsake\b|soju|cider|seltzer|cocktail|distill|beverage|drink|malt|\bipa\b|"
    r"anheuser|diageo|pernod|molson|carlsberg|heineken|asahi|kirin|suntory|campari|brown-forman|constellation",
    re.I,
)
EXT_ORDER = ("svg", "png", "jpg", "webp")


def _name(title):
    return re.sub(r"^File:", "", title, flags=re.I)


def install(fl):
    """Patch the fetch_logos module in place."""
    orig_title_ok = fl.title_ok
    orig_wikipedia_logo = fl.wikipedia_logo
    orig_search = fl.imageinfo_by_search

    def is_clean(brand, title):
        name = _name(title)
        if " ".join(fl.toks(name)) in BAD_SOURCES:
            return False
        rest = fl.toks(name.rsplit(".", 1)[0])[len(fl.toks(brand)):]
        return not (set(rest) & REJECT_WORDS)

    def categories_ok(s, title):
        d = fl.api(s, fl.COMMONS, action="query", titles=title, prop="categories", cllimit="max")
        cats = [c.get("title", "") for p in d.get("query", {}).get("pages", []) for c in p.get("categories", [])]
        return any(CATEGORY_RE.search(c) for c in cats)

    def title_ok(brand, title):
        return orig_title_ok(brand, title) and is_clean(brand, title)

    def imageinfo_by_search(s, brand, ftype):
        for page in orig_search(s, brand, ftype)[:5]:
            if categories_ok(s, page["title"]):
                return [page]  # callers only use the first match
        return []

    def wikipedia_logo(s, brand, category):
        info = orig_wikipedia_logo(s, brand, category)
        if not info:
            return None
        title = info.get("title", "")
        # Infobox images are often photos; keep only files that are actually named as logos.
        if "logo" not in fl.toks(_name(title)) or not is_clean(brand, title):
            return None
        return info

    def existing_file(slug):
        for e in EXT_ORDER:
            p = f"{fl.IMG_DIR}/{slug}.{e}"
            if os.path.exists(p) and os.path.getsize(p) > 0:
                return e
        return None

    fl.title_ok = title_ok
    fl.imageinfo_by_search = imageinfo_by_search
    fl.wikipedia_logo = wikipedia_logo
    fl.existing_file = existing_file
