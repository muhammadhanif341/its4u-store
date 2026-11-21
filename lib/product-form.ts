import { CONDITIONS, PTA_STATUSES } from "./constants";

export type ProductInput = {
  name: string;
  brand: string;
  model: string;
  storage: string;
  ram: string;
  color: string;
  condition: string;
  ptaStatus: string;
  batteryHealth: number | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  warranty: string;
  description: string;
  imei: string;
  images: string[];
  featured: boolean;
  active: boolean;
};

export type ProductFormResult =
  | { ok: true; data: ProductInput }
  | { ok: false; errors: Record<string, string> };

type Raw = Record<string, FormDataEntryValue | null | undefined>;

const text = (raw: Raw, key: string) => String(raw[key] ?? "").trim();
const checked = (raw: Raw, key: string) => ["on", "true", "1"].includes(text(raw, key));

/** Whole numbers only. Returns null when empty, NaN when invalid. */
function wholeNumber(value: string): number | null {
  if (value === "") return null;
  const cleaned = value.replace(/[,\s]/g, "");
  return /^\d+$/.test(cleaned) ? parseInt(cleaned, 10) : NaN;
}

function parseImageList(value: string): string[] | null {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const ok = parsed.every((u) => typeof u === "string" && /^(\/uploads\/[\w.-]+|https?:\/\/\S+)$/.test(u));
    return ok ? parsed : null;
  } catch {
    return null;
  }
}

export function parseProductForm(raw: Raw): ProductFormResult {
  const errors: Record<string, string> = {};

  const name = text(raw, "name");
  const brand = text(raw, "brand");
  const model = text(raw, "model");
  const condition = text(raw, "condition");
  const ptaStatus = text(raw, "ptaStatus");

  if (name.length < 3 || name.length > 120) errors.name = "Name must be 3 to 120 characters.";
  if (brand.length < 2 || brand.length > 40) errors.brand = "Brand must be 2 to 40 characters.";
  if (model.length < 1 || model.length > 60) errors.model = "Model is required.";
  if (!CONDITIONS.some((c) => c.value === condition)) errors.condition = "Choose a condition.";
  if (!PTA_STATUSES.some((p) => p.value === ptaStatus)) errors.ptaStatus = "Choose a PTA status.";

  const price = wholeNumber(text(raw, "price"));
  if (price === null || Number.isNaN(price) || price <= 0 || price > 10_000_000) {
    errors.price = "Enter a price between 1 and 10,000,000.";
  }

  const oldPriceRaw = wholeNumber(text(raw, "oldPrice"));
  if (oldPriceRaw !== null && (Number.isNaN(oldPriceRaw) || (typeof price === "number" && oldPriceRaw <= price))) {
    errors.oldPrice = "Old price must be higher than the price, or leave it empty.";
  }

  const stock = wholeNumber(text(raw, "stock"));
  if (stock === null || Number.isNaN(stock) || stock > 1000) errors.stock = "Enter the stock quantity (0 to 1000).";

  const batteryRaw = wholeNumber(text(raw, "batteryHealth"));
  if (batteryRaw !== null && (Number.isNaN(batteryRaw) || batteryRaw < 1 || batteryRaw > 100)) {
    errors.batteryHealth = "Battery health must be between 1 and 100.";
  }

  const images = parseImageList(text(raw, "images"));
  if (images === null) errors.images = "One of the images is not valid.";
  else if (images.length > 8) errors.images = "You can add at most 8 images.";

  const description = text(raw, "description");
  if (description.length > 3000) errors.description = "Description is too long.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name,
      brand,
      model,
      storage: text(raw, "storage"),
      ram: text(raw, "ram"),
      color: text(raw, "color"),
      condition,
      ptaStatus,
      batteryHealth: batteryRaw,
      price: price as number,
      oldPrice: oldPriceRaw,
      stock: stock as number,
      warranty: text(raw, "warranty"),
      description,
      imei: text(raw, "imei"),
      images: images as string[],
      featured: checked(raw, "featured"),
      active: checked(raw, "active"),
    },
  };
}
