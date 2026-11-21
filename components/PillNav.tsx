"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BUDGETS, budgetHref } from "@/lib/storefront";
import { Icon } from "./Icons";

export type NavMenu = { id: string; label: string; items: { href: string; label: string; hint?: string }[] };

/** The menus that open from the pill bar. Brands come from the shop's own phones. */
export function buildMenus(brands: string[]): NavMenu[] {
  const menus: NavMenu[] = [
    {
      id: "shop",
      label: "Shop",
      items: [
        { href: "/shop", label: "All phones", hint: "Everything in stock" },
        { href: "/shop?type=new", label: "New phones", hint: "Box packed" },
        { href: "/shop?type=used", label: "Used phones", hint: "Graded by condition" },
      ],
    },
    {
      id: "pta",
      label: "PTA status",
      items: [
        { href: "/shop?pta=pta", label: "PTA Approved", hint: "Works on any local SIM" },
        { href: "/shop?pta=non-pta", label: "Non-PTA", hint: "Lower prices" },
        { href: "/shop?pta=jv", label: "JV sets", hint: "Ask us about network" },
      ],
    },
  ];
  if (brands.length > 0) {
    menus.push({
      id: "brands",
      label: "Brands",
      items: brands.map((b) => ({ href: `/shop?brand=${encodeURIComponent(b)}`, label: b })),
    });
  }
  menus.push({
    id: "budget",
    label: "Budget",
    items: BUDGETS.map((b) => ({ href: budgetHref(b), label: b.label, hint: b.hint })),
  });
  return menus;
}

const LINKS = [
  { href: "/how-to-buy", label: "How to buy" },
  { href: "/track", label: "Track order" },
];

const pill = "inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition";

/** A bar of pills. Some open a menu (click, tap, hover or keyboard); Escape closes it. */
export function PillNav({ brands }: { brands: string[] }) {
  const menus = buildMenus(brands);
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(null), 180);
  };

  return (
    <nav
      ref={root}
      aria-label="Main"
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(null);
          (document.getElementById(`pill-${open}`) as HTMLElement | null)?.focus();
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(null);
      }}
    >
      <ul className="flex items-center gap-1 py-2" data-testid="pill-nav">
        {menus.map((m) => {
          const isOpen = open === m.id;
          return (
            <li key={m.id} className="relative" onMouseEnter={() => { cancelClose(); setOpen(m.id); }} onMouseLeave={scheduleClose}>
              <button
                id={`pill-${m.id}`}
                type="button"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-controls={`menu-${m.id}`}
                onClick={() => setOpen(isOpen ? null : m.id)}
                className={`${pill} ${isOpen ? "bg-ink-900 text-white" : "text-body hover:bg-brand-50 hover:text-brand-700"}`}
              >
                {m.label}
                <Icon name="arrow" className={`h-3.5 w-3.5 transition ${isOpen ? "-rotate-90" : "rotate-90"}`} />
              </button>
              {isOpen && (
                <ul
                  id={`menu-${m.id}`}
                  className="absolute left-0 top-full z-50 mt-1 w-64 animate-fade-up rounded-2xl border border-line bg-white p-2 shadow-lift motion-reduce:animate-none"
                >
                  {m.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(null)}
                        className="block rounded-xl px-3 py-2.5 transition hover:bg-brand-50"
                      >
                        <span className="block text-sm font-semibold text-ink-900">{item.label}</span>
                        {item.hint && <span className="block text-xs text-muted">{item.hint}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={`${pill} text-body hover:bg-brand-50 hover:text-brand-700`}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
