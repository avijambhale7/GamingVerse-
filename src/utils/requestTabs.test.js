import { describe, expect, it } from "vitest";
import {
  requestMatchesTab,
  requestTabLabel,
  requestTabOf,
  requestTabsFor,
} from "./requestTabs.js";

const req = (status) => ({ id: status, status });

describe("requestTabsFor", () => {
  it("gives admins an Approved tab", () => {
    expect(requestTabsFor("admin").map((t) => t.id)).toEqual([
      "open",
      "approved",
      "accepted",
      "closed",
      "all",
    ]);
  });

  it("keeps the usual tabs for buyers and sellers", () => {
    for (const role of ["buyer", "seller"]) {
      expect(requestTabsFor(role).map((t) => t.id)).toEqual([
        "open",
        "accepted",
        "closed",
        "all",
      ]);
    }
  });
});

describe("requestTabOf", () => {
  it("puts an admin-approved request (waiting for seller) in Approved for admins", () => {
    expect(requestTabOf(req("pending_seller"), "admin")).toBe("approved");
  });

  it("keeps it pending for the buyer and the seller", () => {
    expect(requestTabOf(req("pending_seller"), "buyer")).toBe("open");
    expect(requestTabOf(req("pending_seller"), "seller")).toBe("open");
  });

  it("places the other statuses", () => {
    expect(requestTabOf(req("pending_admin"), "admin")).toBe("open");
    expect(requestTabOf(req("pending_admin"), "buyer")).toBe("open");
    expect(requestTabOf(req("accepted"), "seller")).toBe("accepted");
    for (const status of ["admin_rejected", "seller_rejected", "cancelled"]) {
      expect(requestTabOf(req(status), "admin")).toBe("closed");
    }
  });
});

describe("requestMatchesTab", () => {
  it("shows every request under All", () => {
    expect(requestMatchesTab(req("cancelled"), "all", "buyer")).toBe(true);
  });

  it("no request is only reachable through All", () => {
    const statuses = [
      "pending_admin",
      "pending_seller",
      "accepted",
      "admin_rejected",
      "seller_rejected",
      "cancelled",
    ];
    for (const role of ["admin", "buyer", "seller"]) {
      const tabs = requestTabsFor(role).map((t) => t.id).filter((t) => t !== "all");
      for (const status of statuses) {
        expect(tabs.some((tab) => requestMatchesTab(req(status), tab, role))).toBe(true);
      }
    }
  });
});

describe("requestTabLabel", () => {
  it("names tabs for the 'Moved to …' notice", () => {
    expect(requestTabLabel("accepted")).toBe("Accepted");
    expect(requestTabLabel("approved")).toBe("Approved");
    expect(requestTabLabel("nope")).toBe("");
  });
});
