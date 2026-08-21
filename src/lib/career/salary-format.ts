import type { Locale } from "@/lib/i18n/config";

export type SalaryDisplayKind = "range" | "from" | "to" | "undisclosed";

export interface SalaryDisplay {
  kind: SalaryDisplayKind;
  min?: string;
  max?: string;
  currencySymbol?: string;
}

function currencySymbolFor(currency?: string | null): string {
  switch ((currency ?? "").toUpperCase()) {
    case "RUR":
    case "RUB":
      return "₽";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "KZT":
      return "₸";
    case "BYR":
    case "BYN":
      return "Br";
    default:
      return currency ?? "";
  }
}

function formatAmount(value: number, locale: Locale): string {
  return value.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");
}

/**
 * Deterministic — displays exactly what the source reported, never an
 * estimate. `min`/`max` come straight from the vacancy (or `undefined` if
 * the source didn't provide them); `undisclosed` is the only case where
 * neither is present, which the UI renders as "по договорённости" /
 * "salary not disclosed" rather than inventing a number.
 */
export function formatSalary(min: number | undefined, max: number | undefined, currency: string | undefined, locale: Locale): SalaryDisplay {
  const symbol = currencySymbolFor(currency);
  if (min && max) return { kind: "range", min: formatAmount(min, locale), max: formatAmount(max, locale), currencySymbol: symbol };
  if (min) return { kind: "from", min: formatAmount(min, locale), currencySymbol: symbol };
  if (max) return { kind: "to", max: formatAmount(max, locale), currencySymbol: symbol };
  return { kind: "undisclosed" };
}
