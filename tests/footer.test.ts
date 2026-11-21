import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { blend, contrastRatio } from "../lib/contrast";
import { colors, footer } from "../lib/design-tokens";
import { HELP_LINKS, SHOP_LINKS, prettyWhatsapp, safeCreditUrl, telHref } from "../lib/footer";
import { parseFilters } from "../lib/products-query";

test("blend lays a colour over a background", () => {
  assert.equal(blend("#FFFFFF", 1, "#000000"), "#FFFFFF");
  assert.equal(blend("#FFFFFF", 0, "#123456"), "#123456");
  assert.equal(blend("#FFFFFF", 0.5, "#000000"), "#808080");
  assert.equal(blend("#FF0000", 2, "#000000"), "#FF0000"); // opacity is clamped
});

// The three lights glow behind the text, so check the worst case: text over each light at full strength.
for (const glow of footer.glows) {
  const lit = blend(glow.rgb, glow.alpha, footer.surface);
  test(`footer text stays readable over the brightest ${glow.name} light`, () => {
    for (const [name, fg, min] of [
      ["soft text", footer.textSoft, 4.5],
      ["dim text", footer.textDim, 4.5],
      ["column titles", footer.title, 4.5],
      ["white text", "#FFFFFF", 4.5],
    ] as const) {
      const ratio = contrastRatio(fg, lit);
      assert.ok(ratio >= min, `${name} (${fg}) over ${glow.name} glow ${lit} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
    }
  });
}

test("footer text is readable on the plain footer surface too", () => {
  assert.ok(contrastRatio(footer.textSoft, footer.surface) >= 7);
  assert.ok(contrastRatio(footer.textDim, footer.surface) >= 7);
  assert.ok(contrastRatio(footer.title, footer.surface) >= 7);
  assert.ok(contrastRatio(colors.ink[900], colors.accent[400]) >= 7, "call-to-action text");
});

test("every shop link in the footer really filters the shop, and goes to a real page", () => {
  for (const link of SHOP_LINKS) {
    assert.ok(link.href.startsWith("/shop"), link.href);
    const query = Object.fromEntries(new URLSearchParams(link.href.split("?")[1] ?? ""));
    const f = parseFilters(query);
    if (link.href !== "/shop") {
      assert.ok(f.type || f.pta || f.condition || f.brand, `${link.href} does not apply any filter`);
    }
  }
  for (const link of HELP_LINKS) assert.ok(["/track", "/policies"].includes(link.href));
});

test("footer links are not repeated", () => {
  const all = [...SHOP_LINKS, ...HELP_LINKS].map((l) => l.href);
  assert.equal(new Set(all).size, all.length);
  const labels = [...SHOP_LINKS, ...HELP_LINKS].map((l) => l.label);
  assert.equal(new Set(labels).size, labels.length);
});

test("telHref keeps digits and a leading plus", () => {
  assert.equal(telHref("0300 1234567"), "tel:03001234567");
  assert.equal(telHref("+92 300-1234567"), "tel:+923001234567");
  assert.equal(telHref("(042) 111 222"), "tel:042111222");
});

test("prettyWhatsapp", () => {
  assert.equal(prettyWhatsapp("923001234567"), "+92 300 1234567");
  assert.equal(prettyWhatsapp("447911123456"), "+447911123456");
  assert.equal(prettyWhatsapp(""), "");
});

test("safeCreditUrl only accepts real web links", () => {
  assert.equal(safeCreditUrl("https://hkdevlab.com"), "https://hkdevlab.com");
  assert.equal(safeCreditUrl("  http://example.com/a?b=1 "), "http://example.com/a?b=1");
  assert.equal(safeCreditUrl("javascript:alert(1)"), null);
  assert.equal(safeCreditUrl("//evil.com"), null);
  assert.equal(safeCreditUrl("https://a.com/ onclick=x"), null);
  assert.equal(safeCreditUrl(""), null);
  assert.equal(safeCreditUrl(undefined), null);
});

test("the footer animation CSS exists, pauses on request and respects reduced motion", () => {
  const css = readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");
  for (const name of ["footer-breathe-a", "footer-breathe-b", "footer-breathe-c", "reveal-up"]) {
    assert.match(css, new RegExp(`@keyframes ${name}\\b`), `missing @keyframes ${name}`);
  }
  assert.match(css, /\.footer-glows\[data-paused="true"\]/);
  assert.match(css, /animation-play-state:\s*paused/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.footer-glow/);
  assert.match(css, /@supports \(animation-timeline: view\(\)\)/, "scroll reveal must be progressive enhancement");
});
