"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GoogleSignInButton } from "./google-sign-in-button";
import { credentialsSchema, type CredentialsInput } from "@/lib/validation/auth.schema";
import { useLocale } from "@/lib/i18n/locale-provider";

/** Auth.js redirects OAuth failures back to `pages.signIn` (this page) as `?error=<Code>` — never a stack trace, just a code to map to real copy. */
function useOAuthErrorMessage(): string | null {
  const { dict } = useLocale();
  const searchParams = useSearchParams();
  const code = searchParams.get("error");
  if (!code) return null;
  return dict.auth.googleErrors[code as keyof typeof dict.auth.googleErrors] ?? dict.auth.googleErrors.Default;
}

export function LoginForm() {
  const { dict } = useLocale();
  const router = useRouter();
  const oauthError = useOAuthErrorMessage();
  // Seeded directly from the URL param present at first render (Next.js
  // resolves `useSearchParams()` from the actual request URL, server and
  // client agree, so there's no hydration mismatch to guard against here
  // the way there would be for a client-only source like localStorage) —
  // afterwards the submit handlers own `formError`, so no effect needed.
  const [formError, setFormError] = useState<string | null>(oauthError);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CredentialsInput>({ resolver: zodResolver(credentialsSchema) });

  const onSubmit = async (values: CredentialsInput) => {
    setFormError(null);
    const result = await signIn("credentials", { ...values, redirect: false });

    if (result?.error) {
      setFormError(dict.auth.login.errors.invalidCredentials);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{dict.auth.login.title}</CardTitle>
        <CardDescription>{dict.auth.login.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">{dict.auth.login.email}</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-destructive text-sm">{dict.auth.register.errors.invalidEmail}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{dict.auth.login.password}</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          </div>

          {formError && <p className="text-destructive text-sm">{formError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? dict.auth.login.submitting : dict.auth.login.submit}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs">{dict.auth.login.orDivider}</span>
          <Separator className="flex-1" />
        </div>

        <GoogleSignInButton />

        <p className="text-muted-foreground text-center text-sm">
          {dict.auth.login.noAccount}{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            {dict.auth.login.registerLink}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
