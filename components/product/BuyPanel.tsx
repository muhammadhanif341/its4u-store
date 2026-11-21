import { discountPercent, formatPrice } from "@/lib/format";
import { AddToCart } from "../AddToCart";
import { Icon } from "../Icons";

type P = { id: string; slug: string; name: string; price: number; oldPrice: number | null; stock: number; warranty: string };

/** Price, stock and the buy buttons. It sits in the right sidebar on big screens and under the pictures on phones. */
export function BuyPanel({
  product,
  image,
  fee,
  freeAbove,
  inquiryHref,
  anchorId,
}: {
  product: P;
  image: string | null;
  fee: number;
  freeAbove: number;
  inquiryHref: string;
  anchorId?: string;
}) {
  const off = discountPercent(product.price, product.oldPrice);
  const delivery = fee > 0 ? `Delivery ${formatPrice(fee)}${freeAbove > 0 ? `, free above ${formatPrice(freeAbove)}` : ""}` : "Free delivery";

  return (
    <div id={anchorId} className="card scroll-mt-44 space-y-5 p-5 sm:p-6" data-testid="buy-panel">
      <div>
        <p className="text-sm font-semibold text-muted">Price</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-display text-4xl font-bold tracking-tight text-ink-900">{formatPrice(product.price)}</p>
          {product.oldPrice && product.oldPrice > product.price && (
            <>
              <p className="text-lg text-muted line-through">{formatPrice(product.oldPrice)}</p>
              <span className="badge bg-accent-400 text-ink-900">Save {off}%</span>
            </>
          )}
        </div>
        <p className="mt-3">
          {product.stock <= 0 ? (
            <span className="badge bg-tone-danger-bg text-tone-danger-fg">Sold out</span>
          ) : product.stock <= 2 ? (
            <span className="badge bg-tone-warning-bg text-tone-warning-fg">Only {product.stock} left</span>
          ) : (
            <span className="badge bg-tone-success-bg text-tone-success-fg">In stock</span>
          )}
        </p>
      </div>

      <div>
        <AddToCart
          product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, image, stock: product.stock }}
        />
        <a href={inquiryHref} target="_blank" rel="noreferrer" className="btn-outline mt-3 w-full">
          <Icon name="chat" className="h-5 w-5" />
          Ask about this phone on WhatsApp
        </a>
      </div>

      <ul className="space-y-3 border-t border-line pt-5 text-sm">
        <li className="flex items-center gap-3 font-medium text-ink-800">
          <Icon name="cash" className="h-5 w-5 shrink-0 text-brand-600" /> Cash on delivery
        </li>
        <li className="flex items-center gap-3 font-medium text-ink-800">
          <Icon name="truck" className="h-5 w-5 shrink-0 text-brand-600" /> {delivery}
        </li>
        <li className="flex items-center gap-3 font-medium text-ink-800">
          <Icon name="shield" className="h-5 w-5 shrink-0 text-brand-600" /> {product.warranty || "Warranty: ask us on WhatsApp"}
        </li>
        <li className="flex items-center gap-3 font-medium text-ink-800">
          <Icon name="check" className="h-5 w-5 shrink-0 text-brand-600" /> Check the phone before you pay
        </li>
      </ul>
    </div>
  );
}
