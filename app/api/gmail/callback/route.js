import { NextResponse } from "next/server";
import {
  GMAIL_COOKIE,
  GMAIL_OAUTH_STATE_COOKIE,
  gmailCookieOptions,
  isGmailOAuthConfigured,
  isValidOAuthState,
  oauthStateCookieOptions,
  sealGmailTokens,
} from "../../../../lib/gmail-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dashboardRedirect(request, status) {
  return NextResponse.redirect(new URL(`/dashboard?gmail=${status}`, request.url));
}

export async function GET(request) {
  if (!isGmailOAuthConfigured()) return dashboardRedirect(request, "not-configured");

  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const stateCookie = request.cookies.get(GMAIL_OAUTH_STATE_COOKIE)?.value;
  if (!isValidOAuthState(state, stateCookie) || !code) {
    return dashboardRedirect(request, "oauth-error");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        redirect_uri: process.env.GMAIL_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    const tokenData = await tokenResponse.json();
    if (
      !tokenResponse.ok ||
      typeof tokenData.access_token !== "string" ||
      typeof tokenData.refresh_token !== "string" ||
      typeof tokenData.id_token !== "string" ||
      typeof tokenData.scope !== "string" ||
      !tokenData.scope.split(" ").includes("https://www.googleapis.com/auth/gmail.send")
    ) {
      return dashboardRedirect(request, "oauth-error");
    }

    const verificationResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`,
      { cache: "no-store" },
    );
    const verifiedIdentity = await verificationResponse.json();
    if (
      !verificationResponse.ok ||
      verifiedIdentity.aud !== process.env.GMAIL_CLIENT_ID ||
      verifiedIdentity.email_verified !== "true" ||
      typeof verifiedIdentity.email !== "string" ||
      !verifiedIdentity.email.toLowerCase().endsWith("@gmail.com")
    ) {
      return dashboardRedirect(request, "gmail-account-required");
    }

    const tokenCookie = sealGmailTokens({
      email: verifiedIdentity.email.toLowerCase(),
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      scopes: tokenData.scope.split(" "),
      expiresAt: Date.now() + Number(tokenData.expires_in || 3600) * 1000,
    });
    const response = dashboardRedirect(request, "connected");
    response.cookies.set(GMAIL_COOKIE, tokenCookie, gmailCookieOptions());
    response.cookies.set(GMAIL_OAUTH_STATE_COOKIE, "", {
      ...oauthStateCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch {
    return dashboardRedirect(request, "oauth-error");
  }
}
