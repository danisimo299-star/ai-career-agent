import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { seededPick } from "@/lib/career/seeded-random";
import { professionCatalog } from "./mock-data";
import { resolveOptionLabel } from "./questionnaire-copy";
import type { CoachIntent, CoachReplyContext, CoachReplyResult } from "./types";

/**
 * No network call — but deliberately NOT a single static template per
 * intent either. This is what actually runs by default (`AI_PROVIDER=mock`),
 * so it's the thing a "feels like a chatbot" complaint would be reacting
 * to: varied phrasing (seeded on the message + turn count, so repeat calls
 * aren't byte-identical but stay deterministic/testable), a genuine
 * two-turn "help me choose a career" flow grounded in the real profession
 * catalog, lightweight preference memory, and an off-topic/joke escape
 * hatch — all still bounded, honest, and free of any fabricated fact.
 */

const JOKE_KEYWORDS = ["joke", "анекдот", "пошути", "рассмеши", "funny"];

const UNCERTAIN_KEYWORDS = [
  "not sure",
  "don't know what",
  "dont know what",
  "no idea what",
  "which career",
  "which profession",
  "help me choose",
  "choose a career",
  "не знаю какую",
  "не уверен",
  "не уверена",
  "какую профессию",
  "помоги выбрать",
  "выбрать профессию",
];

const SALARY_REASONING_PATTERNS = [
  /\b(because|since)\b.{0,40}\b(money|pay|salary|makes? a lot|high salary)\b/i,
  /потому что.{0,40}(денег|зарплат|платят)/i,
];

function mentionsSalaryDrivenReasoning(message: string): boolean {
  return SALARY_REASONING_PATTERNS.some((p) => p.test(message));
}

const NEGATIVE_PREFERENCE_PATTERNS = [
  /\bi (?:don't|do not|dont) want (?:a job )?(?:where |to )?(.+?)[.!]?$/i,
  /\bi'?d rather (?:not |avoid )(.+?)[.!]?$/i,
  /\bi hate (.+?)[.!]?$/i,
  /не хочу (.+?)[.!?]?$/i,
  /не люблю (.+?)[.!?]?$/i,
  /терпеть не могу (.+?)[.!?]?$/i,
];

const CLARIFY_MARKER = "__career_clarify__";

/**
 * `CLARIFY_MARKER` is persisted as part of the assistant message content so
 * the NEXT turn can detect "I just asked the clarifying question" from
 * history alone — but it must never reach the user. Every place that reads
 * a coach message for display (fresh replies and reloaded history alike)
 * has to run content through this first.
 */
export function stripCoachDisplayMarkers(content: string): string {
  return content.replace(CLARIFY_MARKER, "").trimEnd();
}

interface InterestDimension {
  key: string;
  tags: string[];
  keywords: string[];
}

const INTEREST_DIMENSIONS: InterestDimension[] = [
  { key: "problems", tags: ["science", "engineering"], keywords: ["problem", "задач", "проблем", "solving", "решен"] },
  { key: "products", tags: ["programming", "business"], keywords: ["product", "продукт", "build", "созда", "building"] },
  { key: "data", tags: ["science", "programming"], keywords: ["data", "данны", "analy"] },
  { key: "tech", tags: ["programming", "science"], keywords: ["experiment", "эксперимент", "technolog", "технолог"] },
];

function detectInterestDimension(message: string): InterestDimension | null {
  const lower = message.toLowerCase();
  return INTEREST_DIMENSIONS.find((d) => d.keywords.some((kw) => lower.includes(kw))) ?? null;
}

function professionsForTags(tags: string[], locale: Locale, limit = 3): string[] {
  return professionCatalog
    .filter((p) => p.interestTags.some((t) => tags.includes(t)))
    .slice(0, limit)
    .map((p) => p.title[locale]);
}

function extractNegativePreference(message: string): string | null {
  for (const pattern of NEGATIVE_PREFERENCE_PATTERNS) {
    const match = message.match(pattern);
    if (match?.[1] && match[1].trim().length > 2 && match[1].trim().length < 120) {
      return match[1].trim();
    }
  }
  return null;
}

const INTENT_KEYWORDS: Record<Exclude<CoachIntent, "general">, string[]> = {
  jobs: ["job", "vacan", "работ", "вакан"],
  resume: ["resume", "cv", "резюме"],
  interview: ["interview", "собеседован", "интервью"],
  skillGap: ["skill", "gap", "навык", "пробел", "not ready", "why am i not", "не готов", "почему я не гот"],
  roadmap: ["roadmap", "дорожн", "план обучения", "learn", "изуч"],
  compareCareers: ["compare", "сравни", "vs ", " или "],
  nextAction: ["next", "чем заняться", "что делать", "what should i do"],
  applications: ["applic", "отклик", "заявк"],
};

function classifyIntent(message: string): CoachIntent {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [Exclude<CoachIntent, "general">, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return intent;
  }
  return "general";
}

const JOKES: Record<Locale, string[]> = {
  en: [
    "Why did the developer go broke? Because he used up all his cache.",
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "How many programmers does it take to change a light bulb? None — that's a hardware problem.",
  ],
  ru: [
    "Почему программист всегда мёрзнет? Потому что живёт в open space.",
    "Заходит программист в лифт. Лифт спрашивает: «Куда?» Программист: «Наверх». Лифт: «Ошибка 404, этаж не найден».",
    "Сколько программистов нужно, чтобы вкрутить лампочку? Ни одного — это баг в железе, а не в коде.",
  ],
};

const CLARIFY_QUESTION: Record<Locale, (activity: string | null) => string> = {
  en: (activity) =>
    `${activity ? `That's actually useful — liking ${activity} tells me something.` : "That's useful to know."} What do you enjoy most: solving difficult problems, building products, working with data, or experimenting with new technology? ${CLARIFY_MARKER}`,
  ru: (activity) =>
    `${activity ? `Это правда полезная информация — то, что тебе нравится ${activity}, уже кое-что говорит.` : "Это полезно знать."} Что тебе больше всего по душе: решать сложные задачи, создавать продукты, работать с данными или экспериментировать с новыми технологиями? ${CLARIFY_MARKER}`,
};

function extractLikedActivity(message: string): string | null {
  const patterns = [/\bi like (.+?)(?:,| but| however|\.|$)/i, /\bi enjoy (.+?)(?:,| but| however|\.|$)/i, /мне нравится (.+?)(?:,| но|\.|$)/i];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1] && match[1].trim().length > 1 && match[1].trim().length < 60) return match[1].trim();
  }
  return null;
}

