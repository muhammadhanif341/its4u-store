"use client";

import { useEffect, useState } from "react";

/** The next index in a list, wrapping to the start. */
export function nextIndex(current: number, length: number): number {
  return length <= 0 ? 0 : (current + 1) % length;
}

/**
 * A word that changes every couple of seconds ("iPhone", "Galaxy", "Pixel"...).
 * All the words sit in the same grid cell, so the line never changes width or jumps.
 * It is decorative: screen readers and search engines read the plain text in the heading instead.
 * With "reduce motion" on, it stays on the first word.
 */
export function RotatingText({ words, interval = 2600 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((i) => nextIndex(i, words.length));
    }, interval);
    return () => window.clearInterval(id);
  }, [words, interval]);

  return (
    <span aria-hidden="true" className="inline-grid align-baseline" data-testid="rotating-text">
      {words.map((w, i) => (
        <span
          key={w}
          className={`col-start-1 row-start-1 text-gradient transition-all duration-500 ease-out ${
            i === index ? "translate-y-0 opacity-100" : i === (index - 1 + words.length) % words.length ? "-translate-y-[60%] opacity-0" : "translate-y-[60%] opacity-0"
          }`}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
