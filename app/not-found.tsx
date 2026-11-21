import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icons";
import { PhoneArt } from "@/components/PhoneArt";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main className="hero-mesh relative isolate grid min-h-screen place-items-center overflow-hidden px-4 py-16 text-center">
      <div className="grid-lines absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto max-w-lg">
        <PhoneArt seed="Samsung" className="mx-auto h-44 w-auto -rotate-6 drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" />
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-accent-400">Error 404</p>
        <h1 className="mt-2 !text-white">We could not find that page</h1>
        <p className="mt-4 text-lead !text-slate-300">The phone or page you are looking for may have been sold, moved or never existed.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-accent !min-h-[52px] px-7 text-base">
            Browse all phones
            <Icon name="arrow" className="h-5 w-5" />
          </Link>
          <Link href="/" className="btn-glass !min-h-[52px] px-7 text-base">
            Go to home page
          </Link>
        </div>
      </div>
    </main>
  );
}
