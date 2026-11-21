import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Settings } from "@/lib/constants";
import { HELP_LINKS, SHOP_LINKS, prettyWhatsapp, safeCreditUrl, telHref } from "@/lib/footer";
import { whatsappUrl } from "@/lib/format";
import { BreathingGlows } from "./BreathingGlows";
import { Icon } from "./Icons";
import { Logo } from "./Logo";

/** `--i` staggers the fade-up: higher numbers appear a little later as you scroll. */
const delay = (i: number) => ({ "--i": i }) as CSSProperties;

function ColumnTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="pb-2 pl-3.5 font-display text-xs font-bold uppercase tracking-[0.16em] text-accent-400">{children}</h2>
  );
}

const linkClass =
  "group relative flex min-h-[40px] items-center py-1.5 pl-3.5 text-[15px] text-[#CBD5E1] transition-colors duration-200 hover:text-white";

/** A dot slides in on the left when you point at a link. */
function Dot() {
  return (
    <span
      className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-1 -translate-y-1/2 scale-50 rounded-full bg-accent-400 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:scale-100 group-focus-visible:opacity-100"
      aria-hidden="true"
    />
  );
}

export function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  const wa = whatsappUrl(settings.whatsapp, `Hello ${settings.shopName}, I have a question.`);
  const creditUrl = safeCreditUrl(process.env.NEXT_PUBLIC_CREDIT_URL);

  const credit = (
    <>
      <Icon name="sparkle" className="h-3.5 w-3.5 animate-spin-slow text-accent-400" />
      Website by HK DevLab
    </>
  );

  return (
    <footer className="relative mt-24 px-3 sm:px-6">
      <div className="footer-card relative isolate mx-auto w-full max-w-[1200px] overflow-hidden">
        <BreathingGlows />

        <div className="relative z-10 flex flex-col gap-14 p-7 pb-9 sm:p-12 lg:p-16">
          <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
            {/* Brand */}
            <div className="reveal flex max-w-sm flex-col items-start gap-5 pl-3.5" style={delay(0)}>
              <Link href="/" aria-label={`${settings.shopName} home`} className="rounded-lg">
                <Logo name={settings.shopName} light />
              </Link>
              <p className="text-[15px] leading-relaxed text-[#CBD5E1]">
                {settings.tagline}. Honest condition, clear PTA status, and cash on delivery.
              </p>
              <a href={wa} target="_blank" rel="noreferrer" className="glow-cta btn bg-accent-400 !min-h-[46px] px-6 text-ink-900 hover:bg-accent-300">
                <Icon name="chat" className="h-5 w-5" />
                Chat on WhatsApp
                <Icon name="arrow" className="h-4 w-4" />
              </a>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-[1fr_1.2fr_1.5fr] lg:max-w-[720px] lg:flex-1 lg:gap-x-8 xl:gap-x-10">
              <nav aria-label="Shop" className="reveal" style={delay(1)}>
                <ColumnTitle>Shop</ColumnTitle>
                <ul>
                  {SHOP_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={linkClass}>
                        <Dot />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-label="Help" className="reveal" style={delay(2)}>
                <ColumnTitle>Help</ColumnTitle>
                <ul>
                  {HELP_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={linkClass}>
                        <Dot />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <a href={wa} target="_blank" rel="noreferrer" className={linkClass}>
                      <Dot />
                      Ask us on WhatsApp
                    </a>
                  </li>
                </ul>
              </nav>

              <div className="reveal col-span-2 sm:col-span-1" style={delay(3)}>
                <ColumnTitle>Contact</ColumnTitle>
                <address className="not-italic">
                  <ul>
                    <li>
                      <a href={telHref(settings.phone)} className={`${linkClass} whitespace-nowrap`}>
                        <Dot />
                        {settings.phone}
                      </a>
                    </li>
                    <li>
                      <a href={wa} target="_blank" rel="noreferrer" className={`${linkClass} whitespace-nowrap`}>
                        <Dot />
                        WhatsApp {prettyWhatsapp(settings.whatsapp)}
                      </a>
                    </li>
                    <li className="flex gap-2.5 py-1.5 pl-3.5 text-[15px] leading-snug text-[#CBD5E1]">
                      <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                      {settings.address}
                    </li>
                  </ul>
                </address>
              </div>
            </div>
          </div>

          <div className="footer-divider reveal-x" aria-hidden="true" />

          <div className="flex flex-col gap-3 pl-3.5 sm:flex-row sm:items-center sm:justify-between sm:pl-0 sm:pr-0">
            <p className="reveal text-xs uppercase tracking-[0.06em] text-[#C0CADB]" style={delay(4)}>
              &copy; {year} {settings.shopName}. All rights reserved. Prices are in Pakistani rupees.
            </p>
            {creditUrl ? (
              <a
                href={creditUrl}
                target="_blank"
                rel="noreferrer"
                className="reveal flex items-center gap-2 text-xs uppercase tracking-[0.06em] text-[#E8EEFA] transition-colors hover:text-accent-300"
                style={delay(5)}
              >
                {credit}
              </a>
            ) : (
              <p className="reveal flex items-center gap-2 text-xs uppercase tracking-[0.06em] text-[#E8EEFA]" style={delay(5)}>
                {credit}
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
