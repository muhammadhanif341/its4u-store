/** Full class names (so Tailwind can see them) for the soft badge colours. */
export const TONE = {
  success: "bg-tone-success-bg text-tone-success-fg",
  warning: "bg-tone-warning-bg text-tone-warning-fg",
  danger: "bg-tone-danger-bg text-tone-danger-fg",
  info: "bg-tone-info-bg text-tone-info-fg",
  violet: "bg-tone-violet-bg text-tone-violet-fg",
  neutral: "bg-tone-neutral-bg text-tone-neutral-fg",
  brand: "bg-tone-brand-bg text-tone-brand-fg",
} as const;

export type Tone = keyof typeof TONE;

export const CONDITION_TONE: Record<string, Tone> = {
  new: "success",
  "open-box": "info",
  "like-new": "brand",
  excellent: "violet",
  good: "warning",
  fair: "neutral",
};

export const PTA_TONE: Record<string, Tone> = {
  pta: "brand",
  "non-pta": "danger",
  jv: "violet",
};

export const ORDER_TONE: Record<string, Tone> = {
  pending: "warning",
  confirmed: "info",
  shipped: "violet",
  delivered: "success",
  cancelled: "danger",
};

export function toneFor(map: Record<string, Tone>, key: string): string {
  return TONE[map[key] ?? "neutral"];
}
