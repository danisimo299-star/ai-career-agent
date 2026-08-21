import { lookupTrustedResource } from "./trusted-resources";
import type { RoadmapResourceResult } from "@/lib/ai/career/types";

export interface EnrichedResourceInput {
  title: string;
  type: "YOUTUBE" | "DOCUMENTATION" | "COURSE" | "BOOK" | "ARTICLE";
  provider?: string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language?: string;
  url?: string;
  verified: boolean;
}

/**
 * Turns AI-proposed resources (never carrying a URL — see `RoadmapResourceResult`)
 * into persistable resource rows: every AI-proposed entry is kept but
 * unverified (`url: undefined`), and at most one real, `verified: true`
 * resource is prepended if any of the given skills matches the small
 * hand-checked allowlist in `trusted-resources.ts`. Shared by the roadmap
 * and career-mission generators so there's exactly one place that decides
 * "is this resource real."
 */
export function enrichResources(aiResources: RoadmapResourceResult[], relatedSkills: string[]): EnrichedResourceInput[] {
  const resources: EnrichedResourceInput[] = aiResources.map((resource) => ({
    title: resource.title,
    type: resource.type,
    provider: resource.provider,
    difficulty: resource.difficulty,
    language: resource.language,
    url: undefined,
    verified: false,
  }));

  const trusted = relatedSkills.map((skill) => lookupTrustedResource(skill)).find((r) => r !== null);
  if (trusted && !resources.some((r) => r.url === trusted.url)) {
    resources.unshift({
      title: trusted.title,
      type: trusted.type,
      provider: trusted.provider,
      url: trusted.url,
      verified: true,
    });
  }

  return resources;
}
