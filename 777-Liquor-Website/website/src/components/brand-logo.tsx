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

  return (
    <img
      src={sources[i]}
      alt={`${brand} logo`}
      width={size}
      height={size}
      loading="lazy"
      className={className}
      onError={next}
      onLoad={(e) => {
        // Brandfetch returns a tiny generic image for unknown domains; treat it as a miss.
        if (sources[i].includes("cdn.brandfetch.io") && e.currentTarget.naturalWidth <= 64) next();
      }}
    />
  );
}
