import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidPkMobile, validateCheckout } from "../lib/validation";
import { parseFilters, buildWhere, buildOrderBy, filtersToQuery } from "../lib/products-query";

test("isValidPkMobile accepts common Pakistani formats", () => {
  for (const n of ["03001234567", "0300-1234567", "+923001234567", "923001234567", "3001234567", "0300 123 4567"]) {
    assert.equal(isValidPkMobile(n), true, n);
  }
});

test("isValidPkMobile rejects bad numbers", () => {
  for (const n of ["", "12345", "0200123456", "030012345", "03001234567890", "abcdefghijk"]) {
    assert.equal(isValidPkMobile(n), false, n);
  }
});

const valid = {
  name: "Ali Khan",
  phone: "03001234567",
  city: "Lahore",
  address: "House 12, Street 4, Model Town",
  notes: "",
  paymentMethod: "cod",
};

test("validateCheckout accepts a good form and trims values", () => {
  const r = validateCheckout({ ...valid, name: "  Ali Khan  " });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.name, "Ali Khan");
});

test("validateCheckout reports every bad field", () => {
  const r = validateCheckout({ name: "A", phone: "1", city: "", address: "short", paymentMethod: "bitcoin" });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.deepEqual(Object.keys(r.errors).sort(), ["address", "city", "name", "paymentMethod", "phone"]);
  }
});

test("validateCheckout limits notes length", () => {
  const r = validateCheckout({ ...valid, notes: "x".repeat(501) });
  assert.equal(r.ok, false);
});

test("parseFilters ignores junk and clamps values", () => {
  const f = parseFilters({
    q: "  iphone ",
    brand: "Apple",
    type: "weird",
    condition: "nope",
    pta: "jv",
    minPrice: "abc",
    maxPrice: "100000",
    sort: "price-desc",
  });
  assert.equal(f.q, "iphone");
  assert.equal(f.type, "");
  assert.equal(f.condition, "");
  assert.equal(f.pta, "jv");
  assert.equal(f.minPrice, null);
  assert.equal(f.maxPrice, 100000);
  assert.equal(f.sort, "price-desc");
});

test("parseFilters defaults and array params", () => {
  const f = parseFilters({ brand: ["Samsung", "Apple"] });
  assert.equal(f.brand, "Samsung");
  assert.equal(f.sort, "newest");
});

test("buildWhere always restricts to active products on the storefront", () => {
  const where = buildWhere(parseFilters({}));
  assert.deepEqual(where, { AND: [{ active: true }] });
});

test("buildWhere combines filters", () => {
  const where = buildWhere(parseFilters({ type: "used", pta: "pta", minPrice: "10000", maxPrice: "50000" }));
  assert.deepEqual(where, {
    AND: [
      { active: true },
      { condition: { not: "new" } },
      { ptaStatus: "pta" },
      { price: { gte: 10000 } },
      { price: { lte: 50000 } },
    ],
  });
});

test("buildWhere can include inactive products for the admin", () => {
  assert.deepEqual(buildWhere(parseFilters({}), { includeInactive: true }), {});
});

test("buildOrderBy", () => {
  assert.deepEqual(buildOrderBy("price-asc"), { price: "asc" });
  assert.deepEqual(buildOrderBy("price-desc"), { price: "desc" });
  assert.deepEqual(buildOrderBy("newest"), { createdAt: "desc" });
});

test("filtersToQuery rebuilds and overrides", () => {
  const f = parseFilters({ brand: "Apple", pta: "pta" });
  assert.equal(filtersToQuery(f), "?brand=Apple&pta=pta");
  assert.equal(filtersToQuery(f, { pta: "" }), "?brand=Apple");
  assert.equal(filtersToQuery(parseFilters({})), "");
});
