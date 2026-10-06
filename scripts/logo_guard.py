"""Extra safety filters for fetch_logos.py: reject logos that belong to a different entity than the brand.

Found by auditing the first run: Commons search returned e.g. 'Busch Gardens', 'Guinness Six Nations',
'Mahou Sensei Negima', 'Sapporo Kani Honke' for the beer/liquor brands of the same name.
Use via scripts/run_fetch.py (installs these filters, then runs fetch_logos.main()).
"""
import re

# Words that, when they follow the brand name in a file name, mean a different organization/product.
REJECT_WORDS = {
    "gardens", "school", "conference", "university", "college", "sensei", "shores", "nations", "bulls", "honke",
    "kani", "biscuits", "ncaa", "corporation", "budvar", "film", "series", "television", "tv", "fc", "club",
    "team", "league", "party", "festival", "hospital", "bank", "airlines", "motors", "magazine", "merry",
    "christmas", "wolf", "rugby", "football", "cricket", "theatre", "museum", "band", "album", "records",
    "studios", "software", "games", "hotel", "casino", "resort", "airport", "stadium", "church", "foundation",
    "institute", "association", "society", "council", "department", "ministry",
}

# Exact Commons/Wikipedia file names (normalized) confirmed wrong in the audit.
BAD_SOURCES = {
    "black box corporation logo svg", "budweiser budvar logo svg", "busch gardens logo 2 svg",
    "guinness six nations logo png", "keystone logo from ncaa svg", "korbel school red and gold logo new 2025 png",
    "layer cake 2004 logo png", "lone star conference old logo svg", "mahou sensei negima logo svg",
    "malibu shores spelling television text logo svg", "mickey s very merry christmas party logo svg",
    "newcastle red bulls text logo placeholder webp", "sapporo kani honke logo svg", "sheep dog n wolf logo jpg",
    "the prisoner logo line2 svg", "yamazaki biscuits company logo svg",
}

def _name(title):
    return re.sub(r"^File:", "", title, flags=re.I)

def install(fl):
    """Patch the fetch_logos module in place."""
    orig_title_ok = fl.title_ok
    orig_wikipedia_logo = fl.wikipedia_logo

    def is_clean(brand, title):
        name = _name(title)
        norm = " ".join(fl.toks(name))
        if norm in BAD_SOURCES:
            return False
        rest = fl.toks(name.rsplit(".", 1)[0])[len(fl.toks(brand)):]
        return not (set(rest) & REJECT_WORDS)

    def title_ok(brand, title):
        return orig_title_ok(brand, title) and is_clean(brand, title)

    def wikipedia_logo(s, brand, category):
        info = orig_wikipedia_logo(s, brand, category)
        if not info:
            return None
        title = info.get("title", "")
        # Infobox images are often photos; keep only files that are actually named as logos.
        if "logo" not in fl.toks(_name(title)) or not is_clean(brand, title):
            return None
        return info

    fl.title_ok = title_ok
    fl.wikipedia_logo = wikipedia_logo
