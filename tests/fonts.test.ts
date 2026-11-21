import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const fontDir = path.join(root, "app", "fonts");

test("both fonts are stored in the project as real woff2 files", () => {
  for (const name of ["SpaceGrotesk-latin.woff2", "DMSans-latin.woff2"]) {
    const file = path.join(fontDir, name);
    assert.ok(existsSync(file), `${name} is missing`);
    const bytes = readFileSync(file);
    assert.equal(bytes.subarray(0, 4).toString("latin1"), "wOF2", `${name} is not a woff2 file`);
    assert.ok(bytes.length > 10_000, `${name} is suspiciously small`);
    assert.ok(bytes.length < 150_000, `${name} is too big for a web font`);
  }
});

test("the font licence note is kept next to the files", () => {
  const note = readFileSync(path.join(fontDir, "README.txt"), "utf8");
  assert.match(note, /SIL Open Font License/);
  assert.match(note, /Space Grotesk/);
  assert.match(note, /DM Sans/);
});

test("the layout loads the local files with display: swap and the CSS variables Tailwind expects", () => {
  const layout = readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
  assert.match(layout, /from "next\/font\/local"/);
  assert.match(layout, /fonts\/SpaceGrotesk-latin\.woff2/);
  assert.match(layout, /fonts\/DMSans-latin\.woff2/);
  assert.match(layout, /variable: "--font-display"/);
  assert.match(layout, /variable: "--font-sans"/);
  assert.equal((layout.match(/display: "swap"/g) ?? []).length, 2);
});

/** Walk the source folders and return every .ts/.tsx file. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

test("nothing imports next/font/google, so a build can never fail because of Google Fonts", () => {
  const files = ["app", "components", "lib"].flatMap((d) => sourceFiles(path.join(root, d)));
  assert.ok(files.length > 50);
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.ok(!text.includes("next/font/google"), `${path.relative(root, file)} imports next/font/google`);
  }
});

test("no stylesheet or page asks another website for fonts", () => {
  const css = readFileSync(path.join(root, "app", "globals.css"), "utf8");
  assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(css));
  assert.ok(!/@import\s+url/i.test(css));
});
