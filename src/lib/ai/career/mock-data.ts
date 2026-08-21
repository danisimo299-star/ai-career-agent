import type { Locale } from "@/lib/i18n/config";

interface ProfessionTemplate {
  key: string;
  interestTags: string[];
  title: Record<Locale, string>;
  reasoning: Record<Locale, string>;
  skills: Record<Locale, string[]>;
  /** Canonical, locale-independent skill identifiers — the ones `skill-tasks.ts` / `trusted-resources.ts` are keyed by. */
  skillKeys: string[];
  learningTimeMonths: number;
  growthPotential: "LOW" | "MEDIUM" | "HIGH";
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
}

export const professionCatalog: ProfessionTemplate[] = [
  {
    key: "backend-developer",
    interestTags: ["programming"],
    title: { en: "Backend Developer", ru: "Backend-разработчик" },
    reasoning: {
      en: "You enjoy logic, technology, and problem solving — backend work is built on exactly that.",
      ru: "Тебе нравится логика, технологии и решение задач — именно на этом строится backend-разработка.",
    },
    skills: { en: ["Python", "SQL", "Databases", "APIs"], ru: ["Python", "SQL", "Базы данных", "API"] },
    skillKeys: ["python", "sql", "databases", "apis"],
    learningTimeMonths: 8,
    growthPotential: "HIGH",
    difficultyLevel: "MEDIUM",
  },
  {
    key: "frontend-developer",
    interestTags: ["programming", "design"],
    title: { en: "Frontend Developer", ru: "Frontend-разработчик" },
    reasoning: {
      en: "You combine an eye for detail with technical thinking — frontend sits right at that intersection.",
      ru: "Ты сочетаешь внимание к деталям с техническим мышлением — фронтенд как раз на этом стыке.",
    },
    skills: { en: ["JavaScript", "React", "CSS", "UI basics"], ru: ["JavaScript", "React", "CSS", "Основы UI"] },
    skillKeys: ["javascript", "react", "css", "ui basics"],
    learningTimeMonths: 6,
    growthPotential: "HIGH",
    difficultyLevel: "MEDIUM",
  },
  {
    key: "ai-engineer",
    interestTags: ["programming", "science"],
    title: { en: "AI Engineer", ru: "AI-инженер" },
    reasoning: {
      en: "You combine technical depth with curiosity about how intelligent systems work.",
      ru: "Ты сочетаешь техническую глубину с любопытством к тому, как устроены интеллектуальные системы.",
    },
    skills: {
      en: ["Python", "Machine Learning", "Data Pipelines", "APIs"],
      ru: ["Python", "Машинное обучение", "Пайплайны данных", "API"],
    },
    skillKeys: ["python", "machine learning", "data pipelines", "apis"],
    learningTimeMonths: 10,
    growthPotential: "HIGH",
    difficultyLevel: "HARD",
  },
  {
    key: "ux-ui-designer",
    interestTags: ["design"],
    title: { en: "UX/UI Designer", ru: "UX/UI-дизайнер" },
    reasoning: {
      en: "You care how things look and feel to use — that instinct is the core of product design.",
      ru: "Тебе важно, как всё выглядит и ощущается в использовании — это и есть суть продуктового дизайна.",
    },
    skills: { en: ["Figma", "User research", "Prototyping", "Visual design"], ru: ["Figma", "Исследования пользователей", "Прототипирование", "Визуальный дизайн"] },
    skillKeys: ["figma", "user research", "prototyping", "visual design"],
    learningTimeMonths: 6,
    growthPotential: "MEDIUM",
    difficultyLevel: "EASY",
  },
  {
    key: "product-manager",
    interestTags: ["business"],
    title: { en: "Product Manager", ru: "Продакт-менеджер" },
    reasoning: {
      en: "You like connecting the dots between people, goals, and outcomes — product work is built on that.",
      ru: "Тебе нравится связывать людей, цели и результат — на этом строится продуктовый менеджмент.",
    },
    skills: { en: ["Prioritization", "Analytics", "Communication", "Roadmapping"], ru: ["Приоритизация", "Аналитика", "Коммуникация", "Планирование"] },
    skillKeys: ["prioritization", "analytics", "communication", "roadmapping"],
    learningTimeMonths: 9,
    growthPotential: "HIGH",
    difficultyLevel: "HARD",
  },
  {
    key: "marketing-specialist",
    interestTags: ["marketing"],
    title: { en: "Marketing Specialist", ru: "Маркетолог" },
    reasoning: {
      en: "You're drawn to understanding people and communicating ideas persuasively.",
      ru: "Тебе интересно понимать людей и убедительно доносить идеи.",
    },
    skills: { en: ["SEO", "Content strategy", "Analytics", "Copywriting"], ru: ["SEO", "Контент-стратегия", "Аналитика", "Копирайтинг"] },
    skillKeys: ["seo", "content strategy", "analytics", "copywriting"],
    learningTimeMonths: 5,
    growthPotential: "MEDIUM",
    difficultyLevel: "EASY",
  },
  {
    key: "financial-analyst",
    interestTags: ["finance", "business"],
    title: { en: "Financial Analyst", ru: "Финансовый аналитик" },
    reasoning: {
      en: "You think in numbers and structure — finance rewards exactly that kind of precision.",
      ru: "Ты мыслишь цифрами и структурой — финансы вознаграждают именно такую точность.",
    },
    skills: { en: ["Excel", "Financial modeling", "Accounting basics", "SQL"], ru: ["Excel", "Финансовое моделирование", "Основы бухучёта", "SQL"] },
    skillKeys: ["excel", "financial modeling", "accounting basics", "sql"],
    learningTimeMonths: 7,
    growthPotential: "MEDIUM",
    difficultyLevel: "MEDIUM",
  },
  {
    key: "data-analyst",
    interestTags: ["science", "engineering", "programming"],
    title: { en: "Data Analyst", ru: "Аналитик данных" },
    reasoning: {
      en: "You like finding patterns and evidence-backed answers — data work is that, professionally.",
      ru: "Тебе нравится находить закономерности и обоснованные ответы — аналитика данных это именно это.",
    },
    skills: { en: ["SQL", "Python", "Statistics", "Data visualization"], ru: ["SQL", "Python", "Статистика", "Визуализация данных"] },
    skillKeys: ["sql", "python", "statistics", "data visualization"],
    learningTimeMonths: 6,
    growthPotential: "HIGH",
    difficultyLevel: "MEDIUM",
  },
  {
    key: "systems-engineer",
    interestTags: ["engineering"],
    title: { en: "Systems Engineer", ru: "Системный инженер" },
    reasoning: {
      en: "You like understanding how complex systems fit together and keeping them running.",
      ru: "Тебе нравится понимать, как устроены сложные системы, и поддерживать их работу.",
    },
    skills: { en: ["Linux", "Networking", "Cloud basics", "Scripting"], ru: ["Linux", "Сети", "Основы облаков", "Скрипты"] },
    skillKeys: ["linux", "networking", "cloud basics", "scripting"],
    learningTimeMonths: 9,
    growthPotential: "MEDIUM",
    difficultyLevel: "HARD",
  },
  {
    key: "legal-analyst",
    interestTags: ["law"],
    title: { en: "Legal Analyst", ru: "Юридический аналитик" },
    reasoning: {
      en: "You're comfortable with structured reasoning and precise language — law rewards both.",
      ru: "Тебе близко структурное мышление и точность формулировок — право ценит и то, и другое.",
    },
    skills: { en: ["Legal research", "Contract review", "Writing", "Compliance basics"], ru: ["Юридические исследования", "Работа с договорами", "Письмо", "Основы комплаенса"] },
    skillKeys: ["legal research", "contract review", "writing", "compliance basics"],
    learningTimeMonths: 12,
    growthPotential: "LOW",
    difficultyLevel: "HARD",
  },
  {
    key: "health-data-coordinator",
    interestTags: ["medicine"],
    title: { en: "Health Data Coordinator", ru: "Координатор медицинских данных" },
    reasoning: {
      en: "You're interested in medicine and comfortable with structured, careful work.",
      ru: "Тебе интересна медицина, и тебе близка аккуратная, структурированная работа.",
    },
    skills: { en: ["Medical terminology", "Data entry systems", "Attention to detail", "Compliance"], ru: ["Медицинская терминология", "Системы учёта данных", "Внимательность", "Комплаенс"] },
    skillKeys: ["medical terminology", "data entry systems", "attention to detail", "compliance"],
    learningTimeMonths: 6,
    growthPotential: "MEDIUM",
    difficultyLevel: "EASY",
  },
  {
    key: "instructional-designer",
    interestTags: ["education"],
    title: { en: "Instructional Designer", ru: "Методист образовательных программ" },
    reasoning: {
      en: "You like helping others learn and structuring information clearly.",
      ru: "Тебе нравится помогать другим учиться и ясно структурировать информацию.",
    },
    skills: { en: ["Curriculum design", "Communication", "Basic UX", "Writing"], ru: ["Разработка программ обучения", "Коммуникация", "Основы UX", "Письмо"] },
    skillKeys: ["curriculum design", "communication", "basic ux", "writing"],
    learningTimeMonths: 5,
    growthPotential: "MEDIUM",
    difficultyLevel: "EASY",
  },
  {
    key: "project-coordinator",
    interestTags: ["other", "business", "marketing"],
    title: { en: "Project Coordinator", ru: "Координатор проектов" },
    reasoning: {
      en: "You're organized and enjoy keeping many moving pieces on track — this role is built on that.",
      ru: "Ты организован(а) и умеешь удерживать в фокусе много задач одновременно — эта роль как раз про это.",
    },
    skills: { en: ["Organization", "Communication", "Tools (Notion/Jira)", "Time management"], ru: ["Организация", "Коммуникация", "Инструменты (Notion/Jira)", "Тайм-менеджмент"] },
    skillKeys: ["organization", "communication", "tools", "time management"],
    learningTimeMonths: 4,
    growthPotential: "MEDIUM",
    difficultyLevel: "EASY",
  },
];

