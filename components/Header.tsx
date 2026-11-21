import Link from "next/link";
import { formatPrice, whatsappUrl } from "@/lib/format";
import { CartLink } from "./CartLink";
import { Icon } from "./Icons";
import { Logo } from "./Logo";

const NAV = [
  { href: "/shop", label: "All phones" },
  { href: "/shop?type=new", label: "New" },
  { href: "/shop?type=used", label: "Used" },
  { href: "/shop?pta=pta", label: "PTA Approved" },
  { href: "/shop?pta=non-pta", label: "Non-PTA" },
  { href: "/shop?pta=jv", label: "JV" },
  { href: "/how-to-buy", label: "How to buy" },
  { href: "/track", label: "Track order" },
];

function SearchForm({ className = "" }: { className?: string }) {
  return (
    <form action="/shop" method="get" role="search" className={`relative ${className}`}>
      <label htmlFor="site-search" className="sr-only">
        Search phones
      </label>
      <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input
        id="site-search"
        type="search"
        name="q"
        placeholder="Search iPhone, Samsung, Redmi..."
        className="h-11 w-full rounded-full border border-line bg-surface pl-12 pr-4 text-base text-ink-900 placeholder:text-[#7A8497] transition hover:border-brand-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
    </form>
  );
}

export function Header({ shopName, freeAbove, whatsapp }: { shopName: string; freeAbove: number; whatsapp: string }) {
  return (
    <>
      <div className="bg-ink-900 text-[13px] text-slate-200">
        <div className="container-x flex items-center justify-between gap-4 py-2">
          <p className="flex min-w-0 items-center gap-2">
            <Icon name="truck" className="h-4 w-4 shrink-0 text-accent-400" />
            <span className="truncate">
              {freeAbove > 0 ? `Free delivery above ${formatPrice(freeAbove)}` : "Delivery across Pakistan"}
            </span>
          </p>
          <p className="hidden items-center gap-2 sm:flex">
            <Icon name="cash" className="h-4 w-4 text-accent-400" />
            Cash on delivery available
          </p>
          <a
            href={whatsappUrl(whatsapp, `Hello ${shopName}, I have a question.`)}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-semibold text-white hover:text-accent-300"
          >
            <Icon name="chat" className="h-4 w-4" />
            WhatsApp us
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-lg">
        <div className="container-x flex h-16 items-center gap-4">
          <Link href="/" aria-label={`${shopName} home`} className="shrink-0 rounded-lg">
            <Logo name={shopName} />
          </Link>
          <SearchForm className="mx-auto hidden max-w-xl flex-1 md:block" />
          <div className="ml-auto">
            <CartLink />
          </div>
        </div>
        <div className="container-x pb-3 md:hidden">
          <SearchForm />
        </div>
        <nav aria-label="Main" className="hidden border-t border-line md:block">
          <ul className="container-x no-scrollbar flex gap-1 overflow-x-auto py-1.5 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block whitespace-nowrap rounded-lg px-3.5 py-2 font-semibold text-body transition hover:bg-brand-50 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Main" className="border-t border-line md:hidden">
          <ul className="no-scrollbar flex gap-1 overflow-x-auto px-4 py-1.5 text-sm">
            {NAV.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link href={item.href} className="block whitespace-nowrap rounded-lg px-3 py-2.5 font-semibold text-body hover:bg-brand-50 hover:text-brand-700">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
}
