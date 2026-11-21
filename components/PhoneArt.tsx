import { useId } from "react";

/** Colour pairs for the phone's wallpaper. A brand name always picks the same one. */
const PALETTES: [string, string, string][] = [
  ["#5B63F2", "#22D3EE", "#C8CFFF"],
  ["#8B5CF6", "#F472B6", "#EDE9FE"],
  ["#10B981", "#22D3EE", "#D1FAE5"],
  ["#F59E0B", "#F43F5E", "#FEF3C7"],
  ["#0EA5E9", "#6366F1", "#E0F2FE"],
  ["#334155", "#6366F1", "#E2E8F0"],
];

export function paletteIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % PALETTES.length;
}

/** A clean, modern phone drawing. Used when a product has no photo, and in the hero. */
export function PhoneArt({ seed = "its4u", className = "", label }: { seed?: string; className?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  const [c1, c2, c3] = PALETTES[paletteIndex(seed)];
  return (
    <svg
      viewBox="0 0 220 440"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2B3A5E" />
          <stop offset="1" stopColor="#0B1220" />
        </linearGradient>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.25" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="14" y="14" width="192" height="412" rx="30" />
        </clipPath>
      </defs>

      <rect x="2" y="2" width="216" height="436" rx="40" fill={`url(#${id}-body)`} />
      <rect x="2" y="2" width="216" height="436" rx="40" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />
      <rect x="-2" y="96" width="5" height="44" rx="2" fill="#2B3A5E" />
      <rect x="217" y="120" width="5" height="64" rx="2" fill="#2B3A5E" />

      <g clipPath={`url(#${id}-clip)`}>
        <rect x="14" y="14" width="192" height="412" fill={`url(#${id}-screen)`} />
        <circle cx="170" cy="120" r="110" fill={c3} fillOpacity="0.28" />
        <circle cx="30" cy="330" r="130" fill="#fff" fillOpacity="0.14" />
        <path d="M-10 300 C 60 250, 120 360, 240 290 L 240 460 L -10 460 Z" fill="#0B1220" fillOpacity="0.28" />
        <rect x="14" y="14" width="192" height="412" fill={`url(#${id}-glow)`} />

        {/* lock-screen: clock + widgets, drawn as shapes so no text ends up in the page */}
        <rect x="66" y="88" width="88" height="10" rx="5" fill="#fff" fillOpacity="0.55" />
        <rect x="48" y="108" width="124" height="30" rx="15" fill="#fff" fillOpacity="0.92" />
        <rect x="42" y="170" width="136" height="54" rx="16" fill="#fff" fillOpacity="0.2" />
        <rect x="42" y="236" width="64" height="64" rx="18" fill="#fff" fillOpacity="0.2" />
        <rect x="114" y="236" width="64" height="64" rx="18" fill="#fff" fillOpacity="0.2" />
      </g>

      <rect x="82" y="24" width="56" height="16" rx="8" fill="#050810" />
      <rect x="78" y="414" width="64" height="4" rx="2" fill="#fff" fillOpacity="0.7" />
    </svg>
  );
}
