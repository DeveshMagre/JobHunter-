import {
  createHmac,
  createHash,
  timingSafeEqual,
} from "node:crypto";

export const AUTH_COOKIE = "reachout_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const EMAIL = process.env.AUTH_EMAIL;
const PASSWORD = process.env.AUTH_PASSWORD;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET;

export function isAuthConfigured() {
  return Boolean(
    EMAIL &&
      PASSWORD &&
      SESSION_SECRET &&
      Buffer.byteLength(SESSION_SECRET, "utf8") >= 32,
  );
}

function constantTimeEqual(left, right) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function matchesCredentials(email, password) {
  if (!isAuthConfigured()) return false;
  return (
    constantTimeEqual(email.trim().toLowerCase(), EMAIL.trim().toLowerCase()) &&
    constantTimeEqual(password, PASSWORD)
  );
}

function sign(payload) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

export function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({ email: EMAIL.toLowerCase(), expiresAt: Date.now() + SESSION_MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isValidSession(token) {
  if (!isAuthConfigured() || typeof token !== "string") return false;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator === token.length - 1) return false;

  const payload = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);
  const expectedSignature = sign(payload);

  if (!constantTimeEqual(providedSignature, expectedSignature)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return (
      typeof session.email === "string" &&
      constantTimeEqual(session.email, EMAIL.toLowerCase()) &&
      Number.isFinite(session.expiresAt) &&
      session.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}
