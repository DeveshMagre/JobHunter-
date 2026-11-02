"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setError("");
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed.");
      window.location.assign("/login");
    } catch {
      setError("Could not log out. Please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-brand"
          >
            Dashboard
          </Link>
        </div>
        <button
          type="button"
          suppressHydrationWarning
          onClick={logout}
          disabled={loggingOut}
          className="text-sm font-medium text-slate-600 hover:text-ink disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Logout"}
        </button>
        {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
      </nav>
    </header>
  );
}
