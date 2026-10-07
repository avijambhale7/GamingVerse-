import { describe, expect, it } from "vitest";
import { upsertById } from "./listUtils.js";

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
