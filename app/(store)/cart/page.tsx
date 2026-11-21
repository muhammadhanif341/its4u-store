import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toInt } from "@/lib/pricing";
import { CartView } from "@/components/CartView";
import { Steps } from "@/components/Steps";

export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: false } };

export default async function CartPage() {
  const settings = await getSettings(db);
  return (
    <div className="container-x py-8 sm:py-12">
      <Steps current={0} />
      <h1 className="mb-8">Your cart</h1>
      <CartView deliveryFee={toInt(settings.deliveryFee)} freeAbove={toInt(settings.freeDeliveryAbove)} />
    </div>
  );
}
