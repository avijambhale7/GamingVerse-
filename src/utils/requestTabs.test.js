import { describe, expect, it } from "vitest";
import {
  initialRequestTab,
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

describe("Reported tab (admins)", () => {
  it("only appears when reports are available", () => {
    expect(requestTabsFor("admin").map((t) => t.id)).not.toContain("reported");
    expect(requestTabsFor("admin", { reports: true }).map((t) => t.id)).toContain(
      "reported",
    );
    expect(requestTabsFor("buyer", { reports: true }).map((t) => t.id)).not.toContain(
      "reported",
    );
  });

  it("holds requests with open reports, whatever their status", () => {
    expect(requestMatchesTab({ status: "accepted", openReports: 1 }, "reported", "admin")).toBe(
      true,
    );
    expect(requestMatchesTab({ status: "accepted", openReports: 0 }, "reported", "admin")).toBe(
      false,
    );
    expect(requestMatchesTab({ status: "accepted" }, "reported", "admin")).toBe(false);
  });
});

describe("requestTabLabel", () => {
  it("names tabs for the 'Moved to …' notice", () => {
    expect(requestTabLabel("accepted")).toBe("Accepted");
    expect(requestTabLabel("approved")).toBe("Approved");
    expect(requestTabLabel("nope")).toBe("");
  });
});

describe("initialRequestTab", () => {
  const r = (id, status, updatedAt) => ({ id, status, updatedAt });

  it("opens the tab holding the most recently updated request", () => {
    const list = [
      r("a", "pending_admin", 100),
      r("b", "accepted", 300),
      r("c", "cancelled", 200),
    ];
    expect(initialRequestTab(list, "buyer")).toBe("accepted");
    expect(initialRequestTab(list, "admin")).toBe("accepted");
  });

  it("opens Approved for an admin when that request was the last to change", () => {
    const list = [r("a", "pending_admin", 100), r("b", "pending_seller", 500)];
    expect(initialRequestTab(list, "admin")).toBe("approved");
    expect(initialRequestTab(list, "seller")).toBe("open");
  });

  it("falls back to createdAt when updatedAt is missing", () => {
    const list = [
      { id: "a", status: "accepted", createdAt: 50 },
      { id: "b", status: "cancelled", createdAt: 90 },
    ];
    expect(initialRequestTab(list, "buyer")).toBe("closed");
  });

  it("opens All when no request has a time", () => {
    expect(initialRequestTab([{ id: "a", status: "accepted" }], "buyer")).toBe("all");
  });

  it("never picks an empty tab when there are requests", () => {
    const statuses = [
      "pending_admin",
      "pending_seller",
      "accepted",
      "admin_rejected",
      "seller_rejected",
      "cancelled",
    ];
    for (const role of ["admin", "buyer", "seller"]) {
      statuses.forEach((status, i) => {
        const list = [r("x", status, 10 + i), r("y", "accepted", 1)];
        const tab = initialRequestTab(list, role);
        expect(list.some((item) => requestMatchesTab(item, tab, role))).toBe(true);
      });
    }
  });

  it("starts on Pending when there are no requests yet", () => {
    expect(initialRequestTab([], "buyer")).toBe("open");
    expect(initialRequestTab(undefined, "admin")).toBe("open");
  });
});
