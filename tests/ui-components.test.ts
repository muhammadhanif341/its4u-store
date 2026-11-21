import "./setup-react";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Product } from "@prisma/client";
import { ProductRow } from "../components/ProductRow";
import { PillNav, buildMenus } from "../components/PillNav";
import { CardStack, stepIndex } from "../components/home/CardStack";
import { FEATURES, FeatureShowcase } from "../components/home/FeatureShowcase";
import { GradeAccordion } from "../components/home/GradeAccordion";
import { HeroDevices } from "../components/home/HeroDevices";
import { RotatingText, nextIndex } from "../components/home/RotatingText";
import { MediaPanel } from "../components/product/MediaPanel";
import { Meter, Panel } from "../components/product/Panel";
import { PhoneViewer, VIEWER, normalizeAngle } from "../components/product/PhoneViewer";
import { SectionNav } from "../components/product/SectionNav";
import { FilterPanel, type Facets } from "../components/shop/FilterPanel";
import { CONDITIONS } from "../lib/constants";
import { parseFilters } from "../lib/products-query";

const root = process.cwd();
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");
const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

const product = {
  id: "p1",
  slug: "iphone-13-128gb",
  name: "iPhone 13 128GB",
  brand: "Apple",
  model: "iPhone 13",
  storage: "128GB",
  ram: "4GB",
  color: "Blue",
  condition: "excellent",
  ptaStatus: "pta",
  batteryHealth: 91,
  price: 189000,
  oldPrice: 205000,
  stock: 1,
  warranty: "3 months",
  description: "",
  imei: "",
  images: "[]",
  featured: false,
  active: true,
  createdAt: new Date("2026-11-01"),
  updatedAt: new Date("2026-11-01"),
} as Product;

const facets: Facets = {
  total: 10,
  newCount: 3,
  usedCount: 7,
  brands: [
    { value: "Apple", count: 4 },
    { value: "Samsung", count: 3 },
  ],
  conditions: { new: 3, good: 2 },
  pta: { pta: 7, "non-pta": 2, jv: 1 },
  storages: [
    { value: "128GB", count: 5 },
    { value: "256GB", count: 3 },
  ],
};

// ---------- small helpers ----------
test("rotating index and stack index wrap around", () => {
  assert.equal(nextIndex(0, 3), 1);
  assert.equal(nextIndex(2, 3), 0);
  assert.equal(nextIndex(0, 0), 0);
  assert.equal(stepIndex(0, -1, 4), 3);
  assert.equal(stepIndex(3, 1, 4), 0);
  assert.equal(stepIndex(2, 5, 4), 3);
  assert.equal(stepIndex(0, 1, 0), 0);
});

test("the 3D viewer angle never grows without end", () => {
  assert.equal(normalizeAngle(0), 0);
  assert.equal(normalizeAngle(190), -170);
  assert.equal(normalizeAngle(-190), 170);
  assert.equal(normalizeAngle(720 + 45), 45);
  assert.equal(normalizeAngle(-360), 0);
  for (let a = -1000; a <= 1000; a += 37) {
    const n = normalizeAngle(a);
    assert.ok(n > -180 - 1e-9 && n <= 180, `${a} -> ${n}`);
  }
});

// ---------- home ----------
test("rotating text keeps every word in one cell, hides itself from screen readers, and the heading keeps the plain word", () => {
  const out = html(createElement(RotatingText, { words: ["iPhone", "Galaxy", "Pixel"] }));
  assert.match(out, /aria-hidden="true"/);
  assert.match(out, /inline-grid/);
  assert.equal(count(out, /col-start-1 row-start-1/g), 3);
  for (const w of ["iPhone", "Galaxy", "Pixel"]) assert.ok(out.includes(w));
  const home = read("app/(store)/page.tsx");
  assert.match(home, /<span className="sr-only">phone<\/span>/);
});

