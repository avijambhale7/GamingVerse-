import { describe, expect, it } from "vitest";
import { notificationTarget } from "./notificationTarget.js";

describe("notificationTarget", () => {
  it("opens the game a verdict, review or list change is about", () => {
    expect(
      notificationTarget({
        title: "GamingVerse Verdict",
        message:
          "Your timepass verdict for Warhammer 40,000: Dawn of War - Definitive Edition was saved.",
      }),
    ).toEqual({
      type: "game",
      name: "Warhammer 40,000: Dawn of War - Definitive Edition",
    });
    expect(
      notificationTarget({
        title: "GamingVerse Review",
        message: "Your 'go for it' review for Elden Ring was posted.",
      }),
    ).toEqual({ type: "game", name: "Elden Ring" });
    expect(
      notificationTarget({
        title: "GamingVerse Verdict",
        message: "Your 'go for it' verdict for Need for Speed Heat was saved.",
      }),
    ).toEqual({ type: "game", name: "Need for Speed Heat" });
    expect(
      notificationTarget({
        title: "GamingVerse",
        message: "GTA V was added to Play Later.",
      }),
    ).toEqual({ type: "game", name: "GTA V" });
  });

  it("prefers the stored game name over the message", () => {
    expect(
      notificationTarget({ title: "GamingVerse Verdict", game: "Hades", message: "x" }),
    ).toEqual({ type: "game", name: "Hades" });
  });

  it("opens the section for marketplace, café, feed and release", () => {
    expect(
      notificationTarget({
        title: "GamingVerse Market",
        message: "Your request for acc was sent. Waiting for admin approval.",
      }),
    ).toEqual({ type: "view", view: "marketplace" });
    expect(notificationTarget({ title: "GamingVerse Café" })).toEqual({ type: "view", view: "cafe" });
    expect(notificationTarget({ title: "GamingVerse Feed" })).toEqual({ type: "view", view: "spaces" });
    expect(notificationTarget({ title: "GamingVerse Release" })).toEqual({
      type: "view",
      view: "upcomings",
    });
  });

  it("goes nowhere when it can't tell", () => {
    expect(notificationTarget({ title: "GamingVerse Support", message: "Hi" })).toBeNull();
    expect(notificationTarget({ title: "GamingVerse", message: "Welcome!" })).toBeNull();
    expect(notificationTarget(null)).toBeNull();
  });
});
