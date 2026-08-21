/**
 * Every external "open this vacancy" link ultimately traces back to either
 * a URL we constructed ourselves (`buildHhSearchUrl`) or one reported by a
 * real provider's API response (`HhJobsProvider`'s `alternate_url`) —
 * never raw user input. Still validated at both ends (write time in
 * `job.schema.ts`, read/render time here) so a malformed or malicious
 * provider response, or a hand-crafted API request, can never end up as a
 * clickable `javascript:`/`data:`/`file:` link in the UI.
 */
export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const TRUSTED_HH_HOSTS = ["hh.ru", "www.hh.ru"];

/** Stricter check for URLs claimed to be a real HH.ru vacancy/search page — the domain must actually be hh.ru. */
export function isTrustedHhUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return TRUSTED_HH_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
