import { describe, expect, it } from "vitest";
import { seededShuffle } from "./shuffle.js";

const games = Array.from({ length: 20 }, (_, i) => `Game ${i}`);

describe("seededShuffle", () => {
  it("keeps every game exactly once", () => {
    const out = seededShuffle(games, 42);
    expect(out).toHaveLength(games.length);
    expect([...out].sort()).toEqual([...games].sort());
  });

  it("gives the same order for the same seed", () => {
    expect(seededShuffle(games, 7)).toEqual(seededShuffle(games, 7));
  });

  it("gives a different order for a different seed", () => {
    expect(seededShuffle(games, 1)).not.toEqual(seededShuffle(games, 2));
  });

  it("does not change the original list", () => {
    const copy = [...games];
    seededShuffle(games, 3);
    expect(games).toEqual(copy);
  });
});
