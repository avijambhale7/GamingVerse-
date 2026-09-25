/* =========================================================
   MARKETPLACE PURCHASE REQUESTS
   Buyer requests an item → admin approves → seller accepts →
   buyer and seller can see each other's mobile number.

   purchaseRequests/{id}          the request itself (status etc.)
   purchaseRequestContacts/{id}   { buyerPhone, sellerPhone } — the
                                  rules only let buyer/seller read it
                                  once the request is "accepted".
   notifications/{uid}            per-user notification feed
   adminNotifications             shared feed for all admins
========================================================= */

import {
  get,
  push,
  ref,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { auth, db } from "../firebase";

export const REQUEST_STATUS = {
  PENDING_ADMIN: "pending_admin",
  ADMIN_REJECTED: "admin_rejected",
  PENDING_SELLER: "pending_seller",
  SELLER_REJECTED: "seller_rejected",
  ACCEPTED: "accepted",
  CANCELLED: "cancelled",
};

export const REQUEST_STATUS_LABEL = {
  pending_admin: "Waiting for admin",
  admin_rejected: "Rejected by admin",
  pending_seller: "Waiting for seller",
  seller_rejected: "Rejected by seller",
  accepted: "Accepted",
  cancelled: "Cancelled",
};

// Buyer-facing progress steps (rejections/cancel end the flow early).
export const REQUEST_STEPS = ["Requested", "Admin approved", "Seller accepted"];

export function requestStepIndex(status) {
  if (status === REQUEST_STATUS.ACCEPTED) return 2;
  if (status === REQUEST_STATUS.PENDING_SELLER) return 1;
  if (status === REQUEST_STATUS.SELLER_REJECTED) return 1;
  return 0;
}

export function isOpenRequest(status) {
  return (
    status === REQUEST_STATUS.PENDING_ADMIN ||
    status === REQUEST_STATUS.PENDING_SELLER
  );
}

/* ---------- phone numbers ---------- */

// Indian mobile: 10 digits starting 6-9. Accepts "+91 98765 43210" etc.
export function normalizePhone(value = "") {
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function isValidPhone(value = "") {
  return /^[6-9]\d{9}$/.test(normalizePhone(value));
}

export function formatPhone(value = "") {
  const digits = normalizePhone(value);
  return digits.length === 10
    ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    : value;
}

export async function getMyPhone() {
  const uid = auth.currentUser?.uid;
  if (!uid) return "";
  const snap = await get(ref(db, `users/${uid}/phone`));
  return snap.val() || "";
}

/* ---------- notifications ---------- */

const MARKET_TITLE = "GamingVerse Market";

export function notifyUser(uid, message) {
  const fromUid = auth.currentUser?.uid;
  if (!uid || !fromUid) return Promise.resolve();
  return push(ref(db, `notifications/${uid}`), {
    title: MARKET_TITLE,
    message,
    type: "update",
    fromUid,
    read: false,
    createdAt: serverTimestamp(),
  }).catch((error) => console.error("Notify user failed:", error));
}

export function notifyAdmins(message) {
  const fromUid = auth.currentUser?.uid;
  if (!fromUid) return Promise.resolve();
  return push(ref(db, "adminNotifications"), {
    title: MARKET_TITLE,
    message,
    type: "update",
    fromUid,
    read: false,
    createdAt: serverTimestamp(),
  }).catch((error) => console.error("Notify admins failed:", error));
}

/* ---------- workflow actions ---------- */

// Buyer → creates a request that goes to the admin first.
export async function createPurchaseRequest({ product, quantity, note }) {
  const buyer = auth.currentUser;
  if (!buyer) throw new Error("Please login first.");
  if (product.sellerId === buyer.uid)
    throw new Error("You cannot request your own product.");

  const qty = Math.max(1, Number(quantity) || 1);
  if (qty > Number(product.stock || 0))
    throw new Error(`Only ${product.stock || 0} item(s) available.`);

  const buyerPhone = await getMyPhone();
  if (!isValidPhone(buyerPhone))
    throw new Error("Add your mobile number to your account first.");

  const buyerName =
    buyer.displayName || buyer.email?.split("@")[0] || "GamingVerse User";

  const requestRef = push(ref(db, "purchaseRequests"));
  const now = Date.now();
  const request = {
    productId: product.id,
    productName: product.name || "Product",
    productImage: product.image || "",
    productType: product.productType || "game",
    price: Number(product.price) || 0,
    quantity: qty,
    total: (Number(product.price) || 0) * qty,
    note: String(note || "").trim().slice(0, 300),
    buyerId: buyer.uid,
    buyerName,
    sellerId: product.sellerId,
    sellerName: product.sellerName || "GamingVerse Seller",
    status: REQUEST_STATUS.PENDING_ADMIN,
    createdAt: now,
    updatedAt: now,
  };

  await set(requestRef, request);
  await set(
    ref(db, `purchaseRequestContacts/${requestRef.key}/buyerPhone`),
    normalizePhone(buyerPhone),
  );

  await Promise.all([
    notifyAdmins(
      `New purchase request: ${buyerName} wants ${qty} × ${request.productName}.`,
    ),
    notifyUser(
      buyer.uid,
      `Your request for ${request.productName} was sent. Waiting for admin approval.`,
    ),
  ]);

  return { id: requestRef.key, ...request };
}

// Admin → approve (forward to seller) or reject.
export async function adminDecide(request, approve) {
  const status = approve
    ? REQUEST_STATUS.PENDING_SELLER
    : REQUEST_STATUS.ADMIN_REJECTED;

  await update(ref(db, `purchaseRequests/${request.id}`), {
    status,
    adminActionAt: Date.now(),
    updatedAt: Date.now(),
  });

  if (approve) {
    await Promise.all([
      notifyUser(
        request.buyerId,
        `Admin approved your request for ${request.productName}. It has been sent to the seller.`,
      ),
      notifyUser(
        request.sellerId,
        `New purchase request: ${request.buyerName} wants ${request.quantity} × ${request.productName}.`,
      ),
    ]);
  } else {
    await notifyUser(
      request.buyerId,
      `Your request for ${request.productName} was rejected by the admin.`,
    );
  }
}

// Seller → accept (share contacts, reduce stock) or reject.
export async function sellerDecide(request, accept) {
  if (!accept) {
    await update(ref(db, `purchaseRequests/${request.id}`), {
      status: REQUEST_STATUS.SELLER_REJECTED,
      sellerActionAt: Date.now(),
      updatedAt: Date.now(),
    });
    await notifyUser(
      request.buyerId,
      `The seller declined your request for ${request.productName}.`,
    );
    return;
  }

  const sellerPhone = await getMyPhone();
  if (!isValidPhone(sellerPhone))
    throw new Error("Add your mobile number to your account first.");

  const productRef = ref(db, `products/${request.productId}`);
  const productSnap = await get(productRef);
  const stock = Number(productSnap.val()?.stock || 0);
  if (!productSnap.exists() || stock < Number(request.quantity))
    throw new Error(`Not enough stock — only ${stock} left.`);

  // Phone first: the contact node is only readable once "accepted".
  await set(
    ref(db, `purchaseRequestContacts/${request.id}/sellerPhone`),
    normalizePhone(sellerPhone),
  );
  await update(ref(db, `purchaseRequests/${request.id}`), {
    status: REQUEST_STATUS.ACCEPTED,
    sellerActionAt: Date.now(),
    updatedAt: Date.now(),
  });
  await update(productRef, {
    stock: Math.max(stock - Number(request.quantity), 0),
    updatedAt: Date.now(),
  });

  const contactSnap = await get(
    ref(db, `purchaseRequestContacts/${request.id}`),
  );
  const buyerPhone = contactSnap.val()?.buyerPhone || "";

  await Promise.all([
    notifyUser(
      request.buyerId,
      `🎉 ${request.sellerName} accepted your request for ${request.productName}. Call the seller: ${formatPhone(sellerPhone)}`,
    ),
    notifyUser(
      request.sellerId,
      `You accepted ${request.buyerName}'s request for ${request.productName}. Buyer's mobile: ${formatPhone(buyerPhone)}`,
    ),
  ]);
}

// Buyer → cancel while it is still waiting on admin or seller.
export async function cancelPurchaseRequest(request) {
  const wasWithSeller = request.status === REQUEST_STATUS.PENDING_SELLER;
  await update(ref(db, `purchaseRequests/${request.id}`), {
    status: REQUEST_STATUS.CANCELLED,
    updatedAt: Date.now(),
  });
  if (wasWithSeller) {
    await notifyUser(
      request.sellerId,
      `${request.buyerName} cancelled their request for ${request.productName}.`,
    );
  }
}

export async function getRequestContacts(requestId) {
  const snap = await get(ref(db, `purchaseRequestContacts/${requestId}`));
  return snap.val() || {};
}
