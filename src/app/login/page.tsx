import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

/**
 * An already-authenticated user landing here (a stale bookmark, browser
 * back button, or exactly the "closed the browser, reopened the site"
 * flow this page is part of) must never be shown the login form — the
 * server already knows who they are. `dashboard/layout.tsx` handles the
 * onboarding-incomplete case from here, so this only ever needs the one
 * check, not a duplicate of that logic.
 */
export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user?.id) redirect("/dashboard");

  return (
    <AuthShell>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
