/* =========================================================
   SERVICE-ACCOUNT KEY (server side: api/*.js)
   Reads FIREBASE_SERVICE_ACCOUNT the forgiving way, because it's
   pasted by hand into Vercel:
   - the whole key file, on one line or many
   - wrapped in quotes, or JSON saved as a JSON string
   - base64 of the key file
   - private_key with "\n" written out instead of real line breaks

   Returns { account } or { problem }, where problem is one word
   (safe to show — never any part of the key):
   "missing" | "misnamed" | "not_json" | "incomplete"
========================================================= */

const ENV_NAME = "FIREBASE_SERVICE_ACCOUNT";

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function readServiceAccount(rawValue, envNames = []) {
  let text = String(rawValue || "").replace(/^\uFEFF/, "").trim();

  if (!text) {
    // Saved as " FIREBASE_SERVICE_ACCOUNT", "FIREBASE_SERVICE_ACCOUNT_KEY"…
    const misnamed = envNames.some(
      (name) => name !== ENV_NAME && /SERVICE_?ACCOUNT/i.test(name),
    );
    return { problem: misnamed ? "misnamed" : "missing" };
  }

  // 'key file' or `key file` around the whole value.
  if (/^(['`]).*\1$/s.test(text)) text = text.slice(1, -1).trim();

  let value = parseJson(text);
  // JSON saved as a string: "{\"type\": ...}"
  if (typeof value === "string") value = parseJson(value.trim());
  // base64 of the key file
  if (value === undefined && /^[A-Za-z0-9+/=\s]+$/.test(text)) {
    try {
      value = parseJson(atob(text.replace(/\s/g, "")));
    } catch {
      value = undefined;
    }
  }
  if (!value || typeof value !== "object") return { problem: "not_json" };

  const privateKey = String(value.private_key || "");
  if (!privateKey.includes("PRIVATE KEY") || !value.client_email) {
    return { problem: "incomplete" };
  }

  return {
    account: {
      ...value,
      // "\n" typed out as two characters → real line breaks.
      private_key: privateKey.includes("\n") ? privateKey : privateKey.replace(/\\n/g, "\n"),
    },
  };
}
