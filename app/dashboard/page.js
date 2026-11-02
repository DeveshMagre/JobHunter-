import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardForm from "../../components/dashboard-form";
import Navbar from "../../components/navbar";
import { AUTH_COOKIE, isValidSession } from "../../lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Reachout",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  if (!isValidSession(cookieStore.get(AUTH_COOKIE)?.value)) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Send an application email</h1>
        <p className="mt-2 text-sm text-muted">
          Choose a resume, then enter the recipient details.
        </p>
        <DashboardForm />
      </main>
    </>
  );
}
