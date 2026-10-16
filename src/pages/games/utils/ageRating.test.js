import { describe, expect, it } from "vitest";
import {
  dedupeGames,
  esrbAge,
  seriesAge,
  gameNameKey,
  rememberEsrbRating,
  requiredGameAge,
} from "./ageRating.js";
import { canAccessGame } from "./access.js";

describe("gameNameKey", () => {
  it("gives every spelling of a title the same key", () => {
    const gta6 = gameNameKey("GTA VI");
    expect(gameNameKey("Grand Theft Auto VI")).toBe(gta6);
    expect(gameNameKey("GTA 6")).toBe(gta6);
    expect(gameNameKey("gta vi")).toBe(gta6);
    expect(gameNameKey("Grand Theft Auto V")).toBe(gameNameKey("GTA 5"));
    expect(gameNameKey("God of War Ragnarök")).toBe(gameNameKey("God of War Ragnarok"));
    expect(gameNameKey("Counter-Strike 2")).toBe(gameNameKey("Counter Strike 2"));
    expect(gameNameKey("The Last of Us")).toBe(gameNameKey("Last of Us"));
  });

  it("keeps different games apart", () => {
    expect(gameNameKey("GTA V")).not.toBe(gameNameKey("GTA VI"));
    expect(gameNameKey("God of War")).not.toBe(gameNameKey("God of War Ragnarok"));
  });
});

describe("requiredGameAge — GamingVerse ratings, any spelling", () => {
  it("rates every spelling of GTA VI 18+", () => {
    expect(requiredGameAge("GTA VI")).toBe(18);
    expect(requiredGameAge("Grand Theft Auto VI")).toBe(18);
    expect(requiredGameAge("GTA 6")).toBe(18);
    expect(requiredGameAge({ name: "Grand Theft Auto V" })).toBe(18);
  });

  it("GamingVerse's rating beats ESRB", () => {
    // Minecraft is 7+ in GamingVerse even if RAWG said otherwise.
    expect(requiredGameAge({ name: "Minecraft", esrbSlug: "mature" })).toBe(7);
  });
});

describe("requiredGameAge — RAWG's ESRB rating", () => {
  it("maps ESRB ratings", () => {
    expect(esrbAge("everyone")).toBe(7);
    expect(esrbAge("everyone-10-plus")).toBe(10);
    expect(esrbAge("teen")).toBe(13);
    expect(esrbAge("mature")).toBe(18);
    expect(esrbAge("adults-only")).toBe(18);
    expect(esrbAge("rating-pending")).toBeNull();
  });

  it("a RAWG game rated Mature needs 18+", () => {
    expect(requiredGameAge({ name: "Some Shooter 4", esrbSlug: "mature" })).toBe(18);
  });

  it("remembers ESRB ratings seen in RAWG results", () => {
    rememberEsrbRating("Resident Evil Requiem", "mature");
    expect(requiredGameAge("Resident Evil Requiem")).toBe(18);
    expect(requiredGameAge("resident evil requiem")).toBe(18);
  });
});

describe("requiredGameAge — unknown games", () => {
  it("stays 16+ with no GamingVerse and no ESRB rating (current behaviour)", () => {
    expect(requiredGameAge("A Game Nobody Rated")).toBe(16);
    expect(requiredGameAge({ name: "Unrated Indie", esrbSlug: "" })).toBe(16);
  });
});

describe("a 16-year-old can't open 18+ games", () => {
  it("blocks every spelling of GTA VI and a Mature RAWG game", () => {
    expect(canAccessGame({ name: "Grand Theft Auto VI" }, 16)).toBe(false);
    expect(canAccessGame({ name: "GTA 6" }, 16)).toBe(false);
    expect(canAccessGame({ name: "Some Shooter 4", esrbSlug: "mature" }, 16)).toBe(false);
    expect(canAccessGame({ name: "Grand Theft Auto VI" }, 18)).toBe(true);
  });

  it("still lets them open games rated for them", () => {
    expect(canAccessGame({ name: "Minecraft" }, 16)).toBe(true);
    expect(canAccessGame({ name: "Family Fun", esrbSlug: "everyone" }, 16)).toBe(true);
  });
});

describe("dedupeGames", () => {
  const catalogue = [{ name: "GTA VI", image: "/posters/gta6.webp" }];

  it("removes the same title under different names, keeping the GamingVerse entry", () => {
    const list = [
      { name: "Grand Theft Auto VI", rawgId: 1, releaseDate: "2026-11-19", esrbSlug: "mature", image: "" },
      { name: "GTA VI", releaseDate: "19 November 2026" },
      { name: "Other Game", rawgId: 2 },
    ];
    const result = dedupeGames(list, catalogue);
    expect(result.map((g) => g.name)).toEqual(["GTA VI", "Other Game"]);
    expect(result[0]).toMatchObject({
      image: "/posters/gta6.webp",
      rawgId: 1,
      releaseDate: "2026-11-19",
      esrbSlug: "mature",
    });
  });

  it("copes with missing input", () => {
    expect(dedupeGames(undefined, undefined)).toEqual([]);
  });
});

describe("spin-offs of 18+ series", () => {
  it("rates games starting with an 18+ series name 18+", () => {
    expect(requiredGameAge("Grand Theft Auto: San Andreas")).toBe(18);
    expect(requiredGameAge("GTA Vice City Stories")).toBe(18);
    expect(requiredGameAge("Cyberpunk 2077: Phantom Liberty")).toBe(18);
    expect(requiredGameAge("Red Dead Redemption: Undead Nightmare")).toBe(18);
    expect(requiredGameAge("Resident Evil 7: Biohazard")).toBe(18);
    expect(requiredGameAge("The Last of Us: Left Behind")).toBe(18);
    expect(requiredGameAge("Mortal Kombat 11")).toBe(18);
    expect(requiredGameAge("Call of Duty: Black Ops 6")).toBe(18);
  });

  it("matches whole words only, never part of a word", () => {
    expect(seriesAge("Gtamania")).toBeNull();
    expect(seriesAge("Call of Juarez")).toBeNull();
    expect(seriesAge("Red Dead Pixels")).toBeNull();
    expect(seriesAge("Residential Evil Sim")).toBeNull();
    expect(seriesAge("Cyberpunk Racer")).toBeNull();
    expect(requiredGameAge("Gtamania")).toBe(16);
  });

  it("only counts the series name at the start of the title", () => {
    expect(seriesAge("Learning GTA Physics")).toBeNull();
  });

  it("never overrides a game's own GamingVerse or ESRB rating", () => {
    // ESRB says Teen for this made-up spin-off: that wins over the series.
    expect(requiredGameAge({ name: "Call of Duty Kids Edition", esrbSlug: "teen" })).toBe(13);
    // GamingVerse rating wins over everything.
    expect(requiredGameAge("GTA V")).toBe(18);
  });

  it("blocks 16-year-olds from series spin-offs", () => {
    expect(canAccessGame({ name: "Grand Theft Auto: San Andreas" }, 16)).toBe(false);
    expect(canAccessGame({ name: "Cyberpunk 2077: Phantom Liberty" }, 17)).toBe(false);
    expect(canAccessGame({ name: "Cyberpunk 2077: Phantom Liberty" }, 18)).toBe(true);
  });
});
