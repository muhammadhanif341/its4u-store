import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toInt } from "@/lib/pricing";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Steps } from "@/components/Steps";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const settings = await getSettings(db);
  return (
    <div className="container-x py-8 sm:py-12">
      <Steps current={1} />
      <h1 className="mb-8">Checkout</h1>
      <CheckoutForm deliveryFee={toInt(settings.deliveryFee)} freeAbove={toInt(settings.freeDeliveryAbove)} />
    </div>
  );
}
