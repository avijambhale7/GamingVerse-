import { describe, expect, it } from "vitest";
import { cachedCoords, distanceKm, formatKm } from "./geo.js";
import { stars, summariseReviews } from "./reviews.js";
import { decodeTicket, encodeTicket } from "./ticket.js";

describe("cachedCoords (from a Google Maps link)", () => {
  it("reads @lat,lng links", () => {
    expect(
      cachedCoords({ mapUrl: "https://www.google.com/maps/@18.5204,73.8567,15z" }),
    ).toEqual({ lat: 18.5204, lng: 73.8567 });
  });

  it("reads ?q=lat,lng links", () => {
    expect(
      cachedCoords({ mapUrl: "https://maps.google.com/?q=19.076,72.8777" }),
    ).toEqual({ lat: 19.076, lng: 72.8777 });
  });

  it("prefers the exact !3d!4d pin over the map centre", () => {
    expect(
      cachedCoords({
        mapUrl:
          "https://www.google.com/maps/place/Cafe/@18.5,73.8,17z/data=!3d18.5311!4d73.8475",
      }),
    ).toEqual({ lat: 18.5311, lng: 73.8475 });
  });

  it("returns null for links without coordinates", () => {
    expect(cachedCoords({ mapUrl: "https://maps.app.goo.gl/abc123" })).toBeNull();
  });
});

describe("distanceKm / formatKm", () => {
  it("measures Pune to Mumbai at about 120 km", () => {
    const km = distanceKm({ lat: 18.5204, lng: 73.8567 }, { lat: 19.076, lng: 72.8777 });
    expect(km).toBeGreaterThan(115);
    expect(km).toBeLessThan(125);
  });

  it("formats short and long distances", () => {
    expect(formatKm(0.45)).toBe("450 m away");
    expect(formatKm(2.34)).toBe("2.3 km away");
    expect(formatKm(null)).toBe("");
  });
});

describe("summariseReviews", () => {
  it("averages ratings per café and indexes each user's review", () => {
    const summary = summariseReviews({
      c1: {
        a: { rating: 5, createdAt: 2 },
        b: { rating: 4, createdAt: 3 },
      },
      c2: {},
    });
    expect(summary.c1.avg).toBe(4.5);
    expect(summary.c1.count).toBe(2);
    expect(summary.c1.list[0].uid).toBe("b"); // newest first
    expect(summary.c1.byUser.a.rating).toBe(5);
    expect(summary.c2).toBeUndefined();
  });

  it("draws star strings", () => {
    expect(stars(4)).toBe("★★★★☆");
    expect(stars(4.6)).toBe("★★★★★");
  });
});

describe("ticket codes (QR or typed by hand)", () => {
  it("round-trips a ticket", () => {
    expect(decodeTicket(encodeTicket("uid123", "-Nbooking"))).toEqual({
      uid: "uid123",
      bookingId: "-Nbooking",
    });
  });

  it("ignores spaces and line breaks from typing or pasting", () => {
    expect(decodeTicket("  uid123 | -Nbooking" + String.fromCharCode(10))).toEqual({
      uid: "uid123",
      bookingId: "-Nbooking",
    });
  });

  it("rejects anything that isn't exactly uid|bookingId", () => {
    expect(decodeTicket("")).toBeNull();
    expect(decodeTicket("justone")).toBeNull();
    expect(decodeTicket("a|")).toBeNull();
    expect(decodeTicket("a|b|c")).toBeNull();
    expect(decodeTicket(null)).toBeNull();
  });
});
