import { describe, expect, it } from "vitest";
import { bookingEndsAt, canMarkNoShow, noShowCount } from "./noShow.js";

// 10:00 AM India on 8 Oct 2026 = 04:30 UTC; the slot ends 05:30 UTC.
const booking = { status: "Confirmed", date: "2026-10-08", time: "10:00 AM" };
const SLOT_END = Date.UTC(2026, 9, 8, 5, 30);

describe("bookingEndsAt", () => {
  it("is the end of the booked hour, in India time", () => {
    expect(bookingEndsAt(booking)).toBe(SLOT_END);
    expect(bookingEndsAt({ date: "2026-10-08", time: "11:00 PM" })).toBe(
      Date.UTC(2026, 9, 8, 18, 30),
    );
  });

  it("is NaN for unreadable bookings", () => {
    expect(Number.isNaN(bookingEndsAt({ date: "2026-10-08", time: "" }))).toBe(true);
    expect(Number.isNaN(bookingEndsAt({ date: "x", time: "10:00 AM" }))).toBe(true);
  });
});

describe("canMarkNoShow", () => {
  it("only once the booked hour is over", () => {
    expect(canMarkNoShow(booking, SLOT_END - 1)).toBe(false);
    expect(canMarkNoShow(booking, SLOT_END)).toBe(true);
    expect(canMarkNoShow(booking, SLOT_END + 3600000)).toBe(true);
  });

  it("only for confirmed bookings", () => {
    for (const status of ["Pending", "Completed", "Cancelled", "Rejected", "No-show"]) {
      expect(canMarkNoShow({ ...booking, status }, SLOT_END + 1)).toBe(false);
    }
  });
});

describe("noShowCount", () => {
  const list = [
    { customerId: "a", cafeId: "c1", status: "No-show" },
    { customerId: "a", cafeId: "c1", status: "No-show" },
    { customerId: "a", cafeId: "c2", status: "No-show" },
    { customerId: "a", cafeId: "c1", status: "Completed" },
    { customerId: "b", cafeId: "c1", status: "No-show" },
  ];

  it("counts one customer's no-shows at one café", () => {
    expect(noShowCount(list, "a", "c1")).toBe(2);
    expect(noShowCount(list, "a", "c2")).toBe(1);
    expect(noShowCount(list, "b", "c1")).toBe(1);
    expect(noShowCount(list, "c", "c1")).toBe(0);
  });

  it("copes with missing input", () => {
    expect(noShowCount(undefined, "a", "c1")).toBe(0);
    expect(noShowCount(list, "", "c1")).toBe(0);
  });
});
