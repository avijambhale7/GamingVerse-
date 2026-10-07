import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  indiaDateISO,
  indiaMinutesNow,
  indiaMoment,
  indiaMonthOf,
  indiaTodayISO,
  indiaUpcomingDates,
  weekdayOfISO,
} from "./indiaTime.js";

// 2026-10-07T20:30:00Z = 8 Oct 2026, 02:00 in India — still 7 Oct in
// New York (16:30) and in UTC, so a device-local clock would be wrong.
const LATE_NIGHT_UTC = Date.UTC(2026, 9, 7, 20, 30);
// 2026-10-31T19:00:00Z = 1 Nov 2026, 00:30 in India (month boundary).
const MONTH_EDGE_UTC = Date.UTC(2026, 9, 31, 19, 0);

// Put TZ back exactly (assigning undefined would store "undefined").
function restoreTz(saved) {
  if (saved === undefined) delete globalThis.process.env.TZ;
  else globalThis.process.env.TZ = saved;
}

function checks() {
  it("gives India's date, not the device's", () => {
    expect(indiaDateISO(LATE_NIGHT_UTC)).toBe("2026-10-08");
    expect(indiaTodayISO(LATE_NIGHT_UTC)).toBe("2026-10-08");
  });

  it("gives India's minutes after midnight", () => {
    expect(indiaMinutesNow(LATE_NIGHT_UTC)).toBe(2 * 60);
  });

  it("lists the next India dates for the date chips", () => {
    expect(indiaUpcomingDates(3, LATE_NIGHT_UTC)).toEqual([
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
    ]);
  });

  it("puts revenue in India's month", () => {
    expect(indiaMonthOf(MONTH_EDGE_UTC)).toEqual({ year: 2026, month: 10 });
  });

  it("works out weekdays from the calendar date", () => {
    expect(weekdayOfISO("2026-10-08")).toBe("Thu");
    expect(weekdayOfISO("2026-10-11")).toBe("Sun");
    expect(weekdayOfISO("nope")).toBe("");
  });

  it("turns an India date + time back into the right moment", () => {
    expect(indiaMoment("2026-10-08", 2 * 60)).toBe(LATE_NIGHT_UTC);
    // 10:00 AM in India = 04:30 UTC
    expect(indiaMoment("2026-10-08", 10 * 60)).toBe(Date.UTC(2026, 9, 8, 4, 30));
    expect(Number.isNaN(indiaMoment("bad", 0))).toBe(true);
  });
}

describe("India time (device in India)", () => {
  let saved;
  beforeAll(() => {
    saved = globalThis.process.env.TZ;
    globalThis.process.env.TZ = "Asia/Kolkata";
  });
  afterAll(() => {
    restoreTz(saved);
  });
  checks();
});

for (const zone of ["America/New_York", "America/Los_Angeles", "Asia/Tokyo", "UTC"]) {
  describe(`India time (device set to ${zone})`, () => {
    let saved;
    beforeAll(() => {
      saved = globalThis.process.env.TZ;
      globalThis.process.env.TZ = zone;
    });
    afterAll(() => {
      restoreTz(saved);
    });

    it("the device clock really is in another zone (sanity check)", () => {
      if (zone === "America/New_York") {
        // 16:30 on 7 Oct in New York
        expect(new Date(LATE_NIGHT_UTC).getDate()).toBe(7);
      }
    });

    checks();
  });
}
