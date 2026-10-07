/* =========================================================
   STOCK MATHS (pure — unit tested in stock.test.js)
   Used when a seller accepts a purchase request (stock goes
   down) and when an accepted deal is cancelled (it goes back).
========================================================= */

const units = (value) => Math.max(0, Math.floor(Number(value) || 0));

// How many units a request is for (at least 1).
export const requestQuantity = (request) => Math.max(1, units(request?.quantity));

// Whether `stock` covers `quantity`.
export const canFulfil = (stock, quantity) => units(stock) >= Math.max(1, units(quantity));

// Stock left after selling `quantity` — never below 0.
export const stockAfterSale = (stock, quantity) =>
  Math.max(0, units(stock) - Math.max(1, units(quantity)));

// Stock after an accepted deal is cancelled and its units come back.
export const stockAfterCancel = (stock, quantity) =>
  units(stock) + Math.max(1, units(quantity));

export const isSoldOut = (product) => units(product?.stock) <= 0;
