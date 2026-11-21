"use client";

import { useRef, useState } from "react";
import { Icon } from "../Icons";

/** Move through a stack: `by` can be negative, and it wraps around at both ends. */
export function stepIndex(current: number, by: number, length: number): number {
  if (length <= 0) return 0;
  return (((current + by) % length) + length) % length;
}

/**
 * A stack of cards. The top card is in front, the next ones peek out behind it.
 * Swipe or drag the top card, press the arrow buttons, or use the left and right arrow keys.
 * Every card stays in the page for search engines; only the visual order changes.
 */
export function CardStack({ items, label }: { items: React.ReactNode[]; label: string }) {
  const [active, setActive] = useState(0);
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const n = items.length;

  const go = (by: number) => setActive((i) => stepIndex(i, by, n));

  return (
    <div className="mx-auto w-full max-w-[380px]" role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        className="relative aspect-[4/5.6] touch-pan-y select-none outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40 rounded-3xl"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(-1);
          }
        }}
        onPointerDown={(e) => {
          start.current = e.clientX;
        }}
        onPointerMove={(e) => {
          if (start.current !== null) setDx(e.clientX - start.current);
        }}
        onPointerUp={() => {
          if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
          start.current = null;
          setDx(0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDx(0);
        }}
      >
        {items.map((item, i) => {
          const depth = stepIndex(i, -active, n); // 0 = on top
          const shown = depth < 3;
          return (
            <div
              key={i}
              aria-hidden={depth !== 0}
              inert={depth !== 0}
              className="absolute inset-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{
                zIndex: n - depth,
                opacity: shown ? 1 - depth * 0.18 : 0,
                transform:
                  depth === 0
                    ? `translateX(${dx}px) rotate(${dx / 40}deg)`
                    : `translateY(${depth * 22}px) scale(${1 - depth * 0.06})`,
                pointerEvents: depth === 0 ? "auto" : "none",
              }}
            >
              {item}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <button type="button" onClick={() => go(-1)} aria-label="Previous phone" className="btn-outline !h-12 !w-12 !min-h-0 !rounded-full !p-0">
          <Icon name="arrow" className="h-5 w-5 rotate-180" />
        </button>
        <div className="flex items-center gap-2" role="group" aria-label="Choose a phone">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show phone ${i + 1} of ${n}`}
              aria-current={i === active}
              className={`h-2.5 rounded-full transition-all ${i === active ? "w-7 bg-brand-500" : "w-2.5 bg-line hover:bg-brand-300"}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(1)} aria-label="Next phone" className="btn-outline !h-12 !w-12 !min-h-0 !rounded-full !p-0">
          <Icon name="arrow" className="h-5 w-5" />
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{`Phone ${active + 1} of ${n}`}</p>
    </div>
  );
}
