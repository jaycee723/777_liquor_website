import { useEffect, useState } from "react";
import { PLACEHOLDER_LOGO, getBrandLogoSources } from "../lib/brand-logos";

type BrandLogoProps = { brand: string; size?: number; className?: string };

/** Shows a brand's logo, falling back through local file -> Brandfetch -> placeholder. */
export function BrandLogo({ brand, size = 64, className }: BrandLogoProps) {
  const [sources, setSources] = useState<string[]>([PLACEHOLDER_LOGO]);
  const [i, setI] = useState(0);

  useEffect(() => {
    let live = true;
    getBrandLogoSources(brand).then((s) => {
      if (live) {
        setSources(s);
        setI(0);
      }
    });
    return () => {
      live = false;
    };
  }, [brand]);

  const next = () => setI((n) => Math.min(n + 1, sources.length - 1));
  const source = sources[i] || PLACEHOLDER_LOGO;
  if (source === PLACEHOLDER_LOGO || source.endsWith("/placeholder.svg")) return null;

  return (
    <img
      src={source}
      alt={`${brand} logo`}
      width={size}
      height={size}
      loading="lazy"
      className={className}
      onError={next}
      onLoad={(e) => {
        // Brandfetch returns a tiny generic image for unknown domains; treat it as a miss.
        let isBrandfetch = false;
        try {
          isBrandfetch = new URL(source, window.location.origin).hostname === "cdn.brandfetch.io";
        } catch {
          isBrandfetch = false;
        }
        if (isBrandfetch && e.currentTarget.naturalWidth <= 64) next();
      }}
    />
  );
}
