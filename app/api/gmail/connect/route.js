import { NextResponse } from "next/server";
import { AUTH_COOKIE, isValidSession } from "../../../../lib/auth";
import {
  createOAuthState,
  GMAIL_OAUTH_STATE_COOKIE,
  GMAIL_SCOPES,
  isGmailOAuthConfigured,
  oauthStateCookieOptions,
} from "../../../../lib/gmail-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const sessionCookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (!isValidSession(sessionCookie)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isGmailOAuthConfigured()) {
    return NextResponse.redirect(new URL("/dashboard?gmail=not-configured", request.url));
  }

  const state = createOAuthState();
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID,
    redirect_uri: process.env.GMAIL_REDIRECT_URI,
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(GMAIL_OAUTH_STATE_COOKIE, state, oauthStateCookieOptions());
  return response;
}
