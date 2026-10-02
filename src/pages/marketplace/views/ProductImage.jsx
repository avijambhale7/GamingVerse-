/* =========================================================
   PRODUCT IMAGE
   Shows a listing's photo, and never a broken-image icon:
   1. the seller's photo (product.image),
   2. if that is missing or fails to load and the listing is a
      game, the game's own poster from the app's artwork,
   3. otherwise a 🎮 placeholder.
========================================================= */
import { useState } from "react";
import { getGameImage } from "../../profile/utils/gameImages.js";

export default function ProductImage({ product, isGame = false, alt }) {
  const sources = [
    product?.image,
    isGame ? getGameImage(product?.name || "") : "",
  ].filter((src, index, list) => src && list.indexOf(src) === index);
  const [failed, setFailed] = useState(0);
  const src = sources[failed];

  if (!src) return <span aria-hidden="true">🎮</span>;
  return (
    <img
      key={src}
      src={src}
      alt={alt ?? product?.name ?? ""}
      loading="lazy"
      onError={() => setFailed((count) => count + 1)}
    />
  );
}
