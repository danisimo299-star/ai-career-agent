import type { Locale } from "@/lib/i18n/config";

export const generalQuestions: Record<Locale, string[]> = {
  en: [
    "Tell me a bit about yourself and what draws you to this role.",
    "Why are you interested in this position specifically?",
    "What do you consider your greatest professional strength?",
    "What's an area you're actively working to improve?",
    "Where do you see yourself professionally in a few years?",
    "What kind of work environment helps you do your best work?",
    "What questions do you have about this role or the team?",
  ],
  ru: [
    "Расскажи немного о себе и о том, что привлекает тебя в этой роли.",
    "Почему тебя интересует именно эта позиция?",
    "Что ты считаешь своей главной профессиональной сильной стороной?",
    "Над чем из своих качеств ты сейчас активно работаешь?",
    "Каким ты видишь себя профессионально через несколько лет?",
    "Какая рабочая среда помогает тебе работать лучше всего?",
    "Какие у тебя есть вопросы об этой роли или команде?",
  ],
};

export const behavioralQuestions: Record<Locale, string[]> = {
  en: [
    "Tell me about a time you worked closely with a difficult teammate. How did you handle it?",
    "Describe a situation where you disagreed with a decision made by your team or manager.",
    "Tell me about a time you took the lead on something without being asked.",
    "Describe a project or task that failed or didn't go as planned. What did you learn?",
    "Tell me about a time you had to motivate yourself through a long or tedious task.",
    "Describe a decision you made under time pressure with incomplete information.",
    "Tell me about a time you had to explain something technical to someone non-technical.",
  ],
  ru: [
    "Расскажи о случае, когда тебе пришлось тесно работать со сложным коллегой. Как ты с этим справился(лась)?",
    "Опиши ситуацию, когда ты не согласился(лась) с решением команды или руководителя.",
    "Расскажи о случае, когда ты взял(а) на себя инициативу без просьбы со стороны.",
    "Опиши проект или задачу, которая провалилась или пошла не по плану. Чему ты научился(лась)?",
    "Расскажи о случае, когда тебе нужно было мотивировать себя на долгую или рутинную задачу.",
    "Опиши решение, которое тебе пришлось принять под давлением времени и с неполной информацией.",
    "Расскажи о случае, когда тебе пришлось объяснять что-то техническое нетехническому человеку.",
  ],
};

export const hrQuestions: Record<Locale, string[]> = {
  en: [
    "What motivates you to do your best work?",
    "How do you handle stress or a heavy workload?",
    "What kind of feedback has helped you grow the most?",
    "Why are you looking to leave your current situation (studies/job)?",
    "What are your salary expectations for this role?",
    "How do you keep learning outside of formal education?",
  ],
  ru: [
    "Что мотивирует тебя работать в полную силу?",
    "Как ты справляешься со стрессом или большой нагрузкой?",
    "Какая обратная связь больше всего помогла тебе вырасти?",
    "Почему ты хочешь сменить текущую ситуацию (учёбу/работу)?",
    "Каковы твои ожидания по зарплате для этой роли?",
    "Как ты продолжаешь учиться вне формального образования?",
  ],
};

