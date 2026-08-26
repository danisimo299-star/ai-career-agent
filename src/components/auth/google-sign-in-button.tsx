"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { RotateCw } from "lucide-react";
import { GoogleIcon } from "./google-icon";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * Google's own brand guidelines call for a white button with black text
 * regardless of the host app's theme — not inverted to match ProfyMind's
 * dark mode — so this hardcodes its own colors instead of using the
 * app's semantic tokens. `signIn("google", ...)` intentionally omits
 * `redirect: false`: an OAuth provider has to leave the site for Google's
 * real consent screen, so the default full-page redirect is what we want
 * here (unlike the Credentials form, which stays in-page).
 */
export function GoogleSignInButton() {
  const { dict } = useLocale();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (loading) return;
    setLoading(true);
    void signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-70"
    >
      {loading ? <RotateCw className="size-4 animate-spin" /> : <GoogleIcon className="size-4" />}
      {loading ? dict.auth.googleConnecting : dict.auth.google}
    </button>
  );
}
