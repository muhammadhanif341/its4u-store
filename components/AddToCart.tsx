"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { Icon } from "./Icons";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string | null;
    stock: number;
  };
};

export function AddToCart({ product }: Props) {
  const { add, items } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const inCart = items.find((i) => i.id === product.id)?.qty ?? 0;
  const soldOut = product.stock <= 0;
  const atLimit = inCart >= product.stock;

  function addToCart() {
    add(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function buyNow() {
    if (!atLimit) add(product, 1);
    router.push("/checkout");
  }

  if (soldOut) {
    return (
      <button type="button" className="btn-outline w-full" disabled>
        Sold out
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={buyNow} className="btn-accent flex-1 !min-h-[52px] text-base" data-testid="buy-now">
        Buy now
        <Icon name="arrow" className="h-5 w-5" />
      </button>
      <button type="button" onClick={addToCart} disabled={atLimit} className="btn-dark flex-1 !min-h-[52px] text-base" data-testid="add-to-cart">
        <Icon name={added ? "check" : "cart"} className="h-5 w-5" />
        {atLimit ? "Max quantity in cart" : added ? "Added to cart" : "Add to cart"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {added ? `${product.name} added to your cart` : ""}
      </span>
    </div>
  );
}
