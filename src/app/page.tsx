import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { siteConfig } from "@/config/site";
import { LandingPage } from "@/components/landing/landing-page";

// Self-referencing canonical — resolved against `metadataBase`
// (`siteConfig.url`, the bare `profymind.ru` apex) in `app/layout.tsx`'s
// `generateMetadata`, never `www` or a preview host.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * This was the actual cause of "closing the browser feels like it logged
 * me out": the root URL — the one a bookmark or a freshly reopened browser
 * actually lands on — used to render the public marketing page
 * unconditionally, with no auth check at all, regardless of whether the
 * visitor had a perfectly valid session. The session cookie was never the
 * problem; this page just never looked at it. `dashboard/layout.tsx`
 * handles the onboarding-incomplete case from `/dashboard`, so this only
 * needs the one check.
 */
export default async function RootPage() {
  const user = await getCurrentUser();
  if (user?.id) redirect("/dashboard");

  const locale = await getLocale();
  const seo = getDictionary(locale).seo;

  return (
    <>
      {/* Minimal, honest `WebSite` structured data — no fabricated
          ratings/reviews/pricing, just what's actually true about the
          site. Only reachable here, the one page an anonymous crawler
          actually gets served (every other route redirects). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteConfig.name,
            url: siteConfig.url,
            description: seo.description,
            inLanguage: locale === "ru" ? "ru-RU" : "en-US",
          }),
        }}
      />
      <LandingPage />
    </>
  );
}
