import { NextResponse } from "next/server";
import { AUTH_COOKIE, isValidSession } from "../../../lib/auth";
import {
  apiErrorResponse,
  attachGoogleCookie,
  getGoogleTokens,
} from "../../../lib/google-api";
import { readPrivateResume, ResumeError } from "../../../lib/resume";
import { getTemplateForResumeType } from "../../../lib/templates";
import {
  buildMimeMessage,
  isSameOrigin,
  validateMessagePayload,
} from "../../../lib/send-policy";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isValidSession(request.cookies.get(AUTH_COOKIE)?.value)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was rejected." }, { status: 403 });
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validateMessagePayload(data);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const template = getTemplateForResumeType(data.resumeType);
  const details = {
    name: "Hiring Team",
    email: data.email.trim().toLowerCase(),
    company: data.company.trim(),
    jobRole: data.resumeType === "react" ? "React" : "Full Stack",
  };
  const message = template.create(details);

  try {
    const resume = await readPrivateResume(data.resumeType);
    if (!resume) {
      const resumeFile =
        data.resumeType === "react" ? "Devesh-Resume.pdf" : "Devesh-Magre-Resume.pdf";
      return NextResponse.json(
        { error: `The private resume file resumes/${resumeFile} is missing.` },
        { status: 412 },
      );
    }

    const { tokens, refreshed } = await getGoogleTokens(request);
    const raw = Buffer.from(
      buildMimeMessage({ email: details.email, ...message, resume }),
      "utf8",
    ).toString("base64url");

    let sendResponse;
    try {
      sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
        cache: "no-store",
      });
    } catch {
      return attachGoogleCookie(
        NextResponse.json(
          { error: "Could not confirm the send result. Check Gmail Sent before trying again.", code: "UNCERTAIN" },
          { status: 502 },
        ),
        tokens,
        refreshed,
      );
    }

    if (!sendResponse.ok) {
      return attachGoogleCookie(
        NextResponse.json(
          { error: `Gmail rejected this message (HTTP ${sendResponse.status}).` },
          { status: 502 },
        ),
        tokens,
        refreshed,
      );
    }

    return attachGoogleCookie(
      NextResponse.json({
        sent: true,
        subject: message.subject,
        body: message.body,
        template: template.label,
        resumeType: data.resumeType,
      }),
      tokens,
      refreshed,
    );
  } catch (error) {
    if (error instanceof ResumeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return apiErrorResponse(error);
  }
}
