import { redirect } from "next/navigation";
import { legacyPlanHref, type PlanSearchParams } from "@/lib/career/plan-navigation";

// Retain bookmarked URLs and their query parameters.
export default async function LegacyPage({ searchParams }: { searchParams: Promise<PlanSearchParams> }) {
  redirect(legacyPlanHref("all", await searchParams));
}