const technicalQuestionBank: Record<string, Record<Locale, string[]>> = {
  python: {
    en: [
      "What's the difference between a list and a tuple in Python, and when would you use each?",
      "How does Python's error handling work — walk me through a try/except you'd actually write.",
      "Describe a Python script or project you've built. What problem did it solve?",
    ],
    ru: [
      "В чём разница между списком и кортежем в Python, и когда что использовать?",
      "Как устроена обработка ошибок в Python — опиши try/except, который ты бы реально написал(а).",
      "Расскажи о скрипте или проекте на Python, который ты писал(а). Какую задачу он решал?",
    ],
  },
  sql: {
    en: [
      "Explain the difference between an INNER JOIN and a LEFT JOIN with a concrete example.",
      "How would you find duplicate rows in a table using SQL?",
      "When would you use a subquery instead of a JOIN, and why?",
    ],
    ru: [
      "Объясни разницу между INNER JOIN и LEFT JOIN на конкретном примере.",
      "Как бы ты нашёл(нашла) дубликаты строк в таблице с помощью SQL?",
      "Когда стоит использовать подзапрос вместо JOIN, и почему?",
    ],
  },
  javascript: {
    en: [
      "What's the difference between `==` and `===` in JavaScript?",
      "Explain how Promises and async/await relate to each other.",
      "How does closures work in JavaScript — can you give an example where you'd use one?",
    ],
    ru: [
      "В чём разница между `==` и `===` в JavaScript?",
      "Объясни, как Promise и async/await связаны между собой.",
      "Как работают замыкания (closures) в JavaScript — приведи пример, где ты бы их использовал(а)?",
    ],
  },
  react: {
    en: [
      "What's the difference between state and props in React?",
      "When would you reach for `useEffect`, and what's a mistake people commonly make with it?",
      "How would you decide whether a piece of UI should be its own component?",
    ],
    ru: [
      "В чём разница между state и props в React?",
      "Когда стоит использовать `useEffect`, и какую ошибку с ним часто допускают?",
      "Как ты решаешь, должен ли кусок интерфейса быть отдельным компонентом?",
    ],
  },
  css: {
    en: [
      "Explain the CSS box model in your own words.",
      "What's the difference between Flexbox and Grid, and when would you pick one over the other?",
      "How would you make a layout responsive without JavaScript?",
    ],
    ru: [
      "Объясни своими словами, что такое box model в CSS.",
      "В чём разница между Flexbox и Grid, и когда что выбрать?",
      "Как сделать адаптивную вёрстку без JavaScript?",
    ],
  },
  figma: {
    en: [
      "How do you use components and variants in Figma to keep a design system consistent?",
      "Walk me through how you'd hand off a design to a developer.",
      "How do you approach organizing frames and auto-layout in a larger project?",
    ],
    ru: [
      "Как ты используешь компоненты и варианты в Figma, чтобы дизайн-система оставалась согласованной?",
      "Опиши, как бы ты передавал(а) макет разработчику.",
      "Как ты подходишь к организации фреймов и авто-лейаута в большом проекте?",
    ],
  },
  statistics: {
    en: [
      "Explain the difference between correlation and causation with an example.",
      "How would you decide which statistical test to use for a given question?",
      "What does a p-value actually tell you, in plain language?",
    ],
    ru: [
      "Объясни разницу между корреляцией и причинностью на примере.",
      "Как ты выбираешь, какой статистический тест использовать для конкретного вопроса?",
      "Что на самом деле означает p-value, простыми словами?",
    ],
  },
  "data visualization": {
    en: [
      "How do you decide which chart type fits a given dataset or question?",
      "Describe a dashboard or chart you've built. What decision was it meant to support?",
      "What makes a data visualization misleading, and how do you avoid that?",
    ],
    ru: [
      "Как ты выбираешь тип графика под конкретные данные или вопрос?",
      "Опиши дашборд или график, который ты делал(а). Какое решение он должен был поддержать?",
      "Что делает визуализацию данных вводящей в заблуждение, и как этого избежать?",
    ],
  },
  "machine learning": {
    en: [
      "Explain the difference between supervised and unsupervised learning.",
      "How do you detect and address overfitting in a model?",
      "Walk me through how you'd evaluate whether a model is actually good enough to ship.",
    ],
    ru: [
      "Объясни разницу между обучением с учителем и без учителя.",
      "Как ты обнаруживаешь и устраняешь переобучение модели?",
      "Опиши, как бы ты оценивал(а), достаточно ли хороша модель, чтобы её выкатить.",
    ],
  },
  excel: {
    en: [
      "What's the difference between VLOOKUP/XLOOKUP and a pivot table — when would you use each?",
      "Describe a time you used Excel to clean or analyze a messy dataset.",
      "How would you build a simple dashboard for a non-technical stakeholder in Excel?",
    ],
    ru: [
      "В чём разница между VLOOKUP/XLOOKUP и сводной таблицей — когда что использовать?",
      "Опиши случай, когда ты использовал(а) Excel для очистки или анализа неаккуратных данных.",
      "Как бы ты собрал(а) простой дашборд для нетехнического стейкхолдера в Excel?",
    ],
  },
  networking: {
    en: [
      "Explain what DNS does, in plain terms.",
      "What's the difference between TCP and UDP, and when does the difference matter?",
      "How would you troubleshoot a machine that can't reach the internet?",
    ],
    ru: [
      "Объясни простыми словами, что делает DNS.",
      "В чём разница между TCP и UDP, и когда это действительно важно?",
      "Как бы ты диагностировал(а) машину, которая не может выйти в интернет?",
    ],
  },
  communication: {
    en: [
      "How do you adapt your communication style for a technical vs. a non-technical audience?",
      "Describe a time you had to deliver difficult feedback or news.",
      "How do you make sure a written update actually gets read and understood?",
    ],
    ru: [
      "Как ты адаптируешь стиль общения для технической и нетехнической аудитории?",
      "Опиши случай, когда тебе пришлось сообщить сложную обратную связь или новость.",
      "Как ты добиваешься того, чтобы письменное сообщение действительно прочитали и поняли?",
    ],
  },
};

