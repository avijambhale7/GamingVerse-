/* =========================================================
   VALIDATE DATABASE RULES (run inside the Firebase emulator)
   Used by .github/workflows/deploy-rules.yml before deploying:

     npx firebase-tools emulators:exec --only database \
       --project demo-gamingverse "node scripts/validate-rules.mjs"

   Uploads database.rules.json to the running Realtime Database
   emulator, which compiles it exactly like production does; a
   syntax or type error makes this exit with code 1.
========================================================= */

import { readFileSync } from "node:fs";

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
const namespace = "demo-gamingverse-default-rtdb";
const rules = readFileSync(new URL("../database.rules.json", import.meta.url), "utf8");

try {
  JSON.parse(rules);
} catch (error) {
  console.error("database.rules.json is not valid JSON:", error.message);
  process.exit(1);
}

const response = await fetch(`http://${host}/.settings/rules.json?ns=${namespace}`, {
  method: "PUT",
  // The emulator accepts "owner" as an admin credential.
  headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
  body: rules,
});
const body = await response.text();

if (!response.ok) {
  console.error(`Rules rejected by the emulator (${response.status}):\n${body}`);
  process.exit(1);
}
console.log("database.rules.json compiled cleanly in the emulator.");
