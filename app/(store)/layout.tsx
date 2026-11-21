import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toInt } from "@/lib/pricing";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings(db);
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold text-brand-700 shadow-lift focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <Header shopName={settings.shopName} freeAbove={toInt(settings.freeDeliveryAbove)} whatsapp={settings.whatsapp} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer settings={settings} />
      </div>
    </CartProvider>
  );
}
