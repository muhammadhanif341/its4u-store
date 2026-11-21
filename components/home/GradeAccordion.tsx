"use client";

import { useState } from "react";
import { CONDITION_SCORE, CONDITION_TEXT } from "@/lib/content";
import { CONDITIONS } from "@/lib/constants";
import { CONDITION_TONE, toneFor } from "@/lib/ui";

/**
 * The six condition grades as panels. On wide screens they sit side by side and the chosen one opens wide
 * (like the blades of an aperture opening); on phones they stack and open downwards.
 * Hover, focus or press a grade to open it. Every grade's text is in the page at all times.
 */
export function GradeAccordion() {
  const [open, setOpen] = useState<string>(CONDITIONS[0].value);

  return (
    <div className="flex flex-col gap-3 lg:h-[22rem] lg:flex-row" data-testid="grade-accordion">
      {CONDITIONS.map((c) => {
        const on = open === c.value;
        const score = CONDITION_SCORE[c.value];
        return (
          <div
            key={c.value}
            className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:min-w-0 ${
              on ? "border-brand-300 shadow-lift lg:flex-[5]" : "border-line lg:flex-1"
            }`}
            onMouseEnter={() => setOpen(c.value)}
          >
            <button
              type="button"
              aria-expanded={on}
              aria-controls={`grade-${c.value}`}
              onClick={() => setOpen(c.value)}
              onFocus={() => setOpen(c.value)}
              className={`flex w-full items-center justify-between gap-3 p-4 text-left lg:p-5 ${on ? "lg:items-start" : "lg:h-full lg:flex-col lg:items-start lg:justify-between"}`}
            >
              <span className={`badge ${toneFor(CONDITION_TONE, c.value)}`}>{c.short}</span>
              <span className={`font-display font-bold text-ink-900 transition-all ${on ? "text-4xl" : "text-xl lg:[writing-mode:vertical-rl] lg:rotate-180"}`}>
                {score}
                <span className="text-base font-semibold text-muted">/10</span>
              </span>
            </button>
            <div
              id={`grade-${c.value}`}
              className={`px-4 pb-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:px-5 lg:pb-5 ${on ? "block" : "hidden lg:block lg:pointer-events-none lg:opacity-0"} lg:transition-opacity ${on ? "lg:opacity-100" : ""}`}
            >
              <div className="h-2 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${score * 10}%` }} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-body lg:max-w-md">{CONDITION_TEXT[c.value]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
