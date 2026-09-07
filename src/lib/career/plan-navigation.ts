export type PlanView = "today" | "all";
export type PlanSearchParams = Record<string, string | string[] | undefined>;

export function legacyPlanHref(view: PlanView, params: PlanSearchParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const entry of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      query.append(key, entry);
    }
  }
  query.set("view", view);
  return `/dashboard/plan?${query}`;
}
