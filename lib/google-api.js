import { NextResponse } from "next/server";
import {
  GMAIL_COOKIE,
  gmailCookieOptions,
  openGmailTokens,
  sealGmailTokens,
} from "./gmail-auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export class GoogleApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "GoogleApiError";
    this.status = status;
  }
}

export async function getGoogleTokens(request) {
  const tokens = openGmailTokens(request.cookies.get(GMAIL_COOKIE)?.value);
  if (!tokens) throw new GoogleApiError("Connect Gmail again to continue.", 401);

  if (tokens.expiresAt > Date.now() + 60_000) {
    return { tokens, refreshed: false };
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: tokens.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || typeof data.access_token !== "string") {
    throw new GoogleApiError("Google authorization expired. Reconnect Gmail to continue.", 401);
  }

  return {
    tokens: {
      ...tokens,
      accessToken: data.access_token,
      expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
    },
    refreshed: true,
  };
}

export function attachGoogleCookie(response, tokens, refreshed) {
  if (refreshed) {
    response.cookies.set(GMAIL_COOKIE, sealGmailTokens(tokens), gmailCookieOptions());
  }
  return response;
}

export function apiErrorResponse(error) {
  if (error instanceof GoogleApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json(
    { error: "Google service request failed. Please try again." },
    { status: 502 },
  );
}
