import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const GMAIL_COOKIE = "reachout_gmail";
export const GMAIL_OAUTH_STATE_COOKIE = "reachout_gmail_state";
export const GMAIL_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.send",
];

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || "";
}

function encryptionKey() {
  return createHash("sha256").update(sessionSecret()).digest();
}

function signature(value) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(left, right) {
  return timingSafeEqual(
    createHash("sha256").update(left).digest(),
    createHash("sha256").update(right).digest(),
  );
}

export function isGmailOAuthConfigured() {
  return Boolean(
    process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REDIRECT_URI &&
      sessionSecret().length >= 32,
  );
}

export function createOAuthState() {
  const nonce = randomBytes(32).toString("base64url");
  return `${nonce}.${signature(nonce)}`;
}

export function isValidOAuthState(state, cookieState) {
  if (!state || !cookieState || !safeEqual(state, cookieState)) return false;
  const separator = state.indexOf(".");
  if (separator <= 0) return false;
  const nonce = state.slice(0, separator);
  return safeEqual(state.slice(separator + 1), signature(nonce));
}

export function sealGmailTokens(tokens) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(tokens), "utf8"),
    cipher.final(),
  ]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function openGmailTokens(value) {
  if (typeof value !== "string") return null;
  try {
    const [ivValue, tagValue, ciphertextValue] = value.split(".");
    if (!ivValue || !tagValue || !ciphertextValue) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const tokens = JSON.parse(plaintext);
    if (
      typeof tokens.email !== "string" ||
      typeof tokens.refreshToken !== "string" ||
      typeof tokens.accessToken !== "string" ||
      !Number.isFinite(tokens.expiresAt)
    ) {
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

export function gmailCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export function oauthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/gmail",
    maxAge: 60 * 10,
  };
}
