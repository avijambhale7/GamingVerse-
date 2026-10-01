/* =========================================================
   SEARCH: MORE RESULTS
   Extra sections under the game results in the navbar search:
   cafés, shop items and gaming clubs. Each list is fetched
   once (the first time someone searches) and kept in memory,
   so typing stays instant. Rendered by ./GamesNavbar.jsx.
========================================================= */

import { useEffect, useMemo, useState } from "react";
import { equalTo, get, orderByChild, query, ref } from "firebase/database";
import { db } from "../../../firebase";
import { normalizeCafe } from "../../cafe/utils/cafeModel.js";

let cache = null;
let loading = null;

function loadIndex() {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    const read = (target) =>
      get(typeof target === "string" ? ref(db, target) : target)
        .then((snap) => snap.val() || {})
        .catch(() => ({}));
    // Only approved cafés are readable (database rules).
    const approvedCafes = query(
      ref(db, "cafes"),
      orderByChild("status"),
      equalTo("approved"),
    );
    loading = Promise.all([read(approvedCafes), read("products"), read("clubs")]).then(
      ([cafes, products, clubs]) => {
        cache = {
          // Customers only ever see admin-approved cafés.
          cafes: Object.entries(cafes)
            .map(([id, raw]) => normalizeCafe(id, raw))
            .filter((cafe) => cafe.status === "approved"),
          products: Object.entries(products)
            .filter(([, p]) => p && typeof p === "object" && p.status !== "blocked")
            .map(([id, p]) => ({ id, ...p })),
          clubs: Object.entries(clubs)
            .filter(([, c]) => c && typeof c === "object")
            .map(([id, c]) => ({ id, ...c })),
        };
        return cache;
      },
    );
  }
  return loading;
}

const matches = (query, ...fields) =>
  fields.some((field) => String(field || "").toLowerCase().includes(query));

export default function SearchMoreResults({ query, onPick }) {
  const [index, setIndex] = useState(cache);

  useEffect(() => {
    if (cache) return undefined;
    let active = true;
    loadIndex().then((data) => {
      if (active) setIndex(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!index || !q) return { cafes: [], products: [], clubs: [] };
    return {
      cafes: index.cafes.filter((c) => matches(q, c.name, c.address)).slice(0, 4),
      products: index.products
        .filter((p) => matches(q, p.name, p.category, p.platform))
        .slice(0, 4),
      clubs: index.clubs
        .filter((c) => matches(q, c.name, c.interest, c.description))
        .slice(0, 4),
    };
  }, [index, q]);

  const sections = [
    {
      key: "cafes",
      label: "CAFÉS",
      icon: "☕",
      items: results.cafes.map((cafe) => ({
        id: cafe.id,
        title: cafe.name,
        sub: cafe.address || `₹${cafe.pricePerHour}/hour`,
        image: cafe.photos[0] || "",
      })),
    },
    {
      key: "products",
      label: "SHOP",
      icon: "🛒",
      items: results.products.map((p) => ({
        id: p.id,
        title: p.name || "Item",
        sub: [p.price ? `₹${p.price}` : "", p.category || p.platform || ""]
          .filter(Boolean)
          .join(" • "),
        image: p.image || "",
        type: p.productType === "accessory" ? "accessories" : "games",
      })),
    },
    {
      key: "clubs",
      label: "CLUBS",
      icon: "♣",
      items: results.clubs.map((club) => ({
        id: club.id,
        title: club.name || "Club",
        sub: `${Number(club.memberCount) || 0} members${club.interest ? ` • ${club.interest}` : ""}`,
        image: "",
      })),
    },
  ].filter((section) => section.items.length);

  if (!sections.length) return null;

  return (
    <div className="search-more">
      {sections.map((section) => (
        <div key={section.key} className="search-more-section">
          <div className="search-results-header">
            <span>{section.label}</span>
            <strong>{section.items.length}</strong>
          </div>
          <div className="search-results-list">
            {section.items.map((item) => (
              <button
                key={`${section.key}-${item.id}`}
                type="button"
                className="search-result-item"
                onClick={() => onPick(section.key, item)}
              >
                {item.image ? (
                  <img src={item.image} alt="" />
                ) : (
                  <span className="search-more-icon" aria-hidden="true">
                    {section.icon}
                  </span>
                )}
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.sub}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
