/**
 * Reusable skill-normalization service. Job matching, resume-vacancy
 * comparison, and the AI search assistant all need to treat "Python
 * developer" / "Python" / "Python programming" as the same skill — this is
 * the single place that mapping lives, so it can't drift between features.
 */

const SUFFIX_PATTERN =
  /\b(developer|engineer|programming|разработчик|разработка|программирование|инженер|специалист)\b/g;

/** variant (already lowercased, suffix-stripped) -> canonical id */
const SKILL_ALIASES: Record<string, string> = {
  python: "python",
  py: "python",
  javascript: "javascript",
  js: "javascript",
  "java script": "javascript",
  typescript: "typescript",
  ts: "typescript",
  postgres: "postgresql",
  postgresql: "postgresql",
  "postgre sql": "postgresql",
  mysql: "mysql",
  "my sql": "mysql",
  sql: "sql",
  react: "react",
  reactjs: "react",
  "react.js": "react",
  "react js": "react",
  vue: "vue",
  vuejs: "vue",
  "vue.js": "vue",
  angular: "angular",
  node: "nodejs",
  nodejs: "nodejs",
  "node.js": "nodejs",
  "node js": "nodejs",
  golang: "go",
  go: "go",
  html: "html",
  css: "css",
  figma: "figma",
  excel: "excel",
  seo: "seo",
  git: "git",
  docker: "docker",
  kubernetes: "kubernetes",
  k8s: "kubernetes",
  api: "apis",
  apis: "apis",
  rest: "apis",
  "rest api": "apis",
  ml: "machine learning",
  "machine learning": "machine learning",
  "машинное обучение": "machine learning",
  databases: "databases",
  "базы данных": "databases",
  analytics: "analytics",
  аналитика: "analytics",
  communication: "communication",
  коммуникация: "communication",
};

function stripSuffixes(value: string): string {
  return value.replace(SUFFIX_PATTERN, "").replace(/\s+/g, " ").trim();
}

/** Lowercases, strips a common role/skill suffix, and resolves known aliases to one canonical id. */
export function normalizeSkill(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (SKILL_ALIASES[cleaned]) return SKILL_ALIASES[cleaned];

  const stripped = stripSuffixes(cleaned);
  if (SKILL_ALIASES[stripped]) return SKILL_ALIASES[stripped];

  return stripped || cleaned;
}

export function normalizeSkills(raws: string[]): string[] {
  const seen = new Set<string>();
  for (const raw of raws) {
    const normalized = normalizeSkill(raw);
    if (normalized) seen.add(normalized);
  }
  return Array.from(seen);
}

export interface SkillComparison {
  matched: string[];
  missing: string[];
}

/** Compares a user's known skills against a vacancy's (or catalog's) required skills, both normalized first. */
export function compareSkills(userSkills: string[], requiredSkills: string[]): SkillComparison {
  const normalizedUser = new Set(normalizeSkills(userSkills));
  const normalizedRequired = normalizeSkills(requiredSkills);

  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of normalizedRequired) {
    if (normalizedUser.has(skill)) matched.push(skill);
    else missing.push(skill);
  }
  return { matched, missing };
}
