import { describe, expect, it } from "vitest";
import { ageOn, checkBirthDate } from "./birthDate.js";

const TODAY = new Date(2026, 9, 8); // 8 Oct 2026, local time

describe("ageOn", () => {
  it("counts whole years, before and after the birthday", () => {
    expect(ageOn("2000-10-08", TODAY)).toBe(26);
    expect(ageOn("2000-10-09", TODAY)).toBe(25);
    expect(ageOn("2008-01-01", TODAY)).toBe(18);
  });

  it("rejects dates that don't exist", () => {
    expect(ageOn("2023-02-30", TODAY)).toBeNull();
    expect(ageOn("2023-13-01", TODAY)).toBeNull();
    expect(ageOn("08/10/2000", TODAY)).toBeNull();
  });

  it("accepts a real leap day", () => {
    expect(ageOn("2004-02-29", TODAY)).toBe(22);
  });
});

describe("checkBirthDate", () => {
  it("accepts a valid date and returns the age", () => {
    expect(checkBirthDate("2010-05-01", TODAY)).toEqual({ ok: true, age: 16 });
    expect(checkBirthDate("2026-10-08", TODAY)).toEqual({ ok: true, age: 0 });
  });

  it("explains what's wrong", () => {
    expect(checkBirthDate("", TODAY).error).toMatch(/YYYY-MM-DD/);
    expect(checkBirthDate("2023-02-30", TODAY).error).toMatch(/doesn't exist/);
    expect(checkBirthDate("2030-01-01", TODAY).error).toMatch(/future/);
    expect(checkBirthDate("1890-01-01", TODAY).error).toMatch(/120/);
  });
});
