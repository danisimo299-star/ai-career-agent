import { HH_USER_AGENT } from "./hh-client";
import { HH_RUSSIA_AREA_ID } from "./hh-reference";

interface HhAreaNode {
  id: string;
  name: string;
  areas: HhAreaNode[];
}

let cache: { index: Map<string, number>; expiresAt: number } | null = null;
let inflight: Promise<Map<string, number>> | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeCityName(name: string): string {
  return name.trim().toLowerCase().replace(/ё/g, "е");
}

function flatten(node: HhAreaNode, index: Map<string, number>) {
  const key = normalizeCityName(node.name);
  // First (higher-level, encountered-earlier) match wins — a real city
  // shouldn't get silently overwritten by an obscure village sharing its name.
  if (!index.has(key)) index.set(key, Number(node.id));
  for (const child of node.areas) flatten(child, index);
}

/**
 * `GET /areas/113` is HH's own full, live area tree for Russia — a public
 * dictionary endpoint (no OAuth token needed), confirmed working. ~15k
 * nested areas, ~2MB — fetched once and cached for 24h rather than on every
 * request; the previously hardcoded `SUPPORTED_CITIES` (11 cities) stays as
 * the Jobs UI's quick-select list, this is the general-purpose resolver for
 * ANY Russian city a user's profile might name.
 */
async function fetchAreaIndex(): Promise<Map<string, number>> {
  const response = await fetch(`https://api.hh.ru/areas/${HH_RUSSIA_AREA_ID}`, {
    headers: { "User-Agent": HH_USER_AGENT },
  });
  if (!response.ok) throw new Error(`HH areas request failed: ${response.status}`);

  const root = (await response.json()) as HhAreaNode;
  const index = new Map<string, number>();
  flatten(root, index);
  return index;
}

async function getAreaIndex(): Promise<Map<string, number>> {
  if (cache && cache.expiresAt > Date.now()) return cache.index;
  if (inflight) return inflight;

  inflight = fetchAreaIndex()
    .then((index) => {
      cache = { index, expiresAt: Date.now() + CACHE_TTL_MS };
      return index;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Async, live-catalog city→area-id resolver — falls back to Russia-wide both when no city is given and when the live lookup itself fails, never throws. */
export async function resolveAreaIdLive(city?: string | null): Promise<number> {
  if (!city) return HH_RUSSIA_AREA_ID;
  try {
    const index = await getAreaIndex();
    return index.get(normalizeCityName(city)) ?? HH_RUSSIA_AREA_ID;
  } catch {
    return HH_RUSSIA_AREA_ID;
  }
}
