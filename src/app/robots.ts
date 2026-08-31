import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * `/dashboard` and `/onboarding` require a session — an anonymous crawler
 * gets redirected to `/login` before ever seeing real content there, but
 * disallowing them outright is still better crawl hygiene than letting a
 * bot spend budget on URLs that only ever 307 (see the matching
 * `robots: { index: false }` on those routes for the defense-in-depth side
 * of the same intent).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/onboarding", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
