import type { WorkFormat } from "@prisma/client";
import type { JobEmploymentType, JobExperienceLevel } from "./types";

export const HH_SCHEDULE_VALUES = ["fullDay", "shift", "flexible", "remote", "flyInFlyOut"] as const;

/** HH.ru has no "hybrid" schedule value — HYBRID/ANY deliberately leave `schedule` unset rather than guessing. */
export function workFormatToHhSchedule(format?: WorkFormat | null): (typeof HH_SCHEDULE_VALUES)[number] | undefined {
  if (format === "REMOTE") return "remote";
  if (format === "ONSITE") return "fullDay";
  return undefined;
}

export interface HhVacancyQueryParams {
  /** Free-text search — refines within `professionalRoleId` when both are given, or stands alone when it isn't. */
  text?: string;
  /** HH's own closed professional-role category id (see `hh-professional-roles.ts`) — far more reliable than free text alone. Repeatable per HH's API. */
  professionalRoleIds?: number[];
  areaId: number;
  experience?: JobExperienceLevel;
  employmentTypes?: JobEmploymentType[];
  workFormat?: WorkFormat;
  salaryMin?: number;
  perPage?: number;
  /** 0-based — HH's own pagination param, for "Показать ещё вакансии". */
  page?: number;
}

/**
 * The ONE place that turns search criteria into HH `/vacancies` query
 * params — used by the real provider (`hh.provider.ts`), the market
 * validator (`career-market.service.ts`), and the user-facing "open in
 * HH.ru" link (`buildHhSearchUrl`). Before this, each of those built its own
 * param list, which is exactly how "validator found 12, Jobs found 0" bugs
 * happen — a resolved role/area/experience now always turns into identical
 * params everywhere it's used.
 */
export function buildHHVacancyParams(params: HhVacancyQueryParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.text) {
    sp.set("text", params.text);
    sp.set("search_field", "name");
  }
  for (const roleId of params.professionalRoleIds ?? []) sp.append("professional_role", String(roleId));
  sp.set("area", String(params.areaId));
  if (params.experience) sp.set("experience", params.experience);
  for (const employment of params.employmentTypes ?? []) sp.append("employment", employment);
  const schedule = workFormatToHhSchedule(params.workFormat);
  if (schedule) sp.set("schedule", schedule);
  if (params.salaryMin) {
    sp.set("salary", String(params.salaryMin));
    sp.set("only_with_salary", "true");
  }
  sp.set("per_page", String(params.perPage ?? 20));
  if (params.page) sp.set("page", String(params.page));
  return sp;
}
