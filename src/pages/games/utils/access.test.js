import { describe, expect, it } from "vitest";
import {
  calculateAgeFromDob,
  canAccessGame,
  getRequiredGameAge,
  isBlockedGame,
} from "./access.js";

describe("calculateAgeFromDob", () => {
  it("returns null for no date of birth", () => {
    expect(calculateAgeFromDob("")).toBeNull();
    expect(calculateAgeFromDob(undefined)).toBeNull();
  });

  it("returns null for an unparseable date", () => {
    expect(calculateAgeFromDob("not-a-date")).toBeNull();
  });

  it("computes age from a date well in the past", () => {
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    const dob = twentyYearsAgo.toISOString().slice(0, 10);
    expect(calculateAgeFromDob(dob)).toBe(20);
  });

  it("rejects an out-of-range age (e.g. a typo'd future-looking DOB)", () => {
    expect(calculateAgeFromDob("1800-01-01")).toBeNull();
  });
});

describe("getRequiredGameAge", () => {
  it("reads a known game's configured rating", () => {
    expect(getRequiredGameAge("GTA V")).toBe(18);
    expect(getRequiredGameAge("Among Us")).toBe(7);
  });

  it("defaults an unlisted game to 16+", () => {
    expect(getRequiredGameAge("Some Totally Unknown Game")).toBe(16);
  });
});

describe("isBlockedGame", () => {
  it("flags the platform-safety-blocked title", () => {
    expect(isBlockedGame({ name: "Blue Whale" })).toBe(true);
  });

  it("does not flag an ordinary catalogue game", () => {
    expect(isBlockedGame({ name: "Minecraft" })).toBe(false);
  });
});

describe("canAccessGame", () => {
  it("denies access to a blocked game regardless of age", () => {
    expect(canAccessGame({ name: "Blue Whale" }, 30)).toBe(false);
  });

  it("denies an 18+ game to an unverified account (no DOB on file)", () => {
    expect(canAccessGame({ name: "GTA V" }, null)).toBe(false);
  });

  it("allows an under-16-rated game to an unverified account", () => {
    expect(canAccessGame({ name: "Among Us" }, null)).toBe(true);
  });

  it("denies an 18+ game to a verified 16-year-old", () => {
    expect(canAccessGame({ name: "GTA V" }, 16)).toBe(false);
  });

  it("allows an 18+ game to a verified adult", () => {
    expect(canAccessGame({ name: "GTA V" }, 18)).toBe(true);
  });
});
