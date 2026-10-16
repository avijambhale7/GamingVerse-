/* =========================================================
   AGE GATING
   Decides which games an account is allowed to open.
========================================================= */
import { blockedGameNames } from "../data/contentFilters.js";
import { requiredGameAge } from "./ageRating.js";
import { getGameDetails } from "./gameInfo.js";

export function calculateAgeFromDob(dob) {
  if (!dob) return null;

  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 && age <= 120 ? age : null;
}

// Minimum age for a game — pass the game object when you have it (its
// RAWG ESRB rating counts), or just the name. Every spelling of a rated
// title matches ("GTA 6" = "Grand Theft Auto VI"); see ageRating.js.
export function getRequiredGameAge(gameOrName) {
  return requiredGameAge(gameOrName);
}

export function isBlockedGame(game) {
  const details = getGameDetails(game?.name || "");
  const text = [
    game?.name,
    details?.title,
    details?.description,
    details?.genre,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return blockedGameNames.some((blocked) => text.includes(blocked));
}

export function canAccessGame(game, userAge) {
  if (!game || isBlockedGame(game)) return false;

  const requiredAge = getRequiredGameAge(game);

  /*
    No DOB = allow only games below 16.
    This prevents an unverified account from opening 16+/18+ titles.
  */
  if (userAge === null || userAge === undefined) {
    return requiredAge < 16;
  }

  return userAge >= requiredAge;
}
