import { describe, expect, it } from "vitest";
import {
  containsBlockedGameTerm,
  localImageSimilarity,
  normalizeCatalogueImageKey,
  normalizeGameSearchText,
  normalizePriorityGameName,
} from "./text.js";

describe("normalizeGameSearchText", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeGameSearchText("Assassin's Creed: Shadows")).toBe(
      "assassin s creed shadows",
    );
  });

  it("collapses repeated whitespace", () => {
    expect(normalizeGameSearchText("Grand   Theft   Auto")).toBe(
      "grand theft auto",
    );
  });

  it("returns an empty string for empty input", () => {
    expect(normalizeGameSearchText("")).toBe("");
    expect(normalizeGameSearchText()).toBe("");
  });
});

describe("normalizeCatalogueImageKey", () => {
  it("strips leading 'the' and other filler words", () => {
    expect(normalizeCatalogueImageKey("The Witcher 3")).toBe("witcher 3");
  });

  // NOTE: this documents the function's actual behavior, not its intent.
  // normalizeGameSearchText() already turns "Marvel's" into two separate
  // tokens ("marvel", "s") before the \bmarvels\b strip runs, so that
  // strip never matches and the "marvel s" prefix survives. Flagging
  // this rather than "fixing" it — call it out if it should change.
  it("does not currently strip the Marvel's prefix (dead code — see note)", () => {
    expect(normalizeCatalogueImageKey("Marvel's Spider-Man 2")).toBe(
      "marvel s spider man 2",
    );
  });

  it("treats a colon-separated subtitle the same as a plain title", () => {
    expect(normalizeCatalogueImageKey("Black Myth: Wukong")).toBe(
      normalizeCatalogueImageKey("Black Myth Wukong"),
    );
  });
});

describe("normalizePriorityGameName", () => {
  it("strips apostrophes and colons but keeps spacing", () => {
    expect(normalizePriorityGameName("Assassin's Creed: Shadows")).toBe(
      "assassins creed shadows",
    );
  });
});

describe("localImageSimilarity", () => {
  it("scores an exact name match at 1", () => {
    expect(localImageSimilarity("God of War", "God of War")).toBe(1);
  });

  it("scores completely unrelated names at 0", () => {
    expect(localImageSimilarity("Minecraft", "Cyberpunk 2077")).toBe(0);
  });

  it("gives partial credit for a shared token", () => {
    // "Grand Theft Auto VI" vs "GTA VI" only share the "vi" token, so the
    // fuzzy match is weak — this is the exact case that caused Games.jsx's
    // poster grid to fall through to a RAWG image instead of the local one.
    const score = localImageSimilarity("Grand Theft Auto VI", "GTA VI");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.5);
  });
});

describe("containsBlockedGameTerm", () => {
  it("flags a known unsafe title", () => {
    expect(containsBlockedGameTerm("Blue Whale Challenge")).toBe(true);
  });

  it("does not flag an ordinary game name", () => {
    expect(containsBlockedGameTerm("God of War Ragnarök")).toBe(false);
  });
});
