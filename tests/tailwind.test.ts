import { test } from "node:test";
import assert from "node:assert/strict";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import config from "../tailwind.config";
import { TONE } from "../lib/ui";

async function generate(classes: string): Promise<string> {
  const result = await postcss([tailwindcss({ ...config, content: [{ raw: classes }] })]).process("@tailwind utilities;", {
    from: undefined,
  });
  return result.css;
}

test("Tailwind scans lib/, where the badge colour class names live", () => {
  const content = (config.content as string[]).join(" ");
  assert.match(content, /\.\/lib\//);
  assert.match(content, /\.\/components\//);
  assert.match(content, /\.\/app\//);
});

test("every badge colour class in lib/ui.ts really produces CSS", async () => {
  const all = Object.values(TONE).join(" ");
  const css = await generate(all);
  for (const cls of all.split(" ")) {
    const selector = `.${cls}`;
    assert.ok(css.includes(selector), `${selector} was not generated`);
  }
});

test("brand, ink, accent and surface colours and the type scale are available as classes", async () => {
  const css = await generate(
    "bg-brand-600 text-brand-700 bg-ink-900 bg-ink-700 bg-accent-400 bg-surface text-body text-muted border-line text-display text-h1 text-h2 text-h3 text-lead font-display font-sans shadow-soft shadow-lift shadow-glow",
  );
  for (const cls of [
    "bg-brand-600", "text-brand-700", "bg-ink-900", "bg-ink-700", "bg-accent-400", "bg-surface",
    "text-body", "text-muted", "border-line", "text-display", "text-h1", "text-h2", "text-h3", "text-lead",
    "font-display", "font-sans", "shadow-soft", "shadow-lift", "shadow-glow",
  ]) {
    assert.ok(css.includes(`.${cls}`), `.${cls} was not generated`);
  }
});

test("headings use fluid sizes so they shrink on phones and grow on desktops", async () => {
  const css = await generate("text-display text-h1 text-h2");
  assert.match(css, /font-size:\s*clamp\(2\.5rem/);
  assert.match(css, /font-size:\s*clamp\(2rem/);
  assert.match(css, /font-size:\s*clamp\(1\.5rem/);
});

test("fonts come from CSS variables set by next/font, with system fallbacks", () => {
  const fam = config.theme?.extend?.fontFamily as Record<string, string[]>;
  assert.equal(fam.sans[0], "var(--font-sans)");
  assert.equal(fam.display[0], "var(--font-display)");
  assert.ok(fam.sans.includes("system-ui") && fam.display.includes("system-ui"));
});
