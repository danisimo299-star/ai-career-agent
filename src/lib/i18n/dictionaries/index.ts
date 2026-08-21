import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { ru } from "./ru";

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
