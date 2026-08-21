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
import { credentialsSchema, type CredentialsInput } from "@/lib/validation/auth.schema";
import { useLocale } from "@/lib/i18n/locale-provider";

export function LoginForm() {
  const { dict } = useLocale();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

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

        <Button variant="outline" className="w-full" disabled>
          {dict.auth.login.google}
        </Button>

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
