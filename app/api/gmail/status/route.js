import { NextResponse } from "next/server";
import { AUTH_COOKIE, isValidSession } from "../../../../lib/auth";
import { GMAIL_COOKIE, openGmailTokens } from "../../../../lib/gmail-auth";

export async function GET(request) {
  if (!isValidSession(request.cookies.get(AUTH_COOKIE)?.value)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const tokens = openGmailTokens(request.cookies.get(GMAIL_COOKIE)?.value);
  return NextResponse.json({
    connected: Boolean(tokens),
    email: tokens?.email || null,
    gmailSendEnabled: Boolean(
      tokens?.scopes?.includes("https://www.googleapis.com/auth/gmail.send"),
    ),
  });
}
