import { describe, expect, it } from "vitest";
import {
  POPUP_UNSUPPORTED_CODES,
  isInAppBrowser,
  isIosDevice,
  needsHomeScreenForPush,
} from "./inAppBrowser.js";

const UA = {
  instagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 325.0.0.0.0 (iPhone14,5; iOS 17_4; en_IN)",
  facebookIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/456.0.0.0;FBBV/1]",
  facebookAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/456.0.0.0;]",
  whatsapp: "WhatsApp/2.24.8.78 A",
  line:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.5.0",
  androidWebView:
    "Mozilla/5.0 (Linux; Android 13; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  chromeDesktop:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  edgeDesktop:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
};

describe("isInAppBrowser", () => {
  it("detects in-app browsers", () => {
    for (const key of [
      "instagram",
      "facebookIos",
      "facebookAndroid",
      "whatsapp",
      "line",
      "androidWebView",
    ]) {
      expect(isInAppBrowser(UA[key]), key).toBe(true);
    }
  });

  it("leaves real browsers alone", () => {
    for (const key of ["chromeAndroid", "safariIphone", "chromeDesktop", "edgeDesktop"]) {
      expect(isInAppBrowser(UA[key]), key).toBe(false);
    }
  });

  it("copes with a missing user agent", () => {
    expect(isInAppBrowser("")).toBe(false);
    expect(isInAppBrowser(undefined)).toBe(false);
  });
});

describe("POPUP_UNSUPPORTED_CODES", () => {
  it("lists the codes that switch Google sign-in to a redirect", () => {
    expect(POPUP_UNSUPPORTED_CODES.has("auth/popup-blocked")).toBe(true);
    expect(
      POPUP_UNSUPPORTED_CODES.has("auth/operation-not-supported-in-this-environment"),
    ).toBe(true);
    expect(POPUP_UNSUPPORTED_CODES.has("auth/popup-closed-by-user")).toBe(false);
  });
});

describe("iPhone / iPad push hint", () => {
  const iphone = { userAgent: UA.safariIphone, platform: "iPhone", maxTouchPoints: 5 };
  const ipad = {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    platform: "MacIntel",
    maxTouchPoints: 5,
  };
  const mac = { ...ipad, maxTouchPoints: 0 };
  const android = { userAgent: UA.chromeAndroid, platform: "Linux armv8l", maxTouchPoints: 5 };

  it("detects iPhone and iPad (which reports itself as a Mac)", () => {
    expect(isIosDevice(iphone)).toBe(true);
    expect(isIosDevice(ipad)).toBe(true);
    expect(isIosDevice(mac)).toBe(false);
    expect(isIosDevice(android)).toBe(false);
    expect(isIosDevice()).toBe(false);
  });

  it("asks iPhone users to add to Home Screen until opened from there", () => {
    expect(needsHomeScreenForPush(iphone)).toBe(true);
    expect(needsHomeScreenForPush({ ...iphone, standalone: false })).toBe(true);
    expect(needsHomeScreenForPush({ ...iphone, standalone: true })).toBe(false);
    expect(needsHomeScreenForPush(ipad)).toBe(true);
  });

  it("never shows the hint off Apple mobile devices", () => {
    expect(needsHomeScreenForPush(android)).toBe(false);
    expect(needsHomeScreenForPush(mac)).toBe(false);
  });
});
