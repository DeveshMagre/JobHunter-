"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Send } from "lucide-react";

export default function LoginForm({ configured }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!configured) {
      setError("Sign-in is not configured on this server. Set the required environment variables.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Unable to sign in. Please try again.");
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9fb] px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <a href="/" className="flex items-center gap-3" aria-label="Reachout">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <Send size={18} strokeWidth={2.2} className="-rotate-12" />
            </span>
            <span className="text-[19px] font-bold tracking-[-0.04em] text-ink">
              reachout<span className="text-brand">.</span>
            </span>
          </a>
        </div>

        <section className="rounded-2xl border border-line bg-white p-7 shadow-card sm:p-9">
          <div className="mb-7">
            <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">
              Welcome back
            </h1>
            <p className="mt-2 text-[13px] leading-5 text-muted">
              Sign in to your personal recruiter outreach workspace.
            </p>
          </div>

          {!configured && (
            <p role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
              Sign-in is not configured. Add the required server environment variables before deploying.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <LockKeyhole size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={256}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-11 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !configured}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Sign in"}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-5 text-muted">
            This workspace is private. Only the configured account can sign in.
          </p>
        </section>
        <p className="mt-5 text-center text-[10px] text-slate-400">
          Your credentials are checked securely on the server.
        </p>
      </div>
    </main>
  );
}
