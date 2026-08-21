import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "./config";

function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;

  const preferred = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter((tag): tag is string => Boolean(tag));

  for (const tag of preferred) {
    const primary = tag.split("-")[0];
    if (primary && isLocale(primary)) return primary;
  }

  return null;
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(localeCookieName)?.value;
  if (cookieValue && isLocale(cookieValue)) return cookieValue;

  const headerStore = await headers();
  const detected = parseAcceptLanguage(headerStore.get("accept-language"));

  return detected ?? defaultLocale;
}
