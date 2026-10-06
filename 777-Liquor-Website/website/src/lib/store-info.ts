/** Single source of truth for business details (keep in sync with the Google Business Profile). */
export const STORE = {
  name: "777 Liquor & Grocery",
  shortName: "777 Liquor",
  url: "https://777liquor.com",
  telephone: "+1-808-744-9568",
  telephoneDisplay: "(808) 744-9568",
  email: "777liquorstorehi@gmail.com",
  address: {
    street: "931 University Ave, Ste 107",
    city: "Honolulu",
    region: "HI",
    postalCode: "96826",
    country: "US",
  },
  geo: { lat: 21.2913543, lng: -157.8221555 },
  mapsUrl: "https://maps.google.com/maps?cid=5809780637137439621",
} as const;

export const HOURS = [
  {
    label: "Monday–Friday",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "07:00",
    closes: "23:45",
    display: "7:00 AM – 11:45 PM",
  },
  {
    label: "Saturday–Sunday",
    days: ["Saturday", "Sunday"],
    opens: "09:00",
    closes: "23:45",
    display: "9:00 AM – 11:45 PM",
  },
] as const;

export const SEO_TITLE = "777 Liquor & Grocery | Beer, Spirits & RTDs in Honolulu";
export const SEO_DESCRIPTION =
  "Liquor store on University Ave, Honolulu. Beer, spirits, wine, ready-to-drink cocktails, groceries and keg pre-orders. Open daily until 11:45 PM. Call (808) 744-9568.";

/** schema.org LiquorStore markup for Google (rich local results). */
export function localBusinessJsonLd(imageUrl?: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "LiquorStore",
    name: STORE.name,
    url: STORE.url,
    telephone: STORE.telephone,
    email: STORE.email,
    ...(imageUrl ? { image: imageUrl } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: STORE.address.street,
      addressLocality: STORE.address.city,
      addressRegion: STORE.address.region,
      postalCode: STORE.address.postalCode,
      addressCountry: STORE.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: STORE.geo.lat, longitude: STORE.geo.lng },
    hasMap: STORE.mapsUrl,
    openingHoursSpecification: HOURS.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
  };
}
