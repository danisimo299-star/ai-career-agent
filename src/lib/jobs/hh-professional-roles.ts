import { HH_USER_AGENT } from "./hh-client";

export interface HhProfessionalRole {
  id: number;
  name: string;
  categoryName: string;
}

interface HhProfessionalRolesResponse {
  categories: { id: string; name: string; roles: { id: string; name: string }[] }[];
}

let cache: { roles: HhProfessionalRole[]; expiresAt: number } | null = null;
let inflight: Promise<HhProfessionalRole[]> | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * `GET /professional_roles` is HH's own closed, employer-facing catalog of
 * real job categories (dictionary endpoint — public, no OAuth token needed,
 * unlike `/vacancies`) — the authoritative "real profession" source of
 * truth this app resolves every AI-suggested career against, instead of
 * trusting free-text titles the model invents. Fetched once and cached for
 * 24h since HH's role catalog changes rarely.
 */
async function fetchProfessionalRoles(): Promise<HhProfessionalRole[]> {
  const response = await fetch("https://api.hh.ru/professional_roles", {
    headers: { "User-Agent": HH_USER_AGENT },
  });
  if (!response.ok) throw new Error(`HH professional_roles request failed: ${response.status}`);

  const data = (await response.json()) as HhProfessionalRolesResponse;
  return data.categories.flatMap((category) =>
    category.roles.map((role) => ({ id: Number(role.id), name: role.name, categoryName: category.name }))
  );
}

export async function getProfessionalRoles(): Promise<HhProfessionalRole[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.roles;
  if (inflight) return inflight;

  inflight = fetchProfessionalRoles()
    .then((roles) => {
      cache = { roles, expiresAt: Date.now() + CACHE_TTL_MS };
      return roles;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/**
 * Generic role-word qualifiers that appear across dozens of unrelated real
 * HH role names ("Ассистент врача" vs "Ассистент разработчика", "Младший
 * бухгалтер" vs "Младший юрист", ...) — counted toward an exact/substring
 * match, but excluded from plain token-overlap scoring, otherwise two
 * completely different professions that happen to share only a filler word
 * like "ассистент" or "специалист" score as a false match (caught live: an
 * AI candidate whose only real-word alias was "Ассистент разработчика"
 * matched "Ассистент врача" at exactly the 0.5 threshold on "ассистент" alone).
 */
const GENERIC_ROLE_WORDS = new Set([
  "ассистент",
  "специалист",
  "менеджер",
  "эксперт",
  "консультант",
  "координатор",
  "сотрудник",
  "представитель",
  "младший",
  "старший",
  "ведущий",
  "главный",
  "junior",
  "middle",
  "senior",
  "стажер",
  "стажёр",
  "начинающий",
]);

function tokenOverlapScore(a: string, b: string): number {
  const tokensA = new Set(normalize(a).split(" ").filter((t) => !GENERIC_ROLE_WORDS.has(t)));
  const tokensB = new Set(normalize(b).split(" ").filter((t) => !GENERIC_ROLE_WORDS.has(t)));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let shared = 0;
  for (const token of tokensA) if (tokensB.has(token)) shared++;
  return shared / Math.max(tokensA.size, tokensB.size);
}

export interface ProfessionalRoleMatch {
  role: HhProfessionalRole;
  score: number;
  /** True when the candidate string matched a real role name exactly (case/ё-insensitive) — the strongest possible signal. */
  exact: boolean;
}

function bestTokenMatch(candidates: string[], roles: HhProfessionalRole[]): ProfessionalRoleMatch | null {
  let best: ProfessionalRoleMatch | null = null;
  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    for (const role of roles) {
      const normalizedRole = normalize(role.name);
      // HH role names are often "X, Y" (two real synonyms in one entry, e.g.
      // "BI-аналитик, аналитик данных") — match against each half too.
      const roleVariants = [normalizedRole, ...normalizedRole.split(",").map((v) => v.trim())];

      for (const variant of roleVariants) {
        if (!variant) continue;
        const exact = variant === normalizedCandidate;
        const score = exact ? 1 : Math.max(tokenOverlapScore(normalizedCandidate, variant), variant.includes(normalizedCandidate) || normalizedCandidate.includes(variant) ? 0.7 : 0);
        if (!best || score > best.score) best = { role, score, exact };
      }
    }
  }
  return best;
}

interface HhSuggestResponse {
  items: { id: string; text: string }[];
}

/**
 * `GET /suggests/professional_roles` — HH's own autocomplete over the same
 * catalog (public, no token needed). Stricter than the token matcher (it's
 * effectively "is this text a substring of a real role name", so it misses
 * reasonable rephrasings like "Фронтенд-разработчик"), but when it DOES
 * return something, that's HH's own system confirming the category —
 * used here to break ties for candidates the token matcher is unsure about,
 * per the brief's "also use suggests where useful" (item 3).
 */
async function suggestMatch(candidate: string, roles: HhProfessionalRole[]): Promise<ProfessionalRoleMatch | null> {
  try {
    const url = new URL("https://api.hh.ru/suggests/professional_roles");
    url.searchParams.set("text", candidate);
    const response = await fetch(url, { headers: { "User-Agent": HH_USER_AGENT } });
    if (!response.ok) return null;
    const data = (await response.json()) as HhSuggestResponse;
    const first = data.items[0];
    if (!first) return null;
    const role = roles.find((r) => r.id === Number(first.id));
    return role ? { role, score: 0.95, exact: false } : null;
  } catch {
    return null;
  }
}

/**
 * The core "AI cannot name the final profession" enforcement (see the
 * market-reality brief item 4/44): scores every candidate string (the AI's
 * `title`, `hhSearchTitle`, `searchAliases`, `firstJobTitle`) against every
 * real HH role name and returns the single best match — this is a
 * programmatic lookup against a closed, official list, not another prompt.
 * Below `MIN_PROFESSIONAL_ROLE_MATCH_SCORE` there simply is no confident
 * real-market equivalent, and the caller must reject the candidate rather
 * than show it. When the token match is inconclusive (neither confidently
 * right nor confidently wrong), HH's own suggest endpoint is consulted as a
 * tie-breaker before giving up.
 */
export async function resolveProfessionalRole(candidates: string[]): Promise<ProfessionalRoleMatch | null> {
  const roles = await getProfessionalRoles();
  const cleanCandidates = candidates.filter((c): c is string => Boolean(c && c.trim()));
  if (cleanCandidates.length === 0) return null;

  const tokenBest = bestTokenMatch(cleanCandidates, roles);
  // An exact token match is already the strongest possible signal — no need
  // for an extra round trip. Everything else (including a confidently-low
  // score — the token matcher can't score cross-language input meaningfully,
  // e.g. an English-only candidate against Russian role names always scores
  // 0 regardless of how real the profession is) gets a second opinion from
  // HH's own suggester before this candidate is trusted or rejected.
  if (tokenBest?.exact) return tokenBest;

  for (const candidate of cleanCandidates.slice(0, 2)) {
    const suggested = await suggestMatch(candidate, roles);
    if (suggested) return suggested;
  }

  return tokenBest;
}

export const MIN_PROFESSIONAL_ROLE_MATCH_SCORE = 0.5;
