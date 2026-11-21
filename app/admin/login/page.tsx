import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "@/components/admin/LoginForm";
import { Icon, type IconName } from "@/components/Icons";
import { Logo } from "@/components/Logo";
import { PhoneArt } from "@/components/PhoneArt";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "phone", title: "Phones and stock", text: "Add phones, photos, condition and PTA status in one form." },
  { icon: "orders", title: "Orders in real time", text: "Confirm, ship and track every order from your phone or desktop." },
  { icon: "sliders", title: "Your shop, your rules", text: "Change delivery charges and contact details any time." },
];

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const settings = await getSettings(db);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="hero-mesh relative isolate hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grid-lines absolute inset-0 -z-10" aria-hidden="true" />
        <Logo name={settings.shopName} light />

        <div className="relative z-10 max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-400">Admin panel</p>
          <h2 className="mt-4 !text-[2.5rem] !leading-[1.1] !text-white">Run your whole shop from one screen.</h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="glass grid h-11 w-11 shrink-0 place-items-center rounded-xl">
                  <Icon name={f.icon} className="h-5 w-5 text-accent-300" />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold text-white">{f.title}</span>
                  <span className="mt-0.5 block text-[15px] leading-relaxed text-slate-300">{f.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-slate-400">&copy; {new Date().getFullYear()} {settings.shopName}</p>

        <div className="pointer-events-none absolute -bottom-28 -right-14 z-0 w-52 rotate-12 opacity-60 xl:-bottom-20 xl:w-56 xl:opacity-90" aria-hidden="true">
          <div className="animate-float-slow">
            <PhoneArt seed="Apple" className="drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-surface px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo name={settings.shopName} />
          </div>
          <div className="card p-8 sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow">
              <Icon name="lock" className="h-6 w-6" />
            </span>
            <h1 className="mt-6 !text-[2rem]">Welcome back</h1>
            <p className="mt-2 text-[15px] text-muted">Sign in to manage phones, orders and settings.</p>
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            <Link href="/" className="font-semibold text-brand-700 hover:underline">
              &larr; Back to the store
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
