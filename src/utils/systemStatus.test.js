import { describe, expect, it } from "vitest";
import {
  PHOTO_SIZE_WARNING_BYTES,
  canonicalJson,
  dataUrlChars,
  formatBytes,
  oldestTime,
  rulesFingerprint,
  stripJsonComments,
  waitingLabel,
} from "./systemStatus.js";

describe("rules comparison", () => {
  const rules = { rules: { a: { ".read": "auth != null" }, b: { ".write": false } } };

  it("ignores key order and spacing", () => {
    const reordered = '{ "rules": { "b": { ".write": false }, "a": { ".read": "auth != null" } } }';
    expect(rulesFingerprint(reordered)).toBe(rulesFingerprint(JSON.stringify(rules)));
  });

  it("ignores comments, but not comment-like text inside strings", () => {
    const withComments = `{
      // live rules can have comments
      "rules": { /* block */ "a": { ".read": "auth != null" }, "b": { ".write": false } }
    }`;
    expect(rulesFingerprint(withComments)).toBe(rulesFingerprint(rules));
    expect(stripJsonComments('{"x": "a // not a comment"}')).toBe('{"x": "a // not a comment"}');
  });

  it("notices a real difference", () => {
    const changed = { rules: { a: { ".read": "auth == null" }, b: { ".write": false } } };
    expect(rulesFingerprint(changed)).not.toBe(rulesFingerprint(rules));
  });

  it("canonicalJson keeps arrays in order", () => {
    expect(canonicalJson({ b: [2, 1], a: "x" })).toBe('{"a":"x","b":[2,1]}');
  });
});

describe("waitingLabel / oldestTime", () => {
  const now = Date.UTC(2026, 9, 8, 12, 0);
  it("says how long something has waited", () => {
    expect(waitingLabel(now - 30 * 1000, now)).toBe("just now");
    expect(waitingLabel(now - 15 * 60000, now)).toBe("15 min");
    expect(waitingLabel(now - 3600000, now)).toBe("1 hour");
    expect(waitingLabel(now - 5 * 3600000, now)).toBe("5 hours");
    expect(waitingLabel(now - 2 * 86400000, now)).toBe("2 days");
    expect(waitingLabel(0, now)).toBe("");
    expect(waitingLabel(now + 1000, now)).toBe("");
  });

  it("finds the oldest item", () => {
    expect(oldestTime([{ createdAt: 30 }, { createdAt: 10 }, {}])).toBe(10);
    expect(oldestTime([])).toBe(0);
    expect(oldestTime([{ t: 5 }, { t: 2 }], (x) => x.t)).toBe(2);
  });
});

describe("photo storage size", () => {
  it("adds up data URLs anywhere in the data, ignoring normal links", () => {
    const data = {
      p1: { imageData: "data:image/jpeg;base64,AAAA", caption: "hi" },
      p2: { image: "https://x/y.jpg", photos: ["data:image/jpeg;base64,BB", "https://z"] },
    };
    expect(dataUrlChars(data)).toBe(
      "data:image/jpeg;base64,AAAA".length + "data:image/jpeg;base64,BB".length,
    );
    expect(dataUrlChars(null)).toBe(0);
  });

  it("formats sizes and has a 500 MB warning line", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(PHOTO_SIZE_WARNING_BYTES).toBe(500 * 1024 * 1024);
  });
});
