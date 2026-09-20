import { describe, expect, it } from "vitest";
import {
  getGameCategory,
  getGameDetails,
  matchesHomeCategory,
} from "./gameInfo.js";

describe("getGameDetails", () => {
  it("returns the curated entry for a known game", () => {
    const details = getGameDetails("Cyberpunk 2077");
    expect(details.title).toBe("Cyberpunk 2077");
    expect(details.description).not.toBe("");
  });

  it("falls back to generic placeholder copy for an unknown game", () => {
    const details = getGameDetails("A Game That Does Not Exist");
    expect(details.title).toBe("A Game That Does Not Exist");
    expect(details.genre).toBe("Game");
    expect(details.description.length).toBeGreaterThan(0);
  });
});

describe("getGameCategory", () => {
  it("recognises a well-known RPG by name even without genre data", () => {
    expect(getGameCategory({ name: "Elden Ring" })).toBe("RPG");
  });

  it("uses the explicit genre field when one is given", () => {
    expect(getGameCategory({ name: "Some Game", genre: "Racing" })).toBe(
      "Racing",
    );
  });

  it("defaults to Action when nothing else matches", () => {
    expect(getGameCategory({ name: "Totally Unclassified Game" })).toBe(
      "Action",
    );
  });
});

describe("matchesHomeCategory", () => {
  it("always matches the 'All' category", () => {
    expect(matchesHomeCategory({ name: "Anything" }, "All")).toBe(true);
  });

  it("matches a game against its own genre field", () => {
    expect(
      matchesHomeCategory({ name: "Some Game", genre: "RPG" }, "RPG"),
    ).toBe(true);
  });

  it("does not match an unrelated category", () => {
    expect(
      matchesHomeCategory({ name: "Some Game", genre: "Racing" }, "RPG"),
    ).toBe(false);
  });
});
