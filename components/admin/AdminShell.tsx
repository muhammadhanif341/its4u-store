"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import { Icon, type IconName } from "@/components/Icons";
import { Logo } from "@/components/Logo";

const LINKS: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: "grid", exact: true },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/products", label: "Products", icon: "phone" },
  { href: "/admin/settings", label: "Settings", icon: "sliders" },
];

function SidebarContent({ shopName, pending, pathname, onNavigate }: { shopName: string; pending: number; pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-6">
        <Link href="/admin" onClick={onNavigate} aria-label="Admin home">
          <Logo name={shopName} light />
        </Link>
      </div>
      <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Manage</p>
      <nav aria-label="Admin" className="flex-1 space-y-1 px-3">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-semibold transition ${
                active ? "bg-ink-700 text-white" : "text-slate-300 hover:bg-ink-800 hover:text-white"
              }`}
            >
              {active && <span className="absolute -left-3 top-2.5 bottom-2.5 w-1 rounded-r-full bg-accent-400" aria-hidden="true" />}
              <Icon name={l.icon} className={`h-5 w-5 ${active ? "text-accent-400" : "text-slate-400 group-hover:text-slate-200"}`} />
              {l.label}
              {l.href === "/admin/orders" && pending > 0 && (
                <span
                  className="ml-auto grid h-6 min-w-6 place-items-center rounded-full bg-accent-400 px-1.5 text-xs font-bold text-ink-900"
                  aria-label={`${pending} pending orders`}
                  data-testid="pending-badge"
                >
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold text-slate-300 transition hover:bg-ink-800 hover:text-white"
        >
          <Icon name="external" className="h-5 w-5 text-slate-400" />
          View store
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] font-semibold text-slate-300 transition hover:bg-ink-800 hover:text-white"
          >
            <Icon name="logout" className="h-5 w-5 text-slate-400" />
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({ shopName, pending, children }: { shopName: string; pending: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink-900 lg:block">
        <SidebarContent shopName={shopName} pending={pending} pathname={pathname} />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-lg lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white text-ink-900"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <Logo name={shopName} />
          <span className="relative">
            <Link href="/admin/orders" className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white text-ink-900" aria-label="Orders">
              <Icon name="orders" className="h-5 w-5" />
            </Link>
            {pending > 0 && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-accent-400 ring-2 ring-white" aria-hidden="true" />}
          </span>
        </header>

        <main id="admin-main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-ink-900 shadow-lift">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 grid h-10 w-10 place-items-center rounded-lg text-slate-300 hover:bg-ink-800"
              aria-label="Close menu"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
            <SidebarContent shopName={shopName} pending={pending} pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}
