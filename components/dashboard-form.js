"use client";

import { useEffect, useState } from "react";

const EMPTY_FORM = { email: "", company: "" };

export default function DashboardForm() {
  const [resumeType, setResumeType] = useState("react");
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [gmailEmail, setGmailEmail] = useState("");
  const [gmailNotice, setGmailNotice] = useState("");

  useEffect(() => {
    let active = true;
    const gmailState = new URLSearchParams(window.location.search).get("gmail");
    if (gmailState && gmailState !== "connected") {
      setGmailNotice(
        gmailState === "not-configured"
          ? "Gmail is not configured on this server."
          : "Gmail connection failed. Try connecting again.",
      );
    }
    fetch("/api/gmail/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Gmail status unavailable.");
        return response.json();
      })
      .then((status) => {
        if (active && status.connected && status.gmailSendEnabled) {
          setGmailEmail(status.email || "");
        }
      })
      .catch(() => {
        if (active) setGmailEmail("");
      });
    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage(null);
  }

  async function sendMail(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const details = {
      email: form.email.trim().toLowerCase(),
      company: form.company.trim(),
    };
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, resumeType }),
      });
      const result = await response.json();

      if (!response.ok || result.sent !== true) {
        setMessage({ type: "error", text: result.error || "Email could not be sent." });
        return;
      }

      setForm(EMPTY_FORM);
      setMessage({
        type: "success",
        text: result.safetyWarning || `Email sent to ${details.email}.`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Could not confirm the send result. Check Gmail Sent before trying again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-7 rounded-xl border border-line bg-white p-5 shadow-card sm:p-7">
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Resume type</span>
          <select
            suppressHydrationWarning
            value={resumeType}
            onChange={(event) => setResumeType(event.target.value)}
            className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          >
            <option value="react">React</option>
            <option value="fullstack">Full Stack (MERN)</option>
          </select>
        </label>
      </div>
      <p className="mb-5 text-xs text-muted">
        React uses Template 1; Full Stack uses Template 2.
      </p>
      {gmailEmail ? (
        <p className="mb-5 text-xs text-emerald-700">Sending from {gmailEmail}</p>
      ) : (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{gmailNotice || "Connect Gmail before sending."}</p>
          <a className="mt-1 inline-block font-semibold underline" href="/api/gmail/connect">
            Connect Gmail
          </a>
        </div>
      )}
      <form onSubmit={sendMail} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Email address</span>
          <input suppressHydrationWarning name="email" type="email" required maxLength={254} value={form.email} onChange={updateField} className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Company</span>
          <input suppressHydrationWarning name="company" required maxLength={120} value={form.company} onChange={updateField} className="h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
        </label>
        {message && (
          <p role={message.type === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2.5 text-sm ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {message.text}
          </p>
        )}
        <button type="submit" disabled={busy || !gmailEmail} className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? "Sending…" : "Send Mail"}
        </button>
      </form>
    </section>
  );
}
