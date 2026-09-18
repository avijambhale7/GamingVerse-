/* =========================================================
   AGE GATING
   Decides which games an account is allowed to open.
========================================================= */
import { gameAgeRatings } from "../data/ageRatings.js";
import { blockedGameNames } from "../data/contentFilters.js";
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

export function getRequiredGameAge(gameName) {
  const rating = gameAgeRatings[gameName] || "16+";
  return Number.parseInt(rating, 10) || 16;
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

  const requiredAge = getRequiredGameAge(game.name);

  /*
    No DOB = allow only games below 16.
    This prevents an unverified account from opening 16+/18+ titles.
  */
  if (userAge === null || userAge === undefined) {
    return requiredAge < 16;
  }

  return userAge >= requiredAge;
}