test("hero devices show real phones and link to them", () => {
  const phones = [0, 1, 2].map((i) => ({
    slug: `phone-${i}`,
    name: `Phone ${i}`,
    brand: "Apple",
    price: 100000 + i,
    condition: "new",
    ptaStatus: "pta",
  }));
  const out = html(createElement(HeroDevices, { phones }));
  assert.equal(count(out, /href="\/shop\/phone-\d"/g), 3);
  assert.match(out, /Rs\. 100,000/);
  assert.match(out, /motion-reduce:animate-none/);
  assert.equal(html(createElement(HeroDevices, { phones: [] })), "");
  assert.equal(count(html(createElement(HeroDevices, { phones: phones.slice(0, 1) })), /href="\/shop\//g), 1);
});

test("card stack keeps every card in the page, is a labelled carousel, and only the top card can be used", () => {
  const items = ["A", "B", "C", "D"].map((t) => createElement("p", { key: t }, `Card ${t}`));
  const out = html(createElement(CardStack, { items, label: "Featured phones" }));
  assert.match(out, /aria-roledescription="carousel"/);
  assert.match(out, /aria-label="Featured phones"/);
  for (const t of ["A", "B", "C", "D"]) assert.ok(out.includes(`Card ${t}`));
  assert.equal(count(out, /aria-label="Show phone \d of 4"/g), 4);
  assert.match(out, /aria-label="Previous phone"/);
  assert.match(out, /aria-label="Next phone"/);
  assert.equal(count(out, /inert=""/g), 3, "the three cards behind cannot be tabbed to");
  assert.match(out, /Phone 1 of 4/);
});

test("grade accordion lists all six grades with their text, first one open", () => {
  const out = html(createElement(GradeAccordion));
  assert.equal(count(out, /aria-expanded="/g), CONDITIONS.length);
  assert.equal(count(out, /aria-expanded="true"/g), 1);
  assert.match(out, /Brand new and unused/);
  assert.match(out, /Visible scratches or dents/);
  assert.ok(out.includes("10") && out.includes("/10"));
});

test("feature showcase is a proper tab list: four tabs, one selected, the others hidden but still in the page", () => {
  const out = html(createElement(FeatureShowcase));
  assert.equal(FEATURES.length, 4);
  assert.match(out, /role="tablist"/);
  assert.equal(count(out, /role="tab"/g), 4);
  assert.equal(count(out, /aria-selected="true"/g), 1);
  assert.equal(count(out, /role="tabpanel"/g), 4);
  assert.equal(count(out, /!hidden/g), 3);
  for (const f of FEATURES) assert.ok(out.includes(f.title.replace(/'/g, "&#x27;")) || out.includes(f.tab), f.tab);
  assert.equal(new Set(FEATURES.map((f) => f.id)).size, 4);
});

// ---------- header ----------
test("pill nav menus all point at real shop filters", () => {
  const menus = buildMenus(["Apple", "Samsung & Co"]);
  assert.deepEqual(menus.map((m) => m.id), ["shop", "pta", "brands", "budget"]);
  for (const m of menus) {
    assert.ok(m.items.length >= 3 || m.id === "brands");
    for (const item of m.items) {
      assert.ok(item.href.startsWith("/shop"), item.href);
      if (item.href !== "/shop") {
        const f = parseFilters(Object.fromEntries(new URLSearchParams(item.href.split("?")[1])));
        assert.ok(f.type || f.pta.length || f.brand.length || f.minPrice || f.maxPrice, `${item.href} applies no filter`);
      }
    }
  }
  const brand = menus.find((m) => m.id === "brands")!.items[1];
  assert.deepEqual(parseFilters(Object.fromEntries(new URLSearchParams(brand.href.split("?")[1]))).brand, ["Samsung & Co"]);
  assert.deepEqual(buildMenus([]).map((m) => m.id), ["shop", "pta", "budget"]);
});

test("pill nav is a labelled navigation with menu buttons that say whether they are open", () => {
  const out = html(createElement(PillNav, { brands: ["Apple"] }));
  assert.match(out, /<nav[^>]*aria-label="Main"/);
  assert.equal(count(out, /aria-haspopup="true"/g), 4);
  assert.equal(count(out, /aria-expanded="false"/g), 4);
  assert.match(out, /href="\/how-to-buy"/);
  assert.match(out, /href="\/track"/);
  assert.doesNotMatch(out, /id="menu-/, "menus are only drawn when opened");
  const header = read("components/Header.tsx");
  assert.match(header, /<PillNav/);
  assert.match(read("app/(store)/layout.tsx"), /brands=\{/);
});

// ---------- shop ----------
test("filter sidebar lists type, PTA, brand, condition, storage and price, each with counts and a clear state", () => {
  const f = parseFilters({ pta: "pta", brand: ["Apple", "Samsung"] });
  const href = (over: Record<string, string | string[]>) => `/shop?x=${JSON.stringify(over)}`;
  const out = html(createElement(FilterPanel, { filters: f, facets, href, idPrefix: "d", activeCount: 2 }));
  for (const title of ["Type", "PTA status", "Brand", "Condition", "Storage", "Price"]) assert.ok(out.includes(`aria-label="${title}"`), title);
  // one chosen option in every group: All phones, PTA Approved, Apple, Any condition, Any price
  assert.equal(count(out, /aria-current="true"/g), 6, "PTA Approved, Apple, Samsung, plus All phones, Any condition and Any price");
  assert.match(out, /Clear all \(2\)/);
  assert.match(out, />Apple</);
  assert.match(out, />4</, "brand count");
  assert.equal(count(out, /name="minPrice"/g), 1);
  assert.equal(count(out, /name="maxPrice"/g), 1);
  assert.equal(count(out, /id="d-q"/g), 1);
  // the search form keeps the other filters
  assert.match(out, /<input type="hidden" name="pta" value="pta"\/>/);
  assert.match(out, /<input type="hidden" name="brand" value="Apple"\/>/);
  assert.match(out, /<input type="hidden" name="brand" value="Samsung"\/>/, "every chosen brand is kept");
  for (const c of CONDITIONS) assert.ok(out.includes(c.label), c.label);
  const clean = html(createElement(FilterPanel, { filters: parseFilters({}), facets, href, idPrefix: "m", activeCount: 0 }));
  assert.doesNotMatch(clean, /Clear all/);
});

test("two filter panels on one page never share an input id", () => {
  const f = parseFilters({});
  const href = () => "/shop";
  const a = html(createElement(FilterPanel, { filters: f, facets, href, idPrefix: "m", activeCount: 0 }));
  const b = html(createElement(FilterPanel, { filters: f, facets, href, idPrefix: "d", activeCount: 0 }));
  const ids = (s: string) => [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids(a).filter((id) => ids(b).includes(id)).length, 0);
});

test("product row shows the key facts as a record row", () => {
  const out = html(createElement(ProductRow, { product }));
  assert.match(out, /href="\/shop\/iphone-13-128gb"/);
  assert.match(out, /iPhone 13 128GB/);
  assert.match(out, /Rs\. 189,000/);
  assert.match(out, /line-through/);
  assert.match(out, /Only 1 left/);
  assert.match(out, /Battery 91%/);
  assert.match(out, /View details/);
  assert.match(html(createElement(ProductRow, { product: { ...product, stock: 0 } })), /Sold out/);
});

test("the shop page has the sidebar, sorting, a cards or rows switch, and keeps the chosen view in its links", () => {
  const page = read("app/(store)/shop/page.tsx");
  for (const piece of ["<FilterPanel", 'idPrefix="m"', 'idPrefix="d"', "Show phones as cards", "Show phones as a list", 'view=list', "<ProductRow", 'data-testid="result-count"']) {
    assert.ok(page.includes(piece), piece);
  }
  assert.equal(count(page, /<h1/g), 1);
});

// ---------- product page ----------
test("section nav works as a vertical rail and as a row of pills, and marks the current section", () => {
  const sections = [
    { id: "overview", label: "Overview" },
    { id: "specs", label: "Specifications" },
  ];
  const rail = html(createElement(SectionNav, { sections, variant: "rail" }));
  const bar = html(createElement(SectionNav, { sections, variant: "bar" }));
  assert.match(rail, /data-testid="section-nav-rail"/);
  assert.match(bar, /data-testid="section-nav-bar"/);
  for (const out of [rail, bar]) {
    assert.match(out, /aria-label="On this page"/);
    assert.match(out, /href="#overview"[^>]*aria-current="location"|aria-current="location"[^>]*href="#overview"/);
    assert.equal(count(out, /aria-current="location"/g), 1);
    assert.match(out, /href="#specs"/);
  }
});

test("3D viewer: a keyboard-focusable group with a description, six planes, and no motion for reduced-motion users", () => {
  const out = html(createElement(PhoneViewer, { name: "iPhone 13", seed: "Apple" }));
  assert.match(out, /role="group"/);
  assert.match(out, /tabindex="0"/);
  assert.match(out, /aria-label="iPhone 13, 3D view\. Drag, or use the left and right arrow keys, to turn the phone\."/);
  assert.match(out, /preserve-3d/);
  assert.match(out, /rotateY\(180deg\)/, "the back");
  assert.match(out, /Turn left/);
  assert.match(out, /Turn right/);
  assert.match(out, /not a photo of the exact unit/, "tells the truth that it is an illustration");
  assert.equal(count(out, /translateZ/g), 6);
  assert.ok(VIEWER.step > 0 && VIEWER.depth < VIEWER.width);
  const src = read("components/product/PhoneViewer.tsx");
  assert.match(src, /prefers-reduced-motion/);
});

test("media panel has Photos and 3D view tabs", () => {
  const out = html(createElement(MediaPanel, { images: ["/a.jpg", "/b.jpg"], name: "iPhone 13", brand: "Apple", model: "iPhone 13" }));
  assert.match(out, /role="tablist"/);
  assert.match(out, /Photos \(2\)/);
  assert.match(out, />3D view</);
  assert.equal(count(out, /aria-selected="true"/g), 1);
  assert.match(html(createElement(MediaPanel, { images: [], name: "x", brand: "y", model: "z" })), />Photo</);
});

test("panels have a titled landmark and meters expose their value", () => {
  const panel = html(createElement(Panel, { id: "specs", title: "Specifications", icon: "sliders", note: "n", children: "x" }));
  assert.match(panel, /<section id="specs" aria-labelledby="specs-title"/);
  assert.match(panel, /<h2 id="specs-title"/);
  const meter = html(createElement(Meter, { label: "Battery health", value: 91, display: "91%" }));
  assert.match(meter, /role="meter"/);
  assert.match(meter, /aria-valuenow="91"/);
  assert.match(meter, /width:91%/);
  assert.match(html(createElement(Meter, { label: "x", value: 500, max: 100, display: "x" })), /width:100%/, "never wider than the bar");
});

test("product page is laid out like a record: header, left rail, centre sections, right buy panel", () => {
  const page = read("app/(store)/shop/[slug]/page.tsx");
  for (const piece of [
    'data-testid="record-header"',
    'aria-label="Phone summary"',
    'aria-label="Buy this phone"',
    'variant="rail"',
    'variant="bar"',
    "Quick facts",
    "<MediaPanel",
    'id="overview"',
    'id="specs"',
    'id="condition"',
    'id="delivery"',
    'id="similar"',
    'anchorId="buy"',
    "<StickyBuyBar",
    "xl:grid-cols-[230px_minmax(0,1fr)_340px]",
  ]) {
    assert.ok(page.includes(piece), piece);
  }
  assert.equal(count(page, /<h1/g), 1);
  assert.equal(count(page, /anchorId="buy"/g), 1, "the Order now link has exactly one target");
});
