"use client";

import { useState } from "react";
import { PTA_STATUSES } from "@/lib/constants";
import { CONDITION_SCORE } from "@/lib/content";
import { PTA_TONE, toneFor } from "@/lib/ui";
import { Icon, type IconName } from "../Icons";

type Feature = {
  id: string;
  icon: IconName;
  tab: string;
  title: string;
  text: string;
  points: string[];
  visual: "grades" | "pta" | "delivery" | "chat";
};

export const FEATURES: Feature[] = [
  {
    id: "graded",
    icon: "star",
    tab: "Honest grading",
    title: "Every used phone is graded, in plain numbers",
    text: "No guessing what Good or Excellent means. Each phone gets a score out of 10 and the battery health is written on the listing.",
    points: ["Six clear grades from Fair to New", "Battery health shown on the phone's page", "The same rules for every phone we sell"],
    visual: "grades",
  },
  {
    id: "pta",
    icon: "shield",
    tab: "Clear PTA status",
    title: "PTA Approved, Non-PTA or JV, written on every phone",
    text: "You always know whether the phone will work on a local SIM before you order, and what the tax rules mean for you.",
    points: ["A coloured tag on every card and page", "Plain-words explanation, no jargon", "Filter the whole shop by PTA status"],
    visual: "pta",
  },
  {
    id: "cod",
    icon: "cash",
    tab: "Pay on delivery",
    title: "Check the phone first, then pay the rider",
    text: "No advance payment. When the parcel arrives, look at the phone, check the IMEI, and pay only when you are happy.",
    points: ["Cash on Delivery across Pakistan", "A short checklist for the moment of delivery", "Track your order with your phone number"],
    visual: "delivery",
  },
  {
    id: "support",
    icon: "chat",
    tab: "Human support",
    title: "Real people on WhatsApp",
    text: "Not sure which phone fits your budget? Tell us what you need and we will suggest options, or answer questions about any listing.",
    points: ["Ask about a phone before you buy", "Order on WhatsApp if you prefer", "Help with delivery and tracking"],
    visual: "chat",
  },
];

function Visual({ kind }: { kind: Feature["visual"] }) {
  if (kind === "grades") {
    const rows = [
      ["Like New", CONDITION_SCORE["like-new"]],
      ["Excellent", CONDITION_SCORE.excellent],
      ["Good", CONDITION_SCORE.good],
      ["Fair", CONDITION_SCORE.fair],
    ] as const;
    return (
      <div className="space-y-4">
        {rows.map(([label, score]) => (
          <div key={label}>
            <div className="flex justify-between text-sm font-semibold text-ink-900">
              <span>{label}</span>
              <span>{score}/10</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-sunken">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${score * 10}%` }} />
            </div>
          </div>
        ))}
        <p className="flex items-center gap-2 pt-1 text-sm text-muted">
          <Icon name="battery" className="h-4 w-4 text-brand-600" /> Battery health: 94%
        </p>
      </div>
    );
  }
  if (kind === "pta") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {PTA_STATUSES.map((p) => (
          <span key={p.value} className={`badge px-4 py-2 text-sm ${toneFor(PTA_TONE, p.value)}`}>
            {p.label}
          </span>
        ))}
        <p className="mt-2 w-full text-sm leading-relaxed text-muted">The tag is on every card, every page and every filter.</p>
      </div>
    );
  }
  if (kind === "delivery") {
    const steps = [
      { icon: "orders" as const, label: "You order" },
      { icon: "truck" as const, label: "We deliver" },
      { icon: "eye" as const, label: "You check" },
      { icon: "cash" as const, label: "You pay" },
    ];
    return (
      <ol className="grid grid-cols-4 gap-2 text-center">
        {steps.map((s, i) => (
          <li key={s.label} className="flex flex-col items-center gap-2">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Icon name={s.icon} className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-ink-900 sm:text-sm">
              <span className="sr-only">{i + 1}. </span>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <div className="space-y-3 text-sm">
      <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface-sunken px-4 py-3 text-ink-900">Hi! I want a PTA iPhone under Rs. 200,000.</p>
      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-3 text-white">Sure. Here are three good options with battery health and warranty.</p>
      <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface-sunken px-4 py-3 text-ink-900">Great, I will order the second one.</p>
    </div>
  );
}

/** A list of reasons on the left and the chosen one shown on the right. Works with a click, a tap or the arrow keys. */
export function FeatureShowcase() {
  const [active, setActive] = useState(FEATURES[0].id);
  const current = FEATURES.find((f) => f.id === active) ?? FEATURES[0];

  function onKey(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    const next = FEATURES[(i + step + FEATURES.length) % FEATURES.length];
    setActive(next.id);
    document.getElementById(`feature-tab-${next.id}`)?.focus();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]" data-testid="feature-showcase">
      <div role="tablist" aria-label="Why shop with us" aria-orientation="vertical" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {FEATURES.map((f, i) => {
          const on = f.id === active;
          return (
            <button
              key={f.id}
              id={`feature-tab-${f.id}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`feature-panel-${f.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(f.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                on ? "border-brand-400 bg-brand-50 shadow-soft" : "border-line bg-white hover:border-brand-300"
              }`}
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${on ? "bg-brand-600 text-white shadow-glow" : "bg-surface-sunken text-brand-700"}`}>
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <span className="font-semibold text-ink-900">{f.tab}</span>
            </button>
          );
        })}
      </div>

      {FEATURES.map((f) => (
        <div
          key={f.id}
          id={`feature-panel-${f.id}`}
          role="tabpanel"
          aria-labelledby={`feature-tab-${f.id}`}
          hidden={f.id !== current.id}
          className={`card grid gap-8 p-6 sm:p-8 md:grid-cols-2 lg:col-start-2 lg:row-start-1 ${f.id !== current.id ? "!hidden" : ""}`}
        >
          <div>
            <h3 className="text-xl font-semibold sm:text-2xl">{f.title}</h3>
            <p className="mt-3 leading-relaxed text-body">{f.text}</p>
            <ul className="mt-5 space-y-2.5">
              {f.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[15px] text-ink-800">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-tone-success-bg text-tone-success-fg">
                    <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="self-center rounded-2xl border border-line bg-surface p-5">
            <Visual kind={f.visual} />
          </div>
        </div>
      ))}
    </div>
  );
}
