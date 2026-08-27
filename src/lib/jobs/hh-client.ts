/**
 * A descriptive `User-Agent` identifying this app with real contact info —
 * HH.ru's API guidelines require this on every request (an anonymous/generic
 * UA is more likely to be rate-limited or rejected). Shared by every HH
 * endpoint this app calls (`/vacancies`, `/professional_roles`, `/areas`).
 */
export const HH_USER_AGENT = "ProfyMind/1.0 (+https://profymind.app; contact: support@profymind.app)";

/**
 * A single fetch result shape shared by every real HH.ru call in this app,
 * so callers can always tell "confirmed zero" apart from "couldn't check" —
 * `/vacancies` needs `HH_ACCESS_TOKEN` and returns 403 without one;
 * `no_token`/`http_error`/`network_error` must never be read as "0 real
 * vacancies" (see the market-reality brief's error-handling requirement).
 */
export type HhFetchResult<T> =
  | { status: "ok"; data: T }
  | { status: "no_token" }
  | { status: "http_error"; httpStatus: number }
  | { status: "network_error" };

export async function fetchHhAuthed<T>(url: URL, accessToken: string | undefined): Promise<HhFetchResult<T>> {
  if (!accessToken) return { status: "no_token" };
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": HH_USER_AGENT, Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return { status: "http_error", httpStatus: response.status };
    return { status: "ok", data: (await response.json()) as T };
  } catch {
    return { status: "network_error" };
  }
}
