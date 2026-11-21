import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { conditionShort, ptaLabel } from "@/lib/constants";
import { paletteIndex } from "../PhoneArt";

export type DevicePhone = { slug: string; name: string; brand: string; price: number; condition: string; ptaStatus: string };

const WALLPAPERS = [
  "from-[#5B63F2] via-[#7F88FB] to-[#22D3EE]",
  "from-[#8B5CF6] via-[#C084FC] to-[#F472B6]",
  "from-[#10B981] via-[#34D399] to-[#22D3EE]",
  "from-[#F59E0B] via-[#FB923C] to-[#F43F5E]",
  "from-[#0EA5E9] via-[#6366F1] to-[#8B5CF6]",
  "from-[#334155] via-[#475569] to-[#6366F1]",
];

function Device({ phone, className, style }: { phone: DevicePhone; className: string; style?: React.CSSProperties }) {
  return (
    <Link
      href={`/shop/${phone.slug}`}
      aria-label={`${phone.name}, ${formatPrice(phone.price)}`}
      className={`group absolute block aspect-[9/19] w-[44%] rounded-[2.4rem] border-[7px] border-[#1B2540] bg-[#0B1220] p-0 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/15 transition duration-500 hover:-translate-y-2 motion-reduce:transition-none ${className}`}
      style={style}
    >
      <span className={`relative flex h-full w-full flex-col overflow-hidden rounded-[1.9rem] bg-gradient-to-br ${WALLPAPERS[paletteIndex(phone.brand)]}`}>
        <span aria-hidden="true" className="absolute left-1/2 top-2 h-4 w-14 -translate-x-1/2 rounded-full bg-black/80" />
        <span className="mt-auto m-2.5 rounded-2xl bg-[#0B1220]/80 p-3 text-left backdrop-blur-md">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">{phone.brand}</span>
          <span className="mt-0.5 block text-[13px] font-semibold leading-tight text-white">{phone.name}</span>
          <span className="mt-2 flex items-center justify-between gap-2">
            <span className="font-display text-sm font-bold text-accent-300">{formatPrice(phone.price)}</span>
          </span>
          <span className="mt-2 flex flex-wrap gap-1">
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white">{conditionShort(phone.condition)}</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white">{ptaLabel(phone.ptaStatus)}</span>
          </span>
        </span>
      </span>
    </Link>
  );
}

/** Three phone frames that show real phones from the shop. Each one links to its page. */
export function HeroDevices({ phones }: { phones: DevicePhone[] }) {
  const [a, b, c] = phones;
  if (!a) return null;
  return (
    <div className="relative mx-auto aspect-[1/1.05] w-full max-w-[460px]" data-testid="hero-devices">
      <div aria-hidden="true" className="absolute inset-[10%] rounded-full bg-brand-500/30 blur-3xl" />
      {b && <Device phone={b} className="left-[2%] top-[14%] -rotate-[8deg] animate-float-slow motion-reduce:animate-none" />}
      {c && <Device phone={c} className="right-[2%] top-[18%] rotate-[8deg] animate-float motion-reduce:animate-none" style={{ animationDelay: "-3s" }} />}
      <Device phone={a} className="left-[28%] top-[2%] z-10 w-[46%] animate-float motion-reduce:animate-none" />
    </div>
  );
}
