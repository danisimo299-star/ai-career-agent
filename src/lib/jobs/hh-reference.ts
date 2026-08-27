import type { WorkFormat } from "@prisma/client";
import type { JobEmploymentType, JobExperienceLevel } from "./types";
import { buildHHVacancyParams, workFormatToHhSchedule as workFormatToHhScheduleImpl } from "./hh-query";

/** Re-exported so existing importers (`hh.provider.ts`, `mock.provider.ts`) don't need to know it now lives in `hh-query.ts`. */
export const workFormatToHhSchedule = workFormatToHhScheduleImpl;
export { HH_SCHEDULE_VALUES } from "./hh-query";

/**
 * All IDs and vocabulary below were live-verified against the real HH.ru
 * public API (`GET https://api.hh.ru/areas/113`, `GET
 * https://api.hh.ru/dictionaries`, both anonymous 200 OK) — never guessed.
 * `GET /vacancies` itself currently returns 403 "forbidden" without a
 * registered OAuth app (see `HH_ACCESS_TOKEN` in `lib/env.ts`), so these
 * values are what `buildHhSearchUrl` uses to construct a genuine,
 * correctly-parameterized `hh.ru/search/vacancy` link — the same URL a real
 * person typing that search into HH.ru themselves would land on.
 */
/**
 * The quick-select city list shown in the Jobs UI. `key` is a stable i18n
 * dictionary key (`jobsPage.filters.cities.<key>`); `areaId` is the real,
 * live-verified HH.ru area id. Free-text city entry stays available
 * alongside these for any other Russian city — `resolveHhAreaId` falls
 * back to the Russia-wide root rather than guessing an id for it.
 */
export const SUPPORTED_CITIES = [
  { key: "moscow", ru: "Москва", en: "Moscow", areaId: 1 },
  { key: "saintPetersburg", ru: "Санкт-Петербург", en: "Saint Petersburg", areaId: 2 },
  { key: "kazan", ru: "Казань", en: "Kazan", areaId: 88 },
  { key: "innopolis", ru: "Иннополис", en: "Innopolis", areaId: 2734 },
  { key: "yekaterinburg", ru: "Екатеринбург", en: "Yekaterinburg", areaId: 3 },
  { key: "novosibirsk", ru: "Новосибирск", en: "Novosibirsk", areaId: 4 },
  { key: "nizhnyNovgorod", ru: "Нижний Новгород", en: "Nizhny Novgorod", areaId: 66 },
  { key: "samara", ru: "Самара", en: "Samara", areaId: 78 },
  { key: "rostovOnDon", ru: "Ростов-на-Дону", en: "Rostov-on-Don", areaId: 76 },
  { key: "krasnodar", ru: "Краснодар", en: "Krasnodar", areaId: 53 },
  { key: "sochi", ru: "Сочи", en: "Sochi", areaId: 237 },
] as const;

export const HH_AREA_IDS: Record<string, number> = Object.fromEntries(
  SUPPORTED_CITIES.flatMap((city) => [
    [city.ru.toLowerCase(), city.areaId],
    [city.en.toLowerCase(), city.areaId],
  ])
);
// A few common short forms/aliases the live area tree itself doesn't spell out.
HH_AREA_IDS["spb"] = 2;
HH_AREA_IDS["st petersburg"] = 2;
HH_AREA_IDS["ekaterinburg"] = 3;

/** Russia-wide root area — the honest fallback when a user's free-text city doesn't match a known ID. */
export const HH_RUSSIA_AREA_ID = 113;

export const HH_EXPERIENCE_VALUES = ["noExperience", "between1And3", "between3And6", "moreThan6"] as const;
export const HH_EMPLOYMENT_VALUES = ["full", "part", "project", "volunteer", "probation"] as const;

export function resolveHhAreaId(city?: string | null): number {
  if (!city) return HH_RUSSIA_AREA_ID;
  return HH_AREA_IDS[city.trim().toLowerCase()] ?? HH_RUSSIA_AREA_ID;
}

export interface HhSearchLinkParams {
  text: string;
  city?: string | null;
  workFormat?: WorkFormat | null;
  experience?: JobExperienceLevel | null;
  employmentTypes?: JobEmploymentType[];
  salaryMin?: number | null;
  professionalRoleIds?: number[];
  /** Pre-resolved (e.g. via the live `resolveAreaIdLive`) — takes priority over `city` when given, so this link always matches whatever area a search/validation step already resolved. */
  areaId?: number | null;
}

/**
 * Builds a real `hh.ru/search/vacancy` URL with genuine parameter names and
 * values, via the same `buildHHVacancyParams` the real API search and the
 * market validator use — never encodes a specific vacancy ID, only search
 * criteria, so it can never point at a vacancy that doesn't exist.
 */
export function buildHhSearchUrl(params: HhSearchLinkParams): string {
  const url = new URL("https://hh.ru/search/vacancy");
  url.search = buildHHVacancyParams({
    text: params.text,
    professionalRoleIds: params.professionalRoleIds,
    areaId: params.areaId ?? resolveHhAreaId(params.city),
    experience: params.experience ?? undefined,
    employmentTypes: params.employmentTypes,
    workFormat: params.workFormat ?? undefined,
    salaryMin: params.salaryMin ?? undefined,
  }).toString();
  return url.toString();
}
