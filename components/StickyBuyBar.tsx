import { formatPrice } from "@/lib/format";

/** On phones, keeps the price and a Buy button in view while the customer reads the specifications. */
export function StickyBuyBar({ name, price, soldOut }: { name: string; price: number; soldOut: boolean }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(11,18,32,0.08)] backdrop-blur-lg lg:hidden"
      data-testid="sticky-buy-bar"
    >
      <div className="mx-auto flex max-w-[1200px] items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted">{name}</p>
          <p className="font-display text-xl font-bold leading-tight text-ink-900">{formatPrice(price)}</p>
        </div>
        {soldOut ? (
          <span className="badge bg-tone-danger-bg text-tone-danger-fg">Sold out</span>
        ) : (
          <a href="#buy" className="btn-accent shrink-0 px-6">
            Order now
          </a>
        )}
      </div>
    </div>
  );
}
