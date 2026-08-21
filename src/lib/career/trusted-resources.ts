export interface TrustedResource {
  title: string;
  url: string;
  provider: string;
  type: "YOUTUBE" | "DOCUMENTATION" | "COURSE" | "BOOK" | "ARTICLE";
}

/**
 * A deliberately small, hand-verified allowlist — official docs / well-known
 * homepages whose URLs are stable and real. Never extend this with an
 * AI-suggested or guessed URL: anything not in here stays unverified
 * (`url: null`) rather than risk linking somewhere that doesn't exist.
 */
const trustedCatalog: Record<string, TrustedResource> = {
  python: { title: "Python Official Documentation", url: "https://docs.python.org/3/", provider: "Python Software Foundation", type: "DOCUMENTATION" },
  sql: { title: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/", provider: "PostgreSQL", type: "DOCUMENTATION" },
  databases: { title: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/", provider: "PostgreSQL", type: "DOCUMENTATION" },
  javascript: { title: "JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", provider: "MDN Web Docs", type: "DOCUMENTATION" },
  css: { title: "CSS Documentation", url: "https://developer.mozilla.org/en-US/docs/Web/CSS", provider: "MDN Web Docs", type: "DOCUMENTATION" },
  react: { title: "React Documentation", url: "https://react.dev/learn", provider: "React", type: "DOCUMENTATION" },
  git: { title: "Git Documentation", url: "https://git-scm.com/doc", provider: "Git", type: "DOCUMENTATION" },
  "apis": { title: "MDN — Working with APIs", url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs", provider: "MDN Web Docs", type: "DOCUMENTATION" },
  api: { title: "MDN — Working with APIs", url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs", provider: "MDN Web Docs", type: "DOCUMENTATION" },
  linux: { title: "Linux Documentation Project", url: "https://tldp.org/", provider: "The Linux Documentation Project", type: "DOCUMENTATION" },
  "базы данных": { title: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/", provider: "PostgreSQL", type: "DOCUMENTATION" },
};

export function lookupTrustedResource(skillOrTopic: string): TrustedResource | null {
  return trustedCatalog[skillOrTopic.trim().toLowerCase()] ?? null;
}
