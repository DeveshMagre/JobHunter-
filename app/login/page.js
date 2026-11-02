import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { AUTH_COOKIE, isValidSession, isAuthConfigured } from "../../lib/auth";

export const metadata = {
  title: "Sign in — Reachout",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(AUTH_COOKIE)?.value;

  if (isValidSession(session)) {
    redirect("/dashboard");
  }

  return <LoginForm configured={isAuthConfigured()} />;
}
