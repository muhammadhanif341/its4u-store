import { test } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, hexToRgb, relativeLuminance } from "../lib/contrast";
import { colors, contrastPairs, tones } from "../lib/design-tokens";

test("contrast maths matches known WCAG values", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#FFFFFF")), 21);
  assert.equal(contrastRatio("#FFFFFF", "#FFFFFF"), 1);
  // #767676 is the classic lightest grey that still passes AA on white
  const grey = contrastRatio("#767676", "#FFFFFF");
  assert.ok(grey > 4.5 && grey < 4.6, `got ${grey}`);
  // order does not matter
  assert.equal(contrastRatio("#123456", "#FEDCBA"), contrastRatio("#FEDCBA", "#123456"));
});

test("hexToRgb accepts short hex and rejects junk", () => {
  assert.deepEqual(hexToRgb("#fff"), [255, 255, 255]);
  assert.deepEqual(hexToRgb("0B1220"), [11, 18, 32]);
  assert.throws(() => hexToRgb("nope"));
  assert.ok(relativeLuminance("#000000") < relativeLuminance("#FFFFFF"));
});

for (const pair of contrastPairs) {
  test(`readable: ${pair.name}`, () => {
    const ratio = contrastRatio(pair.fg, pair.bg);
    assert.ok(ratio >= pair.min, `${pair.fg} on ${pair.bg} is ${ratio.toFixed(2)}:1, needs ${pair.min}:1`);
  });
}

test("every colour token is a valid hex colour", () => {
  const all: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") all.push(v);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(colors);
  walk(tones);
  assert.ok(all.length > 30);
  for (const c of all) assert.doesNotThrow(() => hexToRgb(c), c);
});

test("white text on the amber call-to-action would fail, so the design uses dark text there", () => {
  assert.ok(contrastRatio("#FFFFFF", colors.accent[400]) < 3);
  assert.ok(contrastRatio(colors.ink[900], colors.accent[400]) > 7);
});

test("the phone illustration picks a stable colour set per brand", async () => {
  const { paletteIndex } = await import("../components/PhoneArt");
  assert.equal(paletteIndex("Apple"), paletteIndex("Apple"));
  for (const brand of ["Apple", "Samsung", "Xiaomi", "Infinix", "Google", "", "x".repeat(200)]) {
    const i = paletteIndex(brand);
    assert.ok(Number.isInteger(i) && i >= 0 && i < 6, `${brand} -> ${i}`);
  }
  const distinct = new Set(["Apple", "Samsung", "Xiaomi", "Infinix", "Google", "Oppo", "Vivo", "Tecno"].map(paletteIndex));
  assert.ok(distinct.size >= 3, "different brands should not all look the same");
});
