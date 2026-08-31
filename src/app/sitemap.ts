import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Only the actual public, indexable, content-bearing routes this app has —
 * everything under `/dashboard`, `/onboarding`, and `/api/*` is
 * authenticated or non-content and already excluded via `robots.ts` +
 * per-route `noindex`. `/login` and `/register` are public but are
 * functional/session-specific pages with no unique content worth ranking,
 * so they're left out rather than padded in just to have more entries.
 * Add a route here only when it's a real page that should show up in
 * search results.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
