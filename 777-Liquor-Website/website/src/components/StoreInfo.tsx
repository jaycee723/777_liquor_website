import { HOURS, STORE } from "../lib/store-info";

function trackContact(event: "phone_click" | "directions_click") {
  if (typeof window === "undefined") return;
  const analytics = window as Window & { gtag?: (...args: unknown[]) => void };
  try {
    analytics.gtag?.("event", event, {
      send_to: "G-MJFFH0G7VF",
      contact_location: "store_info",
      transport_type: "beacon",
    });
  } catch {
    /* Tracking must not block navigation. */
  }
}

export function StoreInfo() {
  return (
    <address
      className="store-info not-italic mt-6 leading-relaxed text-[#d1e3df]"
      suppressHydrationWarning
    >
      <strong className="text-white">{STORE.name}</strong>
      <br />
      {STORE.address.street}
      <br />
      {STORE.address.city}, {STORE.address.region} {STORE.address.postalCode}
      <br />
      <a
        href={`tel:${STORE.telephone}`}
        className="text-white underline"
        onClick={() => trackContact("phone_click")}
      >
        {STORE.telephoneDisplay}
      </a>
      {" · "}
      <a
        href={STORE.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white underline"
        onClick={() => trackContact("directions_click")}
      >
        Get directions
      </a>
      <ul className="list-none p-0 mt-3">
        {HOURS.map((h) => (
          <li key={h.label}>
            {h.label}: {h.display}
          </li>
        ))}
      </ul>
      <p>
        <a href="/cooler-door/" className="text-white underline">
          Cooler Door — browse the beverage menu
        </a>
      </p>
    </address>
  );
}
