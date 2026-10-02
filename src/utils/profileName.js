/* =========================================================
   PROFILE NAME
   The name shown for a seller: their business name, else their
   username, read from users/{uid}. The database rules only accept
   a product's sellerName when it matches one of these, so nobody
   can list items as "Sony Official Store".
========================================================= */
import { get, ref } from "firebase/database";
import { db } from "../firebase";

export async function getSellerName(uid) {
  const profile = (await get(ref(db, `users/${uid}`))).val() || {};
  return String(profile.businessName || profile.username || "").trim();
}