const genericTechnicalTemplates: Record<Locale, (skill: string) => string[]> = {
  en: (skill) => [
    `Walk me through how you'd use ${skill} to solve a real problem you might face in this role.`,
    `What's a common mistake people make with ${skill}, and how do you avoid it?`,
    `Describe your hands-on experience with ${skill} so far.`,
  ],
  ru: (skill) => [
    `Опиши, как бы ты использовал(а) ${skill} для решения реальной задачи в этой роли.`,
    `Какую ошибку часто допускают с ${skill}, и как ты её избегаешь?`,
    `Расскажи о своём практическом опыте с ${skill} на данный момент.`,
  ],
};

export function getTechnicalQuestions(skill: string, locale: Locale): string[] {
  const key = skill.trim().toLowerCase();
  return technicalQuestionBank[key]?.[locale] ?? genericTechnicalTemplates[locale](skill);
}

export const followUpTemplates: Record<Locale, string[]> = {
  en: [
    "Can you go a bit deeper — what was the hardest part of that?",
    "What would you do differently if you did it again?",
    "How did you know it actually worked / measure success there?",
    "What was the specific outcome, and how did you know it mattered?",
    "Who else was involved, and how did you handle that collaboration?",
  ],
  ru: [
    "Можешь копнуть глубже — что было самым сложным в этой ситуации?",
    "Что бы ты сделал(а) иначе, если бы повторил(а) это снова?",
    "Как ты понял(а), что это действительно сработало / как измерял(а) успех?",
    "Каким был конкретный результат, и как ты понял(а), что он важен?",
    "Кто ещё был вовлечён, и как ты выстраивал(а) это взаимодействие?",
  ],
};

/** `{highlight}` is substituted with one real fact from the candidate's own resume — never an invented one. */
export const resumeBasedQuestionTemplates: Record<Locale, string[]> = {
  en: [
    'Your resume mentions: "{highlight}." Can you walk me through how you approached that?',
    'Tell me more about this from your resume: "{highlight}." What was the hardest part?',
    'You listed "{highlight}" on your resume — what was your specific role in that?',
  ],
  ru: [
    'В твоём резюме указано: «{highlight}». Расскажи подробнее, как ты к этому подошёл(шла)?',
    'Расскажи подробнее об этом пункте резюме: «{highlight}». Что было самым сложным?',
    'Ты указал(а) «{highlight}» в резюме — какая у тебя была роль в этом?',
  ],
};
