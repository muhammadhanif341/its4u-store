"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Three soft lights behind the footer text that slowly drift and fade ("breathe").
 * They pause while the footer is off screen. Purely decorative, so hidden from screen readers.
 */
export function BreathingGlows() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-paused={!visible}
      className="footer-glows pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <span className="footer-glow footer-glow-a" />
      <span className="footer-glow footer-glow-b" />
      <span className="footer-glow footer-glow-c" />
    </div>
  );
}
