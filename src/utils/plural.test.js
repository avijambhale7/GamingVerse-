import { describe, expect, it } from "vitest";
import { plural, pluralWord } from "./plural.js";

describe("plural", () => {
  it("uses the singular for exactly one", () => {
    expect(plural(1, "member")).toBe("1 member");
    expect(plural(1, "Follower")).toBe("1 Follower");
    expect(plural("1", "seat")).toBe("1 seat");
  });

  it("uses the plural for zero and more than one", () => {
    expect(plural(0, "member")).toBe("0 members");
    expect(plural(2, "member")).toBe("2 members");
    expect(plural(26, "result")).toBe("26 results");
  });

  it("supports irregular plurals", () => {
    expect(plural(1, "reply", "replies")).toBe("1 reply");
    expect(plural(3, "reply", "replies")).toBe("3 replies");
    expect(plural(2, "station type")).toBe("2 station types");
  });

  it("treats missing counts as zero", () => {
    expect(plural(undefined, "post")).toBe("0 posts");
    expect(plural(null, "like")).toBe("0 likes");
  });
});

describe("pluralWord", () => {
  it("returns just the word, for labels under a big number", () => {
    expect(pluralWord(1, "Follower")).toBe("Follower");
    expect(pluralWord(0, "Follower")).toBe("Followers");
    expect(pluralWord(5, "Station")).toBe("Stations");
  });
});
