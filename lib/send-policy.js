import { randomUUID } from "node:crypto";

export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
    const requestHost = forwardedHost || request.headers.get("host") || new URL(request.url).host;
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
    const requestProtocol = forwardedProtocol
      ? `${forwardedProtocol}:`
      : new URL(request.url).protocol;
    return originUrl.host === requestHost && originUrl.protocol === requestProtocol;
  } catch {
    return false;
  }
}

export function validateMessagePayload(data) {
  if (!data || typeof data !== "object") return "Invalid email request.";
  if (
    typeof data.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    data.email.length > 254
  ) {
    return "Enter a valid recipient email address.";
  }
  if (typeof data.company !== "string" || !data.company.trim() || data.company.length > 120 || /[\r\n]/.test(data.company)) {
    return "Enter a valid company name.";
  }
  if (!["react", "fullstack"].includes(data.resumeType)) return "Choose a valid resume type.";
  return null;
}

function encodeQuotedPrintable(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => {
      const bytes = Buffer.from(line, "utf8");
      const tokens = [...bytes].map((byte, index) => {
        const trailingWhitespace =
          (byte === 32 || byte === 9) && index === bytes.length - 1;
        if (
          !trailingWhitespace &&
          ((byte >= 33 && byte <= 60) ||
            (byte >= 62 && byte <= 126) ||
            byte === 32 ||
            byte === 9)
        ) {
          return String.fromCharCode(byte);
        }
        return `=${byte.toString(16).toUpperCase().padStart(2, "0")}`;
      });

      const wrapped = [];
      let current = "";
      for (const token of tokens) {
        if (current.length + token.length > 75) {
          wrapped.push(`${current}=`);
          current = "";
        }
        current += token;
      }
      wrapped.push(current);
      return wrapped.join("\r\n");
    })
    .join("\r\n");
}

export function buildMimeMessage({ email, subject, body, resume }) {
  const boundary = `mixed_${randomUUID().replaceAll("-", "")}`;
  const alternativeBoundary = `alt_${randomUUID().replaceAll("-", "")}`;
  const encodedSubject = Buffer.from(subject, "utf8").toString("base64");
  const text = encodeQuotedPrintable(body);
  const escapeHtml = (value) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const html = escapeHtml(body).replace(/\r\n|\r|\n/g, "<br>\r\n");
  const encodedHtml = encodeQuotedPrintable(html);
  const attachment = resume.contents.toString("base64").match(/.{1,76}/g)?.join("\r\n") || "";
  const encodedFilename = Buffer.from(resume.name, "utf8").toString("base64");
  return [
    `To: ${email}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    "",
    `--${alternativeBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: quoted-printable",
    "",
    text,
    "",
    `--${alternativeBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: quoted-printable",
    "",
    encodedHtml,
    "",
    `--${alternativeBoundary}--`,
    "",
    `--${boundary}`,
    `Content-Type: application/pdf; name="=?UTF-8?B?${encodedFilename}?="`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${resume.name}"`,
    "",
    attachment,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}
