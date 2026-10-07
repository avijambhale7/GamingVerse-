import { describe, expect, it } from "vitest";
import { authorLabel, plural, verdictName } from "./authorLabel.js";

describe("authorLabel", () => {
  it("shows @username when the entry stored one", () => {
    expect(authorLabel({ userHandle: "ram_gamer", userName: "Ram Kumar" })).toBe(
      "@ram_gamer",
    );
  });

  it("falls back to the display name without @ for older entries", () => {
    expect(authorLabel({ userName: "Ram Kumar" })).toBe("Ram Kumar");
    expect(authorLabel({ userHandle: "", userName: "Ram" })).toBe("Ram");
  });

  it("ignores a stored handle that isn't a valid username", () => {
    expect(authorLabel({ userHandle: "Not A Handle", userName: "Ram" })).toBe("Ram");
  });

  it("never returns an empty label", () => {
    expect(authorLabel({})).toBe("Gamer");
    expect(authorLabel(null)).toBe("Gamer");
    expect(authorLabel()).toBe("Gamer");
  });
});

describe("verdictName", () => {
  it("gives readable verdict names", () => {
    expect(verdictName("go-for-it")).toBe("Go for it");
    expect(verdictName("perfection")).toBe("Perfection");
    expect(verdictName("skip")).toBe("Skip");
    expect(verdictName("timepass")).toBe("Timepass");
  });

  it("copes with unknown values", () => {
    expect(verdictName("some-thing")).toBe("some thing");
    expect(verdictName(undefined)).toBe("");
  });
});

describe("plural", () => {
  it("uses the singular for exactly one", () => {
    expect(plural(1, "Follower")).toBe("1 Follower");
    expect(plural(1, "station")).toBe("1 station");
  });

  it("uses the plural otherwise", () => {
    expect(plural(0, "Follower")).toBe("0 Followers");
    expect(plural(2, "Follower")).toBe("2 Followers");
    expect(plural(3, "Activity", "Activities")).toBe("3 Activities");
  });
});
