import "./setup-react";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { THEME_KEY, THEME_SCRIPT, ThemeToggle } from "../components/ThemeToggle";
import { contrastRatio } from "../lib/contrast";
import { dark, darkContrastPairs } from "../lib/design-tokens";

const root = process.cwd();
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8").toLowerCase();
const darkCss = css.slice(css.indexOf("dark theme (shop only)"));

test("every text and background pair in the dark theme is readable", () => {
  assert.ok(darkContrastPairs.length >= 20);
  for (const p of darkContrastPairs) {
    const ratio = contrastRatio(p.fg, p.bg);
    assert.ok(ratio >= p.min, `${p.name}: ${ratio.toFixed(2)} is below ${p.min}`);
  }
});

test("globals.css uses exactly the dark colours from the design tokens", () => {
  const flat: string[] = [];
  for (const [k, v] of Object.entries(dark)) {
    if (k === "tones") for (const t of Object.values(v)) flat.push(t.fg, t.bg);
    else flat.push(v as string);
  }
  for (const hex of flat) assert.ok(darkCss.includes(hex.toLowerCase()), `${hex} is in the tokens but not in the dark CSS`);
});

test("dark CSS only applies inside the shop wrapper, never to the admin panel", () => {
  const selectors = darkCss.match(/^[^{}\n@/][^{}]*\{/gm) ?? [];
  const dark = selectors.filter((s) => s.includes("data-theme"));
  assert.ok(dark.length > 40);
  for (const s of selectors) {
    if (s.includes("html:has(")) continue;
    assert.ok(s.includes('[data-theme="dark"]'), `a dark rule that is not scoped: ${s.trim()}`);
  }
  const layout = fs.readFileSync(path.join(root, "app/(store)/layout.tsx"), "utf8");
  assert.match(layout, /id="store-root"/);
  assert.match(layout, /data-theme="dark"/);
  const admin = fs.readFileSync(path.join(root, "app/admin/(panel)/layout.tsx"), "utf8");
  assert.doesNotMatch(admin, /data-theme/);
});

test("text on bright amber and indigo buttons stays dark / white in the dark theme", () => {
  assert.match(darkCss, /\.btn-accent,\s*\[data-theme="dark"\] \.bg-accent-400 \{\s*color: #0b1220/);
  assert.match(darkCss, /\.btn-primary[^}]*color: #ffffff/);
});

test("the theme script only accepts light or dark and never throws", () => {
  assert.ok(THEME_SCRIPT.includes(THEME_KEY));
  assert.ok(THEME_SCRIPT.startsWith("try{") && THEME_SCRIPT.endsWith("catch(e){}"));
  assert.match(THEME_SCRIPT, /t==="light"\|\|t==="dark"/);
  // run it against a tiny fake page
  const attrs: Record<string, string> = {};
  const fakeDoc = { getElementById: () => ({ setAttribute: (k: string, v: string) => (attrs[k] = v) }) };
  const run = (stored: string | null) => {
    for (const k of Object.keys(attrs)) delete attrs[k];
    new Function("localStorage", "document", THEME_SCRIPT)({ getItem: () => stored }, fakeDoc);
    return attrs["data-theme"];
  };
  assert.equal(run("light"), "light");
  assert.equal(run("dark"), "dark");
  assert.equal(run("purple"), undefined, "an unknown value is ignored");
  assert.equal(run(null), undefined, "no choice keeps the default");
  assert.doesNotThrow(() => new Function("localStorage", "document", THEME_SCRIPT)({ getItem: () => { throw new Error("blocked"); } }, fakeDoc));
});

test("the theme button says what it does and starts in the dark state", () => {
  const html = renderToStaticMarkup(createElement(ThemeToggle));
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-label="Dark theme is on\. Switch to light theme"/);
  assert.match(html, /data-testid="theme-toggle"/);
});

test("the header has the theme button", () => {
  assert.match(fs.readFileSync(path.join(root, "components/Header.tsx"), "utf8"), /<ThemeToggle \/>/);
});
