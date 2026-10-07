import { describe, expect, it } from "vitest";
import {
  canFulfil,
  isSoldOut,
  requestQuantity,
  stockAfterCancel,
  stockAfterSale,
} from "./stock.js";

describe("stockAfterSale", () => {
  it("takes the sold quantity off", () => {
    expect(stockAfterSale(10, 3)).toBe(7);
    expect(stockAfterSale(3, 3)).toBe(0);
  });

  it("never goes below 0", () => {
    expect(stockAfterSale(2, 5)).toBe(0);
    expect(stockAfterSale(0, 1)).toBe(0);
  });

  it("treats bad values safely", () => {
    expect(stockAfterSale("4", "1")).toBe(3);
    expect(stockAfterSale(undefined, 2)).toBe(0);
    expect(stockAfterSale(5, 0)).toBe(4); // a request is for at least 1
    expect(stockAfterSale(5.9, 1.7)).toBe(4);
  });
});

describe("stockAfterCancel", () => {
  it("puts the quantity back", () => {
    expect(stockAfterCancel(0, 3)).toBe(3);
    expect(stockAfterCancel(7, 3)).toBe(10);
    expect(stockAfterCancel(undefined, 2)).toBe(2);
  });

  it("is the reverse of a sale that fitted", () => {
    expect(stockAfterCancel(stockAfterSale(10, 4), 4)).toBe(10);
  });
});

describe("canFulfil / isSoldOut / requestQuantity", () => {
  it("checks there is enough stock", () => {
    expect(canFulfil(3, 3)).toBe(true);
    expect(canFulfil(2, 3)).toBe(false);
    expect(canFulfil(0, 1)).toBe(false);
  });

  it("knows when a product is sold out", () => {
    expect(isSoldOut({ stock: 0 })).toBe(true);
    expect(isSoldOut({ stock: -2 })).toBe(true);
    expect(isSoldOut({})).toBe(true);
    expect(isSoldOut({ stock: 1 })).toBe(false);
  });

  it("reads a request's quantity (at least 1)", () => {
    expect(requestQuantity({ quantity: 4 })).toBe(4);
    expect(requestQuantity({})).toBe(1);
    expect(requestQuantity({ quantity: "2" })).toBe(2);
  });
});