function lastAssistantAskedClarifyingQuestion(ctx: CoachReplyContext): boolean {
  const lastAssistant = [...ctx.history].reverse().find((t) => t.role === "assistant");
  return Boolean(lastAssistant?.content.includes(CLARIFY_MARKER));
}

function seed(ctx: CoachReplyContext, salt: string): string {
  return `${ctx.message}:${ctx.history.length}:${salt}`;
}

const REPLIES: Record<CoachIntent, (ctx: CoachReplyContext) => Record<Locale, string[]>> = {
  jobs: (ctx) => {
    const role = ctx.snapshot.targetRole;
    const city = ctx.snapshot.city;
    const count = ctx.snapshot.matchingJobsCount;
    return {
      en: role
        ? [
            `I have ${role}${city ? ` in ${city}` : ""} as your target — ${count > 0 ? `there are ${count} real matches waiting for you` : "let's search and see what's out there"}.`,
            `Sure. Your profile points at ${role}${city ? ` around ${city}` : ""}, so that's what I'll pull up — match scores are computed from your real skills, not a guess.`,
          ]
        : [`I don't have a target profession for you yet — set one via Career Analysis and I can pull up real matching jobs right away.`],
      ru: role
        ? [
            `У тебя сейчас цель — «${role}»${city ? ` в городе ${city}` : ""} — ${count > 0 ? `там уже есть ${count} реальных подходящих вакансий` : "давай поищем, что там есть"}.`,
            `Конечно. Твой профиль указывает на «${role}»${city ? `, район ${city}` : ""} — покажу именно это; оценка соответствия считается по твоим реальным навыкам, не на глаз.`,
          ]
        : [`У тебя пока нет целевой профессии — выбери её через Анализ карьеры, и я сразу покажу подходящие вакансии.`],
    };
  },
  resume: (ctx) => ({
    en:
      ctx.snapshot.resumeScore !== null
        ? [
            `Your resume's sitting at ${ctx.snapshot.resumeScore}/100 right now. Want me to point out what's holding it back?`,
            `At ${ctx.snapshot.resumeScore}/100, your resume has room to grow — the builder has specific, concrete suggestions.`,
          ]
        : [`You haven't built a resume yet — that's genuinely one of the highest-leverage things you could do this week.`],
    ru:
      ctx.snapshot.resumeScore !== null
        ? [
            `Сейчас твоё резюме на отметке ${ctx.snapshot.resumeScore}/100. Показать, что именно его тормозит?`,
            `${ctx.snapshot.resumeScore}/100 — есть куда расти, в конструкторе есть конкретные рекомендации.`,
          ]
        : [`У тебя ещё нет резюме — это реально один из самых полезных шагов, которые можно сделать на этой неделе.`],
  }),
  interview: (ctx) => ({
    en:
      ctx.snapshot.interviewAverageScore !== null
        ? [`Your mock interviews average ${ctx.snapshot.interviewAverageScore}/100 so far — another round would help push that further.`]
        : [`You haven't run a mock interview yet. A short session would give you a real read on where you stand.`],
    ru:
      ctx.snapshot.interviewAverageScore !== null
        ? [`Средний балл за тренировочные собеседования — ${ctx.snapshot.interviewAverageScore}/100. Ещё один раунд поможет его подтянуть.`]
        : [`Ты ещё не проходил(а) тренировочное собеседование. Короткая сессия покажет реальный уровень.`],
  }),
  skillGap: (ctx) => ({
    en: ctx.snapshot.skillGapPercent !== null
      ? [
          `For ${ctx.snapshot.targetRole}, you're missing about ${ctx.snapshot.skillGapPercent}% of what's typically asked for${ctx.snapshot.topMissingSkills.length > 0 ? ` — mainly ${ctx.snapshot.topMissingSkills.slice(0, 3).join(", ")}` : ""}.${ctx.snapshot.careerReadiness !== null ? ` That's part of why your overall readiness sits at ${ctx.snapshot.careerReadiness}% right now.` : ""}`,
        ]
      : [`Set a target profession first — then I can compare your real skills against what it actually requires, not a guess.`],
    ru: ctx.snapshot.skillGapPercent !== null
      ? [
          `Для «${ctx.snapshot.targetRole}» тебе не хватает примерно ${ctx.snapshot.skillGapPercent}% от типичных требований${ctx.snapshot.topMissingSkills.length > 0 ? ` — в основном это ${ctx.snapshot.topMissingSkills.slice(0, 3).join(", ")}` : ""}.${ctx.snapshot.careerReadiness !== null ? ` Отчасти поэтому твоя общая готовность сейчас ${ctx.snapshot.careerReadiness}%.` : ""}`,
        ]
      : [`Сначала выбери целевую профессию — тогда я сравню твои реальные навыки с требованиями, а не на глаз.`],
  }),
  roadmap: () => ({
    en: [`Your roadmap breaks the path into concrete milestones — open it and I'll show you exactly what's next.`],
    ru: [`Твоя дорожная карта разбита на конкретные этапы — открой её, покажу, что дальше.`],
  }),
  compareCareers: () => ({
    en: [`Let's look at a few paths side by side — fit, skill gap, and real job availability for each. No single answer forced on you.`],
    ru: [`Давай посмотрим на несколько направлений рядом — соответствие, разрыв в навыках и реальную доступность вакансий по каждому. Без навязанного единственного варианта.`],
  }),
  nextAction: (ctx) => {
    const insight = ctx.snapshot.proactiveInsight;
    const insightEn = insight ? ` Actually — ${insight.jobCount} of the jobs you've saved need ${insight.skill}, which isn't in your profile yet. That might be worth more than my default suggestion.` : "";
    const insightRu = insight ? ` Кстати — ${insight.jobCount} сохранённых вакансий требуют «${insight.skill}», а этого нет в твоём профиле. Возможно, это важнее, чем то, что предлагаю по умолчанию.` : "";
    return {
      en: ctx.snapshot.nextActionTitle
        ? [`Right now, your best move is: ${ctx.snapshot.nextActionTitle}.${insightEn}`]
        : [`Complete your profile, generate a roadmap, or run a career analysis — once one of those exists, I'll have a concrete next step for you.`],
      ru: ctx.snapshot.nextActionTitle
        ? [`Сейчас твой лучший следующий шаг — «${ctx.snapshot.nextActionTitle}».${insightRu}`]
        : [`Заполни профиль, сгенерируй дорожную карту или пройди анализ карьеры — тогда я предложу конкретный следующий шаг.`],
    };
  },
  applications: (ctx) => ({
    en: [`You've got ${ctx.snapshot.applications} application${ctx.snapshot.applications === 1 ? "" : "s"}, ${ctx.snapshot.interviews} interview${ctx.snapshot.interviews === 1 ? "" : "s"}, and ${ctx.snapshot.offers} offer${ctx.snapshot.offers === 1 ? "" : "s"} on record.`],
    ru: [`Сейчас отслеживается: откликов — ${ctx.snapshot.applications}, собеседований — ${ctx.snapshot.interviews}, офферов — ${ctx.snapshot.offers}.`],
  }),
  general: (ctx) => ({
    en: [
      `I can help with jobs, your resume, interview prep, skill gaps, or figuring out what's next.${ctx.snapshot.targetRole ? ` Right now you're working toward ${ctx.snapshot.targetRole}.` : ""}`,
      `Happy to dig into whatever's on your mind — career direction, your resume, interviews, or the job search itself.`,
    ],
    ru: [
      `Могу помочь с вакансиями, резюме, подготовкой к собеседованию, разрывом в навыках или тем, что делать дальше.${ctx.snapshot.targetRole ? ` Сейчас ты движешься к цели: «${ctx.snapshot.targetRole}».` : ""}`,
      `Готов(а) обсудить всё, что важно — карьерное направление, резюме, собеседования или сам поиск работы.`,
    ],
  }),
};

