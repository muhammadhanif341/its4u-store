"use client";

import { useEffect, useState } from "react";

export type NavSection = { id: string; label: string };

/**
 * "On this page" links that follow the reader down the page (a table of contents).
 * `rail` is the vertical list in the left sidebar, `bar` is the row of pills used on smaller screens.
 */
export function SectionNav({ sections, variant }: { sections: NavSection[]; variant: "rail" | "bar" }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // the first section (from the top of the page) that is on screen is the current one
        const current = sections.find((s) => visible.has(s.id));
        if (current) setActive(current.id);
      },
      { rootMargin: "-176px 0px -55% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [sections]);

  if (variant === "bar") {
    return (
      <nav aria-label="On this page" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" data-testid="section-nav-bar">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={active === s.id ? "location" : undefined}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active === s.id ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-white text-body hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="On this page" data-testid="section-nav-rail">
      <ul className="relative space-y-0.5 border-l border-line">
        {sections.map((s) => {
          const on = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={on ? "location" : undefined}
                className={`-ml-px block border-l-2 py-2 pl-4 pr-2 text-sm transition ${
                  on ? "border-brand-500 font-semibold text-brand-700" : "border-transparent text-body hover:border-brand-300 hover:text-ink-900"
                }`}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
