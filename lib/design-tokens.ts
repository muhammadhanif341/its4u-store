/**
 * Single source of truth for the Its4u look.
 * tailwind.config.ts reads these, and tests/design.test.ts checks that every
 * text/background pair we use meets WCAG AA contrast (4.5:1 for normal text).
 */

export const colors = {
  // Deep midnight blue: hero, footer, admin sidebar
  ink: {
    950: "#070B16",
    900: "#0B1220",
    800: "#121B30",
    700: "#1C2742",
    600: "#2B3A5E",
  },
  // Electric indigo: links, primary buttons, highlights
  brand: {
    50: "#EEF0FF",
    100: "#E1E5FF",
    200: "#C8CFFF",
    300: "#A5AEFF",
    400: "#7F88FB",
    500: "#5B63F2",
    600: "#4548DB",
    700: "#3835B8",
    800: "#2E2D91",
    900: "#262870",
  },
  // Warm amber: main call-to-action and small highlights (always with dark text)
  accent: {
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
  },
  surface: {
    DEFAULT: "#F6F7FB",
    sunken: "#EDEFF6",
  },
  line: "#E3E6EF",
  body: "#334155",
  muted: "#5B6678",
} as const;

/** Soft badge colours: dark text on a light tint. */
export const tones = {
  success: { fg: "#065F46", bg: "#D1FAE5" },
  warning: { fg: "#78350F", bg: "#FEF3C7" },
  danger: { fg: "#9F1239", bg: "#FFE4E6" },
  info: { fg: "#075985", bg: "#E0F2FE" },
  violet: { fg: "#5B21B6", bg: "#EDE9FE" },
  neutral: { fg: "#334155", bg: "#EEF1F7" },
  brand: { fg: "#2E2D91", bg: "#E1E5FF" },
} as const;

const WHITE = "#FFFFFF";

/** Every text-on-background combination used in the UI, with the minimum ratio it must reach. */
export const contrastPairs: { name: string; fg: string; bg: string; min: number }[] = [
  { name: "headings on white", fg: colors.ink[900], bg: WHITE, min: 7 },
  { name: "body text on white", fg: colors.body, bg: WHITE, min: 7 },
  { name: "body text on page background", fg: colors.body, bg: colors.surface.DEFAULT, min: 4.5 },
  { name: "muted text on white", fg: colors.muted, bg: WHITE, min: 4.5 },
  { name: "muted text on page background", fg: colors.muted, bg: colors.surface.DEFAULT, min: 4.5 },
  { name: "muted text on sunken background", fg: colors.muted, bg: colors.surface.sunken, min: 4.5 },
  { name: "link (brand 600) on white", fg: colors.brand[600], bg: WHITE, min: 4.5 },
  { name: "link (brand 700) on page background", fg: colors.brand[700], bg: colors.surface.DEFAULT, min: 4.5 },
  { name: "primary button text", fg: WHITE, bg: colors.brand[600], min: 4.5 },
  { name: "primary button text (hover)", fg: WHITE, bg: colors.brand[700], min: 4.5 },
  { name: "call-to-action button text", fg: colors.ink[900], bg: colors.accent[400], min: 7 },
  { name: "call-to-action button text (hover)", fg: colors.ink[900], bg: colors.accent[300], min: 7 },
  { name: "text on dark ink", fg: WHITE, bg: colors.ink[900], min: 7 },
  { name: "soft text on dark ink", fg: "#CBD5E1", bg: colors.ink[900], min: 7 },
  { name: "dim text on dark ink", fg: "#94A3B8", bg: colors.ink[900], min: 4.5 },
  { name: "eyebrow on dark ink", fg: colors.accent[400], bg: colors.ink[900], min: 7 },
  { name: "active admin link on ink 800", fg: WHITE, bg: colors.ink[700], min: 7 },
  { name: "brand badge", fg: tones.brand.fg, bg: tones.brand.bg, min: 4.5 },
  { name: "success badge", fg: tones.success.fg, bg: tones.success.bg, min: 4.5 },
  { name: "warning badge", fg: tones.warning.fg, bg: tones.warning.bg, min: 4.5 },
  { name: "danger badge", fg: tones.danger.fg, bg: tones.danger.bg, min: 4.5 },
  { name: "info badge", fg: tones.info.fg, bg: tones.info.bg, min: 4.5 },
  { name: "violet badge", fg: tones.violet.fg, bg: tones.violet.bg, min: 4.5 },
  { name: "neutral badge", fg: tones.neutral.fg, bg: tones.neutral.bg, min: 4.5 },
  { name: "error text on white", fg: "#BE123C", bg: WHITE, min: 4.5 },
  { name: "danger button text", fg: WHITE, bg: "#BE123C", min: 4.5 },
];

/**
 * The footer: a dark glass card with three glowing lights that slowly "breathe" behind the text.
 * The lights are soft coloured circles, so text must stay readable even where a light is brightest.
 */
export const footer = {
  surface: "#0D0F16",
  textSoft: "#CBD5E1",
  textDim: "#C0CADB",
  title: colors.accent[400],
  glows: [
    { name: "indigo", rgb: "#5B63F2", alpha: 0.55 },
    { name: "amber", rgb: "#FBBF24", alpha: 0.36 },
    { name: "cyan", rgb: "#22D3EE", alpha: 0.22 },
  ],
} as const;
