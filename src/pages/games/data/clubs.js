/* =========================================================
   GAMING CLUBS
   Club membership, new clubs and discussions are all
   user-created and saved in localStorage for this build —
   there is no seed/demo club data.
========================================================= */

// Each interest gets a distinct icon + colour so the club grid reads at a
// glance instead of every card blurring into the same purple tint.
export const CLUB_INTERESTS = [
  { id: "Action", icon: "🎯", color: "#ff6a3d" },
  { id: "Adventure", icon: "🗺️", color: "#ffcb3d" },
  { id: "RPG", icon: "🐉", color: "#4ade80" },
  { id: "FPS", icon: "🔫", color: "#ff4d6d" },
  { id: "PlayStation", icon: "🎮", color: "#4da3ff" },
  { id: "Xbox", icon: "🕹️", color: "#22d3c5" },
  { id: "PC", icon: "🖥️", color: "#a855f7" },
];

const FALLBACK_INTEREST = { icon: "♣", color: "#a855f7" };

export function getClubInterestMeta(interest) {
  return (
    CLUB_INTERESTS.find((item) => item.id === interest) || FALLBACK_INTEREST
  );
}
