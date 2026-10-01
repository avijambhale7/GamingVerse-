import { describe, expect, it } from "vitest";
import timeAgo from "./timeAgo.js";

describe("timeAgo", () => {
  const minutesAgo = (n) => Date.now() - n * 60000;

  it("says just now under a minute", () => {
    expect(timeAgo(Date.now() - 10000)).toBe("just now");
  });

  it("uses minutes, hours, then days", () => {
    expect(timeAgo(minutesAgo(5))).toBe("5m ago");
    expect(timeAgo(minutesAgo(180))).toBe("3h ago");
    expect(timeAgo(minutesAgo(60 * 50))).toBe("2d ago");
  });

  it("is empty for missing or future times", () => {
    expect(timeAgo(0)).toBe("");
    expect(timeAgo(Date.now() + 60000)).toBe("");
  });
});
