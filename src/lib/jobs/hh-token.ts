import { env } from "@/lib/env";
import { HH_USER_AGENT } from "./hh-client";

/**
 * HH.ru application token (`grant_type=client_credentials`).
 *
 * `GET /vacancies` began returning 403 for anonymous callers, so a real
 * search now requires a token from a registered dev.hh.ru application.
 * This is the *server* application grant — it authenticates ProfyMind
 * itself, not an end user, so there is no redirect URI, no authorization
 * code and no per-user consent involved. Reference data (`/areas`,
 * `/dictionaries`) is still anonymous and deliberately does not go
 * through here.
 *
 * `HH_ACCESS_TOKEN`, when set, is honoured as a manual override so a
 * token obtained by hand can be dropped in without client credentials.
 */

const TOKEN_URL = "https://api.hh.ru/token";

/** Refresh this far before the real expiry so an in-flight search never races the boundary. */
const EXPIRY_SKEW_MS = 60_000;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

/**
 * Credentials that exist but get rejected are a *failure*, not an absent
 * configuration — the two must stay distinguishable all the way to the UI,
 * which says different things for "not set up" and "we could not check".
 */
export type HhTokenResult =
  | { status: "ok"; accessToken: string }
  | { status: "not_configured" }
  | { status: "error" };

interface HhTokenResponse {
  access_token?: string;
  expires_in?: number;
}

let cached: CachedToken | null = null;
/** After a failed mint, stop re-asking on every single search. */
let retryAfter = 0;
const FAILURE_BACKOFF_MS = 60_000;
/** Concurrent searches must share one token request, not each mint their own. */
let inFlight: Promise<string | undefined> | null = null;

export function __resetHhTokenCacheForTests() {
  cached = null;
  inFlight = null;
  retryAfter = 0;
}

async function requestToken(clientId: string, clientSecret: string): Promise<string | undefined> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "User-Agent": HH_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      // Status only. The response body echoes back the request parameters,
      // including the client secret, so it must never reach a log.
      console.error(`[hh-token] token request failed with HTTP ${response.status}`);
      retryAfter = Date.now() + FAILURE_BACKOFF_MS;
      return undefined;
    }

    const data = (await response.json()) as HhTokenResponse;
    if (!data.access_token) {
      console.error("[hh-token] token response contained no access_token");
      retryAfter = Date.now() + FAILURE_BACKOFF_MS;
      return undefined;
    }

    const ttlMs = (data.expires_in ?? 0) * 1000;
    cached = {
      accessToken: data.access_token,
      // A missing/short `expires_in` must not produce an already-expired
      // entry that re-mints a token on every single search.
      expiresAt: Date.now() + Math.max(ttlMs - EXPIRY_SKEW_MS, 5 * 60_000),
    };
    return data.access_token;
  } catch {
    console.error("[hh-token] token request failed: network error");
    retryAfter = Date.now() + FAILURE_BACKOFF_MS;
    return undefined;
  }
}

/**
 * Resolves the HH application token. `error` means we have credentials but
 * could not turn them into a token — callers must surface that as "could not
 * check", never as "no vacancies".
 */
export async function getHhToken(): Promise<HhTokenResult> {
  if (env.HH_ACCESS_TOKEN) return { status: "ok", accessToken: env.HH_ACCESS_TOKEN };

  const clientId = env.HH_CLIENT_ID;
  const clientSecret = env.HH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { status: "not_configured" };

  if (cached && cached.expiresAt > Date.now()) return { status: "ok", accessToken: cached.accessToken };
  if (Date.now() < retryAfter) return { status: "error" };

  inFlight ??= requestToken(clientId, clientSecret).finally(() => {
    inFlight = null;
  });

  const accessToken = await inFlight;
  return accessToken ? { status: "ok", accessToken } : { status: "error" };
}
