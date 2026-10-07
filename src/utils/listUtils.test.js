import { describe, expect, it } from "vitest";
import { resultCountLabel, upsertById } from "./listUtils.js";

describe("upsertById", () => {
  it("adds a new item at the front", () => {
    expect(upsertById([{ id: "a" }], { id: "b" })).toEqual([{ id: "b" }, { id: "a" }]);
  });

  it("replaces an item the listener already added instead of duplicating it", () => {
    const list = [{ id: "b", status: "Pending" }, { id: "a" }];
    const result = upsertById(list, { id: "b", status: "Pending", extra: 1 });
    expect(result).toEqual([{ id: "b", status: "Pending", extra: 1 }, { id: "a" }]);
    expect(result.filter((x) => x.id === "b")).toHaveLength(1);
  });

  it("moves an existing item to the front", () => {
    expect(upsertById([{ id: "a" }, { id: "b" }], { id: "b" })).toEqual([
      { id: "b" },
      { id: "a" },
    ]);
  });

  it("does not mutate the original list", () => {
    const list = [{ id: "a" }];
    upsertById(list, { id: "b" });
    expect(list).toEqual([{ id: "a" }]);
  });

  it("copes with empty input", () => {
    expect(upsertById(undefined, { id: "a" })).toEqual([{ id: "a" }]);
    expect(upsertById([{ id: "a" }], null)).toEqual([{ id: "a" }]);
    expect(upsertById(null, null)).toEqual([]);
  });
});

describe("resultCountLabel", () => {
  it("shows the exact total once everything is loaded", () => {
    expect(resultCountLabel(26, false)).toBe("26 results");
    expect(resultCountLabel(1, false)).toBe("1 result");
    expect(resultCountLabel(0, false)).toBe("0 results");
  });

  it("shows N+ while more listings can still load", () => {
    expect(resultCountLabel(20, true)).toBe("20+ results");
    expect(resultCountLabel(3, true)).toBe("3+ results");
  });

  it("copes with bad input", () => {
    expect(resultCountLabel(undefined)).toBe("0 results");
  });
});
