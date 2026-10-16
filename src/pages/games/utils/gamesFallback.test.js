import { describe, expect, it } from "vitest";
import {
  futureGames,
  isUpcomingRelease,
  readSavedGames,
  releaseDateISO,
  savedOnLabel,
} from "./gamesFallback.js";

describe("releaseDateISO", () => {
  it("reads the date formats used in the app", () => {
    expect(releaseDateISO("19 November 2026")).toBe("2026-11-19");
    expect(releaseDateISO("5 Oct 2027")).toBe("2027-10-05");
    expect(releaseDateISO("Nov 19, 2026")).toBe("2026-11-19");
    expect(releaseDateISO("2026-11-19")).toBe("2026-11-19");
  });

  it("returns empty for dates it can't place", () => {
    for (const value of ["TBA", "—", "2026", "", undefined, "Someday 2026"]) {
      expect(releaseDateISO(value)).toBe("");
    }
  });
});

describe("futureGames", () => {
  const games = [
    { name: "Old", releaseDate: "20 March 2025" },
    { name: "Soon", releaseDate: "19 November 2026" },
    { name: "Later", releaseDate: "2027-02-01" },
    { name: "Unknown", releaseDate: "TBA" },
    { name: "Today", releaseDate: "17 October 2026" },
  ];

  it("keeps only games released after today, soonest first", () => {
    expect(futureGames(games, "2026-10-17").map((g) => g.name)).toEqual([
      "Soon",
      "Later",
    ]);
  });

  it("copes with missing input", () => {
    expect(futureGames(undefined, "2026-10-17")).toEqual([]);
  });
});

describe("readSavedGames", () => {
  const ok = { savedAt: 1, automaticGames: [{ name: "A" }], upcomingGames: [] };

  it("returns a saved list whatever its age", () => {
    expect(readSavedGames(JSON.stringify(ok))).toEqual(ok);
  });

  it("ignores empty, broken or incomplete saves", () => {
    expect(readSavedGames(null)).toBeNull();
    expect(readSavedGames("{not json")).toBeNull();
    expect(readSavedGames(JSON.stringify({ ...ok, savedAt: 0 }))).toBeNull();
    expect(readSavedGames(JSON.stringify({ savedAt: 1, automaticGames: [], upcomingGames: [] }))).toBeNull();
    expect(readSavedGames(JSON.stringify({ savedAt: 1, automaticGames: "x", upcomingGames: [] }))).toBeNull();
  });
});

describe("savedOnLabel", () => {
  it("says when the games were saved", () => {
    expect(savedOnLabel(new Date(2026, 9, 12, 15, 0).getTime())).toBe(
      "Showing games saved on 12 Oct 2026.",
    );
    expect(savedOnLabel(0)).toBe("");
  });
});

describe("isUpcomingRelease", () => {
  it("compares real dates, whatever the format", () => {
    expect(isUpcomingRelease("19 November 2026", "2026-10-17")).toBe(true);
    expect(isUpcomingRelease("2026-11-19", "2026-10-17")).toBe(true);
    expect(isUpcomingRelease("20 March 2025", "2026-10-17")).toBe(false);
    expect(isUpcomingRelease("17 October 2026", "2026-10-17")).toBe(false);
    expect(isUpcomingRelease("TBA", "2026-10-17")).toBe(false);
  });
});

describe("Upcoming when RAWG fails", () => {
  it("shows a built-in game dated '19 November 2026'", () => {
    // RAWG failed and nothing was saved: Upcoming = built-in games with a
    // future date, then the page's own upcoming filter. The game must
    // survive both steps.
    const builtIn = [
      { name: "Grand Theft Auto VI", releaseDate: "19 November 2026" },
      { name: "Old Game", releaseDate: "20 March 2025" },
    ];
    const today = "2026-10-17";
    const fallback = futureGames(builtIn, today);
    const shown = fallback.filter((game) => isUpcomingRelease(game.releaseDate, today));
    expect(shown.map((game) => game.name)).toEqual(["Grand Theft Auto VI"]);
  });
});
