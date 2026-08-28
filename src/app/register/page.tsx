import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

/** Same reasoning as `login/page.tsx` — an authenticated user must never see the sign-up form. */
export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user?.id) redirect("/dashboard");

  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
