import { describe, expect, it } from "vitest";
import timeAgo, { reviewAge } from "./timeAgo.js";

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

describe("reviewAge", () => {
  const now = Date.UTC(2026, 9, 17, 12, 0);
  it("labels reviews and comments", () => {
    expect(reviewAge(now - 10 * 60000, now)).toBe("Just now");
    expect(reviewAge(now - 5 * 3600000, now)).toBe("5h ago");
    expect(reviewAge(now - 24 * 3600000, now)).toBe("1 day ago");
    expect(reviewAge(now - 3 * 86400000, now)).toBe("3 days ago");
  });

  it("is empty when there's no time (never 'NaN days ago')", () => {
    expect(reviewAge(undefined, now)).toBe("");
    expect(reviewAge(0, now)).toBe("");
  });
});
