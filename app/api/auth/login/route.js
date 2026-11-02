import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  createSessionToken,
  isAuthConfigured,
  matchesCredentials,
  SESSION_MAX_AGE,
} from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Sign-in is not configured on this server." },
      { status: 503 },
    );
  }

  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    !credentials ||
    typeof credentials.email !== "string" ||
    typeof credentials.password !== "string" ||
    credentials.email.length > 254 ||
    credentials.password.length > 256
  ) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  if (!matchesCredentials(credentials.email, credentials.password)) {
    return NextResponse.json(
      { error: "The email or password is incorrect." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
