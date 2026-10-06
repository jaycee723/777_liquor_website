import { HOURS, STORE } from "../lib/store-info";

/** Visible name/address/phone/hours block (matches the Google Business Profile and the JSON-LD). */
export function StoreInfo() {
  const link = { color: "inherit", textDecoration: "underline" } as const;
  return (
    <address className="store-info" style={{ fontStyle: "normal", marginTop: 24, lineHeight: 1.7 }}>
      <strong>{STORE.name}</strong>
      <br />
      {STORE.address.street}
      <br />
      {STORE.address.city}, {STORE.address.region} {STORE.address.postalCode}
      <br />
      <a href={`tel:${STORE.telephone}`} style={link}>
        {STORE.telephoneDisplay}
      </a>
      {" · "}
      <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" style={link}>
        Get directions
      </a>
      <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
        {HOURS.map((h) => (
          <li key={h.label}>
            {h.label}: {h.display}
          </li>
        ))}
      </ul>
    </address>
  );
}
