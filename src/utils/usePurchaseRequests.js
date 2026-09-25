/* =========================================================
   usePurchaseRequests
   Live list of marketplace purchase requests for one role:
     "buyer"  → requests I made
     "seller" → requests for my products (only once admin approved)
     "admin"  → every request
========================================================= */

import { useEffect, useState } from "react";
import {
  equalTo,
  onValue,
  orderByChild,
  query,
  ref,
} from "firebase/database";
import { db } from "../firebase";
import { REQUEST_STATUS } from "./purchaseRequests.js";

const HIDDEN_FROM_SELLER = new Set([
  REQUEST_STATUS.PENDING_ADMIN,
  REQUEST_STATUS.ADMIN_REJECTED,
]);

export default function usePurchaseRequests(role, uid) {
  const [state, setState] = useState({ key: "", requests: [], error: "" });
  const key = `${role}:${uid || ""}`;

  useEffect(() => {
    if (!uid) return undefined;

    const base = ref(db, "purchaseRequests");
    const source =
      role === "admin"
        ? base
        : query(
            base,
            orderByChild(role === "seller" ? "sellerId" : "buyerId"),
            equalTo(uid),
          );

    return onValue(
      source,
      (snapshot) => {
        const data = snapshot.val() || {};
        const next = Object.entries(data)
          .map(([id, request]) => ({ id, ...request }))
          .filter(
            (request) =>
              role !== "seller" || !HIDDEN_FROM_SELLER.has(request.status),
          )
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        setState({ key, requests: next, error: "" });
      },
      (error) => {
        console.error(`Purchase requests (${role}) listener error:`, error);
        setState({ key, requests: [], error: "Could not load requests." });
      },
    );
  }, [role, uid, key]);

  // Ignore results left over from a previous role/uid.
  return state.key === key
    ? { requests: state.requests, error: state.error }
    : { requests: [], error: "" };
}
