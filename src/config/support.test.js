import { describe, expect, it } from "vitest";
import {
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP,
  isPlaceholderEmail,
  isPlaceholderWhatsApp,
} from "./support.js";

describe("placeholder detection", () => {
  it("spots placeholder emails", () => {
    expect(isPlaceholderEmail("support@gamingverse.example")).toBe(true);
    expect(isPlaceholderEmail("[YOUR EMAIL]")).toBe(true);
    expect(isPlaceholderEmail("")).toBe(true);
    expect(isPlaceholderEmail("not-an-email")).toBe(true);
    expect(isPlaceholderEmail("help@gamingverse.in")).toBe(false);
  });

  it("spots placeholder WhatsApp numbers (empty = turned off, allowed)", () => {
    expect(isPlaceholderWhatsApp("919999999999")).toBe(true);
    expect(isPlaceholderWhatsApp("[YOUR WHATSAPP, e.g. 919876543210]")).toBe(true);
    expect(isPlaceholderWhatsApp("")).toBe(false);
    expect(isPlaceholderWhatsApp("919876543210")).toBe(false);
  });
});

// Fails if a dummy value is ever filled in.
describe("support contacts are real", () => {
  it("WhatsApp is either off or a real number", () => {
    expect(isPlaceholderWhatsApp(SUPPORT_WHATSAPP)).toBe(false);
  });

  it("the support email is real", () => {
    expect(isPlaceholderEmail(SUPPORT_EMAIL)).toBe(false);
  });
});
