/* =========================================================
   SOCIAL LINK HELPERS
========================================================= */

export function normalizeSocialList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) => {
      if (item && typeof item === "object") {
        return { ...item, uid: item.uid || item.userId || item.id || key };
      }
      return { uid: key };
    });
  }

  return [];
}
