import { Icon } from "./Icons";
import { PhoneArt } from "./PhoneArt";

/** Three floating phones with glass cards: the picture on the right of the home page hero. */
export function HeroArt() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[540px] lg:h-[520px]" aria-hidden="true">
      <div className="absolute inset-x-6 top-10 bottom-6 rounded-[3rem] bg-brand-500/20 blur-3xl" />

      <div className="absolute left-0 top-24 w-[34%] -rotate-[9deg]">
        <div className="animate-float-slow">
          <PhoneArt seed="Samsung" className="drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" />
        </div>
      </div>
      <div className="absolute right-0 top-28 w-[34%] rotate-[8deg]">
        <div className="animate-float-slow [animation-delay:-3s]">
          <PhoneArt seed="Xiaomi" className="drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" />
        </div>
      </div>
      <div className="absolute left-1/2 top-2 z-10 w-[42%] -translate-x-1/2">
        <div className="animate-float">
          <PhoneArt seed="Apple" className="drop-shadow-[0_40px_50px_rgba(0,0,0,0.55)]" />
        </div>
      </div>

      <div className="glass absolute left-0 top-6 z-20 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-white">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/90">
          <Icon name="shield" className="h-4 w-4" />
        </span>
        PTA Approved
      </div>
      <div className="glass absolute -right-1 top-1/2 z-20 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-white">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/90">
          <Icon name="battery" className="h-4 w-4" />
        </span>
        Battery 94%
      </div>
      <div className="glass absolute bottom-4 left-4 z-20 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-white">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-400 text-ink-900">
          <Icon name="star" className="h-4 w-4" />
        </span>
        Like New 10/10
      </div>
    </div>
  );
}
