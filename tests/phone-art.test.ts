import { test } from "node:test";
import assert from "node:assert/strict";
import "./setup-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PhoneArt } from "../components/PhoneArt";
import { PhoneImage } from "../components/PhoneImage";
import { Icon } from "../components/Icons";

test("the phone drawing is pure shapes: no text that could leak into the page content", () => {
  const html = renderToStaticMarkup(createElement(PhoneArt, { seed: "Apple" }));
  assert.match(html, /^<svg/);
  assert.ok(!html.includes("<text"), "svg contains <text>");
  assert.ok(!html.includes("9:41"));
});

test("a decorative phone is hidden from screen readers, a labelled one is an image", () => {
  const decorative = renderToStaticMarkup(createElement(PhoneArt, {}));
  assert.match(decorative, /aria-hidden="true"/);
  const labelled = renderToStaticMarkup(createElement(PhoneArt, { label: "A phone" }));
  assert.match(labelled, /role="img"/);
  assert.match(labelled, /aria-label="A phone"/);
});

test("two phone drawings on one page never share gradient ids", () => {
  const a = renderToStaticMarkup(createElement("div", null, createElement(PhoneArt, { seed: "A" }), createElement(PhoneArt, { seed: "B" })));
  const ids = [...a.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.join(", ")}`);
});

test("PhoneImage with a photo has alt text and fixed size (no layout jump)", () => {
  const html = renderToStaticMarkup(createElement(PhoneImage, { images: ["/uploads/a.png"], name: "iPhone 13", brand: "Apple" }));
  assert.match(html, /<img[^>]*alt="iPhone 13"/);
  assert.match(html, /width="800"/);
  assert.match(html, /height="800"/);
  assert.match(html, /loading="lazy"/);
});

test("PhoneImage marked priority loads eagerly", () => {
  const html = renderToStaticMarkup(createElement(PhoneImage, { images: ["/uploads/a.png"], name: "x", brand: "y", priority: true }));
  assert.match(html, /loading="eager"/);
  assert.match(html, /fetchPriority="high"/i);
});

test("PhoneImage without a photo shows the drawing with a describing label", () => {
  const html = renderToStaticMarkup(createElement(PhoneImage, { images: [], name: "iPhone 13", brand: "Apple" }));
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="iPhone 13 \(picture coming soon\)"/);
  assert.ok(!html.includes("<img"));
});

test("icons are decorative and every icon name draws something", async () => {
  const { Icon: I } = await import("../components/Icons");
  const names = [
    "search", "cart", "phone", "shield", "truck", "cash", "chat", "check", "battery", "arrow", "package", "tag", "grid",
    "orders", "sliders", "logout", "plus", "eye", "eyeOff", "lock", "user", "external", "alert", "info", "menu", "close",
    "star", "box", "pin", "filter", "trash", "edit", "clock", "home",
  ] as const;
  for (const name of names) {
    const html = renderToStaticMarkup(createElement(I, { name }));
    assert.match(html, /aria-hidden="true"/, name);
    assert.match(html, /<(path|circle|rect)/, `${name} draws nothing`);
  }
  assert.ok(Icon);
});
