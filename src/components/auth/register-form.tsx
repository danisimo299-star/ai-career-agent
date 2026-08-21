"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth.schema";
import { useLocale } from "@/lib/i18n/locale-provider";

export function RegisterForm() {
  const { dict } = useLocale();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput) => {
    setFormError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "generic" }));
      setFormError(
        body.error === "email_taken"
          ? dict.auth.register.errors.emailTaken
          : dict.auth.register.errors.generic
      );
      return;
    }

    const signInResult = await signIn("credentials", { ...values, redirect: false });
    if (signInResult?.error) {
      setFormError(dict.auth.register.errors.generic);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{dict.auth.register.title}</CardTitle>
        <CardDescription>{dict.auth.register.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">{dict.auth.register.email}</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-destructive text-sm">{dict.auth.register.errors.invalidEmail}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{dict.auth.register.password}</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password ? (
              <p className="text-destructive text-sm">{dict.auth.register.errors.weakPassword}</p>
            ) : (
              <p className="text-muted-foreground text-xs">{dict.auth.register.passwordHint}</p>
            )}
          </div>

          {formError && <p className="text-destructive text-sm">{formError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? dict.auth.register.submitting : dict.auth.register.submit}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs">{dict.auth.register.orDivider}</span>
          <Separator className="flex-1" />
        </div>

        <Button variant="outline" className="w-full" disabled>
          {dict.auth.register.google}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          {dict.auth.register.haveAccount}{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            {dict.auth.register.loginLink}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