export function buildMockCoachReply(input: CoachReplyContext): CoachReplyResult {
  const lower = input.message.toLowerCase();

  // --- Off-topic escape hatch: brief, natural, then back to career context ---
  if (JOKE_KEYWORDS.some((kw) => lower.includes(kw))) {
    const joke = seededPick(JOKES[input.locale], seed(input, "joke"));
    const bridge =
      input.locale === "ru"
        ? input.snapshot.targetRole
          ? ` А теперь вернёмся к делу — ты движешься к «${input.snapshot.targetRole}», хочешь обсудить следующий шаг?`
          : ` А теперь вернёмся к твоей карьере — с чего начнём?`
        : input.snapshot.targetRole
          ? ` Now, back to your career — you're working toward ${input.snapshot.targetRole}. Want to talk about the next step?`
          : ` Now, back to your career — where should we start?`;
    return { reply: `${joke}${bridge}`, intent: "general", memoryFact: null };
  }

  // --- Don't just agree: salary-only reasoning gets a grounded, honest pushback, never a blank "are you sure?" ---
  if (mentionsSalaryDrivenReasoning(input.message)) {
    const dict = getDictionary(input.locale);
    const otherPriority = input.snapshot.careerPriorities.find((p) => p !== "salary");
    const otherLabel = otherPriority ? resolveOptionLabel("priorities", otherPriority, dict) : null;
    const reply =
      input.locale === "ru"
        ? `Зарплата — это важно, но я бы не выбирал(а) карьеру только из-за неё.${otherLabel ? ` Ты говорил(а), что тебе важно «${otherLabel}» — стоит сравнить варианты и с этой стороны, а не только по деньгам.` : " Стоит также посмотреть, насколько это направление подходит тебе по интересам и сильным сторонам — не только по деньгам."}`
        : `Salary's worth weighing, but I wouldn't choose a career on that alone.${otherLabel ? ` You mentioned "${otherLabel}" mattered to you too — worth comparing options on that basis, not just the paycheck.` : " Worth also weighing how well it actually fits your interests and strengths, not just the number."}`;
    return { reply, intent: "compareCareers", memoryFact: null };
  }

  // --- Turn 2 of the career-uncertainty flow: previous reply asked the clarifying question ---
  if (lastAssistantAskedClarifyingQuestion(input)) {
    const dimension = detectInterestDimension(input.message);
    if (dimension) {
      const options = professionsForTags(dimension.tags, input.locale);
      if (options.length > 0) {
        const [first, second] = options;
        const reply =
          input.locale === "ru"
            ? `Тогда предлагаю рассмотреть ${options.join(", ")}. Что звучит интереснее: ${first}${second ? ` или ${second}` : ""}?`
            : `Then I'd like to explore ${options.join(", ")} with you. Which sounds more interesting: ${first}${second ? ` or ${second}` : ""}?`;
        return { reply, intent: "compareCareers", memoryFact: null };
      }
    }
  }

  // --- Turn 1: user expresses career uncertainty ---
  if (UNCERTAIN_KEYWORDS.some((kw) => lower.includes(kw)) || (lower.includes("like") && lower.includes("not sure"))) {
    const activity = extractLikedActivity(input.message);
    return { reply: CLARIFY_QUESTION[input.locale](activity), intent: "general", memoryFact: null };
  }

  // --- Memory extraction: an explicit negative preference statement ---
  const negativePreference = extractNegativePreference(input.message);
  const memoryFact =
    negativePreference && negativePreference.length > 3
      ? input.locale === "ru"
        ? `Предпочитает избегать: ${negativePreference}`
        : `Prefers to avoid: ${negativePreference}`
      : null;

  const intent = classifyIntent(input.message);
  const variants = REPLIES[intent](input)[input.locale];
  let reply = seededPick(variants, seed(input, intent));

  const relevantPreference = input.snapshot.careerPreferences[0];
  if (relevantPreference && (intent === "compareCareers" || intent === "general") && !memoryFact) {
    reply += input.locale === "ru" ? ` Учитывая, что ты говорил(а): «${relevantPreference}», это тоже стоит держать в голове.` : ` Worth keeping in mind what you mentioned before: "${relevantPreference}".`;
  }

  return { reply, intent, memoryFact };
}
