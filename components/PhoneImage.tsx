/* eslint-disable @next/next/no-img-element */
import { PhoneArt } from "./PhoneArt";

/**
 * A product photo, or a clean phone drawing when there is no photo yet.
 * Width and height are always set so the page never jumps while images load.
 */
export function PhoneImage({
  images,
  name,
  brand,
  className = "",
  priority = false,
}: {
  images: string[];
  name: string;
  brand: string;
  className?: string;
  priority?: boolean;
}) {
  const src = images[0];
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={800}
        height={800}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${name} (picture coming soon)`}
      className={`flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-surface-sunken ${className}`}
    >
      <PhoneArt seed={brand} className="h-[80%] w-auto drop-shadow-[0_18px_24px_rgba(11,18,32,0.25)]" />
    </div>
  );
}
