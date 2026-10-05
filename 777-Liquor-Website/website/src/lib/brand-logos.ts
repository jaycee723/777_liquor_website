import { BRAND_DOMAINS } from "./brand-domains";

/**
 * Brand logo lookup. Order of preference:
 *  1. a verified logo file in /images/brands (from /images/brands/brands.json, built by scripts/fetch_logos.py)
 *  2. the Brandfetch Logo API for the brand's website domain (BRAND_DOMAINS)
 *  3. /images/placeholder.svg
 * Client-side helpers.
 */
export type BrandLogoEntry = {
  slug: string;
  brand: string;
  category: string;
  logo: string | null;
  status: string;
};

type BrandIndex = { fallback: string; brands: BrandLogoEntry[] };

export const PLACEHOLDER_LOGO = "/images/placeholder.svg";
/** Brandfetch client IDs are public identifiers and are meant to be used in browser code. */
const BRANDFETCH_CLIENT_ID = "1idQH8jO7RrKajunQnH";

let indexPromise: Promise<BrandIndex> | null = null;

export function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

export function brandfetchUrl(domain: string): string {
  return `https://cdn.brandfetch.io/${domain}?c=${BRANDFETCH_CLIENT_ID}`;
}

function loadIndex(): Promise<BrandIndex> {
  if (!indexPromise) {
    indexPromise = fetch("/images/brands/brands.json")
      .then((r) => {
        if (!r.ok) throw new Error(`brands.json ${r.status}`);
        return r.json() as Promise<BrandIndex>;
      })
      .catch(() => {
        indexPromise = null;
        return { fallback: PLACEHOLDER_LOGO, brands: [] };
      });
  }
  return indexPromise;
}

/** Ordered list of logo URLs to try for a brand; the last entry is always the placeholder. */
export async function getBrandLogoSources(brand: string): Promise<string[]> {
  const slug = brandSlug(brand);
  const index = await loadIndex();
  const sources: string[] = [];
  const local = index.brands.find((b) => b.slug === slug)?.logo;
  if (local) sources.push(local);
  const domain = BRAND_DOMAINS[slug];
  if (domain) sources.push(brandfetchUrl(domain));
  sources.push(index.fallback || PLACEHOLDER_LOGO);
  return sources;
}

/** Returns the first (best) logo URL, or the placeholder when nothing is known. */
export async function getBrandLogo(brand: string): Promise<string> {
  return (await getBrandLogoSources(brand))[0];
}
