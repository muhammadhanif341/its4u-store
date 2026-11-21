import type { Config } from "tailwindcss";
import { colors, tones } from "./lib/design-tokens";

const toneColors = Object.fromEntries(
  Object.entries(tones).flatMap(([name, t]) => [
    [`${name}-fg`, t.fg],
    [`${name}-bg`, t.bg],
  ]),
);

const systemFonts = ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"];

const config: Config = {
  // lib/ is scanned too: lib/ui.ts holds the badge colour class names
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: colors.ink,
        brand: colors.brand,
        accent: colors.accent,
        surface: colors.surface,
        line: colors.line,
        body: colors.body,
        muted: colors.muted,
        tone: toneColors,
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...systemFonts],
        display: ["var(--font-display)", ...systemFonts],
      },
      // Type scale: one place decides how big each heading is.
      fontSize: {
        display: ["clamp(2.5rem, 1.6rem + 3.6vw, 4.25rem)", { lineHeight: "1.03", letterSpacing: "-0.035em", fontWeight: "700" }],
        h1: ["clamp(2rem, 1.4rem + 2vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
        h2: ["clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "700" }],
        h3: ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.015em", fontWeight: "600" }],
        lead: ["1.125rem", { lineHeight: "1.7" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(11 18 32 / 0.04), 0 8px 24px -10px rgb(11 18 32 / 0.12)",
        lift: "0 2px 4px rgb(11 18 32 / 0.05), 0 24px 48px -16px rgb(11 18 32 / 0.28)",
        glow: "0 0 0 1px rgb(91 99 242 / 0.25), 0 14px 36px -10px rgb(91 99 242 / 0.5)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "spin-slow": "spin 6s linear infinite",
        float: "float 7s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
