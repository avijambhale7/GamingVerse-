/* =========================================================
   SYSTEM STATUS HELPERS (pure — unit tested in systemStatus.test.js)
   Shared by api/health.js (server) and the admin System status
   card / "Needs your attention" box (browser).
========================================================= */

/* ---------- database rules: live vs. this build ---------- */

// Database rules may contain // and /* */ comments; drop them (outside
// strings) so the text parses as JSON.
export function stripJsonComments(text = "") {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inString) {
      out += char;
      if (char === "\\") {
        out += next ?? "";
        i += 1;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
      out += char;
    } else if (char === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i += 1;
      out += "\n";
    } else if (char === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i += 1;
      i += 1;
    } else {
      out += char;
    }
  }
  return out;
}

// The same rules always give the same string, whatever the key order,
// spacing or comments — so live and built rules can be compared.
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function rulesFingerprint(rulesText) {
  const parsed =
    typeof rulesText === "string"
      ? JSON.parse(stripJsonComments(rulesText))
      : rulesText;
  return canonicalJson(parsed);
}

/* ---------- waiting times ("oldest: 2 days") ---------- */

export function waitingLabel(sinceMs, nowMs = Date.now()) {
  const since = Number(sinceMs);
  if (!since || since > nowMs) return "";
  const minutes = Math.floor((nowMs - since) / 60000);
  if (minutes < 60) return minutes <= 1 ? "just now" : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

// The earliest timestamp in a list (0 when there is none).
export function oldestTime(list = [], pick = (item) => item?.createdAt) {
  return (Array.isArray(list) ? list : []).reduce((oldest, item) => {
    const time = Number(pick(item)) || 0;
    return time && (!oldest || time < oldest) ? time : oldest;
  }, 0);
}

/* ---------- photo storage size ---------- */

// Total length of every "data:" URL string anywhere inside `value`
// (photos are stored inline as data URLs). ≈ bytes in the database.
export function dataUrlChars(value) {
  if (typeof value === "string") return value.startsWith("data:") ? value.length : 0;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + dataUrlChars(item), 0);
  if (value && typeof value === "object") {
    return Object.values(value).reduce((sum, item) => sum + dataUrlChars(item), 0);
  }
  return 0;
}

export const PHOTO_SIZE_WARNING_BYTES = 500 * 1024 * 1024;

export function formatBytes(bytes = 0) {
  const n = Math.max(0, Number(bytes) || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
