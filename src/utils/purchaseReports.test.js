import { describe, expect, it } from "vitest";
import {
  REPORT_MESSAGE_MAX,
  REPORT_REASONS,
  cleanReportMessage,
  reportReasonsFor,
  countOpenReports,
  openReportCount,
  reportReasonLabel,
  reportsList,
} from "./purchaseReports.js";

describe("report reasons", () => {
  it("offers the four reasons", () => {
    expect(REPORT_REASONS.map((r) => r.label)).toEqual([
      "Didn't deliver",
      "Didn't pay",
      "Item not as described",
      "Other",
    ]);
    expect(reportReasonLabel("not_paid")).toBe("Didn't pay");
    expect(reportReasonLabel("weird")).toBe("Other");
  });
});

describe("reportReasonsFor", () => {
  const labels = (role) => reportReasonsFor(role).map((r) => r.label);

  it("gives buyers the buyer-side problems", () => {
    expect(labels("buyer")).toEqual([
      "Didn't deliver",
      "Item not as described",
      "Other",
    ]);
  });

  it("gives sellers the seller-side problems", () => {
    expect(labels("seller")).toEqual(["Didn't pay", "Other"]);
  });

  it("gives nothing to anyone else", () => {
    expect(reportReasonsFor("admin")).toEqual([]);
    expect(reportReasonsFor(undefined)).toEqual([]);
  });
});

describe("open report counts", () => {
  const all = {
    req1: {
      buyer: { reason: "not_delivered", createdAt: 2 },
      seller: { reason: "not_paid", createdAt: 1, resolvedAt: 5 },
    },
    req2: { buyer2: { reason: "other", createdAt: 3 } },
    req3: {},
  };

  it("counts unresolved reports per request and overall", () => {
    expect(openReportCount(all.req1)).toBe(1);
    expect(openReportCount(all.req3)).toBe(0);
    expect(countOpenReports(all)).toBe(2);
    expect(countOpenReports(undefined)).toBe(0);
  });

  it("lists a request's reports newest first with who filed them", () => {
    expect(reportsList(all.req1).map((r) => r.uid)).toEqual(["buyer", "seller"]);
  });
});

describe("cleanReportMessage", () => {
  it("trims and caps the message at 500 characters", () => {
    expect(cleanReportMessage("  hi  ")).toBe("hi");
    expect(cleanReportMessage("x".repeat(600))).toHaveLength(REPORT_MESSAGE_MAX);
    expect(cleanReportMessage(undefined)).toBe("");
  });
});