export const careerOptions = professionCatalog.map((p) => ({ key: p.key, title: p.title }));

export function findProfessionByKey(key: string): ProfessionTemplate | undefined {
  return professionCatalog.find((p) => p.key === key);
}

export function findProfessionByTitle(title: string, locale: Locale): ProfessionTemplate | undefined {
  return professionCatalog.find((p) => p.title[locale].toLowerCase() === title.trim().toLowerCase());
}

export const insightTemplates: Record<Locale, string[]> = {
  en: [
    "You show strong analytical abilities — you naturally look for patterns and reasons.",
    "You may enjoy working with technology and structured problems.",
    "You seem to prefer environments with clear structure and expectations.",
    "You communicate your thinking clearly, which is a strong foundation for collaborative roles.",
    "You show curiosity about how things work — a good sign for fast learning in a new field.",
    "You value responsibility and follow-through, which stands out to employers early in a career.",
    "You're drawn to creative problem solving rather than repetitive tasks.",
    "You seem comfortable taking initiative rather than waiting for direction.",
  ],
  ru: [
    "У тебя хорошо развиты аналитические способности — ты естественно ищешь закономерности и причины.",
    "Похоже, тебе может понравиться работа с технологиями и структурированными задачами.",
    "Кажется, тебе комфортнее в средах с чёткой структурой и понятными ожиданиями.",
    "Ты ясно формулируешь свои мысли — это хорошая основа для командных ролей.",
    "У тебя заметно любопытство к тому, как всё устроено — хороший знак для быстрого обучения в новой области.",
    "Ты ценишь ответственность и доведение дел до конца — это заметно работодателям уже на старте карьеры.",
    "Тебя больше привлекает творческое решение задач, чем рутинные операции.",
    "Похоже, тебе комфортно брать инициативу на себя, а не ждать указаний.",
  ],
};
