"use client";

import { useState } from "react";
import { PhoneImage } from "./PhoneImage";

export function Gallery({ images, name, brand }: { images: string[]; name: string; brand: string }) {
  const [index, setIndex] = useState(0);
  const current = images.length ? [images[Math.min(index, images.length - 1)]] : [];

  return (
    <div>
      <div className="card overflow-hidden bg-surface-sunken">
        <PhoneImage images={current} name={name} brand={brand} className="aspect-square w-full" priority />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <li key={src + i} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={`h-20 w-20 overflow-hidden rounded-xl border-2 bg-white transition ${i === index ? "border-brand-600 shadow-glow" : "border-line hover:border-brand-300"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" width={80} height={80} loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
