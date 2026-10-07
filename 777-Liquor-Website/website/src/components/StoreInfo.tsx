import { HOURS, STORE } from "../lib/store-info";

function trackContact(event: "phone_click" | "directions_click") {
  if (typeof window === "undefined") return;
  const analytics = window as Window & {
    gtag?: (...args: unknown[]) => void;
  };
  try {
    analytics.gtag?.("event", event, {
      send_to: "G-MJFFH0G7VF",
      contact_location: "store_info",
      transport_type: "beacon",
    });
  } catch {
    // Tracking must never prevent calling the store or opening directions.
  }
}

/** Visible name/address/phone/hours block with GA4 contact-click tracking. */
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
      <a href={`tel:${STORE.telephone}`} style={link} onClick={() => trackContact("phone_click")}>
        {STORE.telephoneDisplay}
      </a>
      {" · "}
      <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" style={link} onClick={() => trackContact("directions_click")}>
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
