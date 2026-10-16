import { describe, expect, it } from "vitest";
import { readServiceAccount } from "./serviceAccount.js";

const NL = String.fromCharCode(10);
const BOM = String.fromCharCode(0xfeff);
const KEY = `-----BEGIN PRIVATE KEY-----${NL}abc${NL}-----END PRIVATE KEY-----${NL}`;
const FILE = {
  type: "service_account",
  project_id: "demo",
  private_key: KEY,
  client_email: "bot@demo.iam.gserviceaccount.com",
};
const text = JSON.stringify(FILE, null, 2);

describe("readServiceAccount", () => {
  it("reads the key file pasted as-is (many lines or one)", () => {
    expect(readServiceAccount(text).account.private_key).toBe(KEY);
    expect(readServiceAccount(JSON.stringify(FILE)).account.client_email).toBe(FILE.client_email);
  });

  it("forgives quotes, BOM, JSON-as-string and base64", () => {
    expect(readServiceAccount(`'${text}'`).account).toBeTruthy();
    expect(readServiceAccount(`${BOM} ${text} `).account).toBeTruthy();
    expect(readServiceAccount(JSON.stringify(JSON.stringify(FILE))).account).toBeTruthy();
    expect(readServiceAccount(btoa(text)).account).toBeTruthy();
  });

  it("turns written-out \\n into real line breaks", () => {
    const flat = { ...FILE, private_key: KEY.split(NL).join("\\n") };
    expect(readServiceAccount(JSON.stringify(flat)).account.private_key).toBe(KEY);
  });

  it("names the problem without revealing anything", () => {
    expect(readServiceAccount("")).toEqual({ problem: "missing" });
    expect(readServiceAccount("", ["FIREBASE_SERVICE_ACCOUNT_KEY"])).toEqual({ problem: "misnamed" });
    expect(readServiceAccount("{ broken")).toEqual({ problem: "not_json" });
    expect(readServiceAccount(text.slice(0, 60))).toEqual({ problem: "not_json" });
    expect(readServiceAccount(JSON.stringify({ type: "service_account" }))).toEqual({
      problem: "incomplete",
    });
  });
});
