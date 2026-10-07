import { describe, expect, it } from "vitest";
import {
  INVALID_LOGIN_MESSAGE,
  USERNAME_LOGIN_UNAVAILABLE_MESSAGE,
  authErrorMessage,
  homePathFor,
  isBusinessProfile,
  isEmailIdentifier,
  returnPathFrom,
} from "./authFlow.js";

describe("homePathFor", () => {
  it("sends admins to the admin panel", () => {
    expect(homePathFor({ role: "admin" })).toBe("/admin");
    expect(homePathFor({ role: "ADMIN" })).toBe("/admin");
  });

  it("sends business roles to the owner dashboard", () => {
    for (const role of ["owner", "cafe_owner", "shop_owner", "accessory_owner"]) {
      expect(homePathFor({ role })).toBe("/owner-dashboard");
    }
  });

  it("sends accounts awaiting business approval to the owner dashboard", () => {
    expect(homePathFor({ requestedRole: "cafe_owner" })).toBe("/owner-dashboard");
  });

  it("sends everyone else to games", () => {
    expect(homePathFor({})).toBe("/games");
    expect(homePathFor(null)).toBe("/games");
    expect(homePathFor(undefined)).toBe("/games");
    expect(homePathFor({ role: "user" })).toBe("/games");
  });

  it("lets an approved non-business role win over a stale request", () => {
    expect(homePathFor({ role: "user", requestedRole: "cafe_owner" })).toBe("/games");
  });
});

describe("isBusinessProfile", () => {
  it("detects approved and pending business accounts", () => {
    expect(isBusinessProfile({ role: "cafe_owner" })).toBe(true);
    expect(isBusinessProfile({ requestedRole: "shop_owner" })).toBe(true);
    expect(isBusinessProfile({ role: "admin" })).toBe(false);
    expect(isBusinessProfile({})).toBe(false);
  });
});

describe("returnPathFrom", () => {
  it("keeps path, query and hash of an in-app page", () => {
    expect(
      returnPathFrom({ pathname: "/games", search: "?view=cafe", hash: "#x" }),
    ).toBe("/games?view=cafe#x");
    expect(returnPathFrom({ pathname: "/user/abc" })).toBe("/user/abc");
  });

  it("ignores missing, root, login and off-site targets", () => {
    expect(returnPathFrom(undefined)).toBe("");
    expect(returnPathFrom("/games")).toBe("");
    expect(returnPathFrom({ pathname: "/" })).toBe("");
    expect(returnPathFrom({ pathname: "/login" })).toBe("");
    expect(returnPathFrom({ pathname: "//evil.example" })).toBe("");
    expect(returnPathFrom({ pathname: "https://evil.example" })).toBe("");
  });
});

describe("isEmailIdentifier", () => {
  it("treats anything with @ as an email", () => {
    expect(isEmailIdentifier("ram@example.com")).toBe(true);
    expect(isEmailIdentifier("@ram")).toBe(true);
  });

  it("treats everything else as a username", () => {
    expect(isEmailIdentifier("ram_gamer")).toBe(false);
    expect(isEmailIdentifier("")).toBe(false);
    expect(isEmailIdentifier()).toBe(false);
  });
});

describe("authErrorMessage", () => {
  it("uses one message for every bad-login case", () => {
    for (const code of [
      "auth/invalid-credential",
      "auth/user-not-found",
      "auth/wrong-password",
      "auth/invalid-email",
      "auth/invalid-custom-token",
    ]) {
      expect(authErrorMessage(code, "login")).toBe(INVALID_LOGIN_MESSAGE);
    }
  });

  it("says when username login is unavailable instead of blaming the password", () => {
    expect(authErrorMessage("app/username-login-unavailable", "login")).toBe(
      "Username login isn't available right now. Please log in with your email instead.",
    );
    expect(USERNAME_LOGIN_UNAVAILABLE_MESSAGE).not.toBe(INVALID_LOGIN_MESSAGE);
    // 401 and 429 keep their own messages.
    expect(authErrorMessage("auth/invalid-credential", "login")).toBe(
      INVALID_LOGIN_MESSAGE,
    );
    expect(authErrorMessage("auth/too-many-requests", "login")).toMatch(
      /Too many attempts/,
    );
  });

  it("maps the common codes to plain messages", () => {
    expect(authErrorMessage("auth/too-many-requests")).toMatch(/Too many attempts/);
    expect(authErrorMessage("auth/network-request-failed")).toMatch(/Network error/);
    expect(authErrorMessage("auth/user-disabled")).toMatch(/disabled/);
    expect(authErrorMessage("auth/popup-blocked", "google")).toMatch(/pop-ups/);
    expect(authErrorMessage("auth/operation-not-allowed", "signup")).toMatch(
      /isn't available/,
    );
  });

  it("maps sign-up specific codes", () => {
    expect(authErrorMessage("auth/email-already-in-use", "signup")).toMatch(
      /already registered/,
    );
    expect(authErrorMessage("auth/weak-password", "signup")).toMatch(/too weak/);
  });

  it("stays silent when the user closed the Google pop-up", () => {
    expect(authErrorMessage("auth/popup-closed-by-user", "google")).toBe("");
    expect(authErrorMessage("auth/cancelled-popup-request", "google")).toBe("");
  });

  it("falls back to a generic message, never raw Firebase text", () => {
    expect(authErrorMessage("auth/something-new", "reset")).toBe(
      "Couldn't send the reset email. Please try again.",
    );
    expect(authErrorMessage(undefined, "signup")).toBe(
      "Couldn't create your account. Please try again.",
    );
    expect(authErrorMessage("auth/x", "unknown-action")).toBe(
      "Login failed. Please try again.",
    );
  });
});
