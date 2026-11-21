import Link from "next/link";
import type { Product } from "@prisma/client";
import { discountPercent, formatPrice, parseImages } from "@/lib/format";
import { Icon } from "./Icons";
import { ConditionBadge, PtaBadge } from "./Badges";
import { PhoneImage } from "./PhoneImage";

/** One phone as a row, like a record in a table. The shop can show phones as cards or as rows. */
export function ProductRow({ product }: { product: Product }) {
  const images = parseImages(product.images);
  const off = discountPercent(product.price, product.oldPrice);
  const soldOut = product.stock <= 0;
  const specs = [product.storage, product.ram && `${product.ram} RAM`, product.color, product.batteryHealth && `Battery ${product.batteryHealth}%`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group card flex items-center gap-3 p-3 transition duration-300 hover:border-brand-200 hover:shadow-lift sm:gap-5 sm:p-4"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-sunken sm:h-28 sm:w-28">
        <PhoneImage images={images} name={product.name} brand={product.brand} className="h-full w-full" />
        {soldOut && <span className="absolute inset-0 grid place-items-center bg-white/75 text-xs font-bold text-ink-900">Sold out</span>}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{product.brand}</p>
        <h3 className="mt-0.5 truncate text-base font-semibold text-ink-900 transition group-hover:text-brand-700 sm:text-lg">{product.name}</h3>
        {specs && <p className="mt-0.5 truncate text-sm text-muted">{specs}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <ConditionBadge value={product.condition} />
          <PtaBadge value={product.ptaStatus} />
          {!soldOut && product.stock <= 2 && <span className="badge bg-tone-warning-bg text-tone-warning-fg">Only {product.stock} left</span>}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-display text-lg font-bold text-ink-900 sm:text-xl">{formatPrice(product.price)}</p>
        {product.oldPrice && product.oldPrice > product.price && (
          <p className="text-sm text-muted">
            <span className="line-through">{formatPrice(product.oldPrice)}</span>
            {off > 0 && <span className="ml-1.5 font-semibold text-tone-success-fg">-{off}%</span>}
          </p>
        )}
        <span className="mt-2 hidden items-center justify-end gap-1 text-sm font-semibold text-brand-700 sm:flex">
          View details
          <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
