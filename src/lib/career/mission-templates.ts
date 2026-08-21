import type { Locale } from "@/lib/i18n/config";

export interface MissionTemplate {
  title: string;
  description: string;
  goal: string;
  instructions: string[];
  whyItMatters: string;
  expectedResult: string;
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

type Localized<T> = Record<Locale, T>;

const skillTemplates: Record<string, Localized<MissionTemplate>> = {
  sql: {
    en: {
      title: "Complete 5 SQL JOIN exercises",
      description: "Practice combining data across tables with JOIN, then summarize it with GROUP BY.",
      goal: "Get comfortable combining and summarizing relational data.",
      instructions: [
        "Pick a sample database (or use a free one online) with at least 2 related tables.",
        "Write 5 queries using INNER JOIN or LEFT JOIN to combine data from both tables.",
        "Write 1 additional query that uses GROUP BY to summarize the joined results.",
        "Check each query's output makes sense before moving to the next.",
      ],
      whyItMatters: "JOINs are the single most common real-world SQL operation — most production queries touch more than one table.",
      expectedResult: "5 working JOIN queries plus 1 GROUP BY summary query, all returning correct results.",
      estimatedMinutes: 45,
      difficulty: "MEDIUM",
    },
    ru: {
      title: "Реши 5 упражнений на SQL JOIN",
      description: "Потренируйся объединять данные из нескольких таблиц через JOIN, а затем сводить их через GROUP BY.",
      goal: "Научиться уверенно объединять и агрегировать реляционные данные.",
      instructions: [
        "Возьми учебную базу данных (или найди бесплатную онлайн) минимум с 2 связанными таблицами.",
        "Напиши 5 запросов с INNER JOIN или LEFT JOIN, объединяющих данные из обеих таблиц.",
        "Напиши ещё 1 запрос с GROUP BY, который сводит результат объединения.",
        "Проверь, что результат каждого запроса логичен, прежде чем переходить к следующему.",
      ],
      whyItMatters: "JOIN — самая частая операция в реальном SQL: большинство продакшн-запросов затрагивают больше одной таблицы.",
      expectedResult: "5 рабочих запросов с JOIN и 1 запрос с GROUP BY, все возвращают корректный результат.",
      estimatedMinutes: 45,
      difficulty: "MEDIUM",
    },
  },
  python: {
    en: {
      title: "Group and total transactions by category",
      description: "Implement a Python function that groups a list of transactions by category and calculates the total amount for each.",
      goal: "Practice data aggregation logic — one of the most common real backend tasks.",
      instructions: [
        "Create a list of sample transactions, each with a category and an amount.",
        "Write a function that groups transactions by category.",
        "For each category, calculate the total amount.",
        "Return the result as a dictionary of category → total.",
        "Test it with at least 3 different categories and edge cases (empty list, one category).",
      ],
      whyItMatters: "Grouping and aggregating data is a core pattern behind reports, dashboards, and analytics features.",
      expectedResult: "A tested Python function that correctly groups transactions by category and totals each group.",
      estimatedMinutes: 40,
      difficulty: "MEDIUM",
    },
    ru: {
      title: "Сгруппируй и просуммируй транзакции по категориям",
      description: "Реализуй Python-функцию, которая группирует список транзакций по категориям и считает сумму по каждой категории.",
      goal: "Потренироваться в агрегации данных — одной из самых частых задач в backend-разработке.",
      instructions: [
        "Создай список тестовых транзакций, у каждой — категория и сумма.",
        "Напиши функцию, которая группирует транзакции по категориям.",
        "Для каждой категории посчитай сумму.",
        "Верни результат в виде словаря категория → сумма.",
        "Протестируй минимум на 3 категориях и граничных случаях (пустой список, одна категория).",
      ],
      whyItMatters: "Группировка и агрегация данных — базовый паттерн для отчётов, дашбордов и аналитики.",
      expectedResult: "Протестированная Python-функция, которая корректно группирует транзакции и считает сумму по категориям.",
      estimatedMinutes: 40,
      difficulty: "MEDIUM",
    },
  },
  apis: {
    en: {
      title: "Build a REST API endpoint with FastAPI",
      description: "Build a working GET /users endpoint with validation and error handling.",
      goal: "Ship a small, real, working API endpoint end to end.",
      instructions: [
        "Create a new FastAPI application.",
        "Add a GET /users endpoint that returns a list of users.",
        "Define a typed response model for a user.",
        "Add input validation for any query parameters (e.g. a limit).",
        "Handle the invalid-input case with a clear error response.",
      ],
      whyItMatters: "Building and validating API endpoints is the day-to-day core of backend development.",
      expectedResult: "A working GET /users endpoint that returns validated, typed user data and handles invalid input gracefully.",
      estimatedMinutes: 60,
      difficulty: "MEDIUM",
    },
    ru: {
      title: "Построй REST API endpoint на FastAPI",
      description: "Сделай рабочий эндпоинт GET /users с валидацией и обработкой ошибок.",
      goal: "Довести один настоящий API endpoint до полностью рабочего состояния.",
      instructions: [
        "Создай новое FastAPI-приложение.",
        "Добавь эндпоинт GET /users, возвращающий список пользователей.",
        "Опиши типизированную модель ответа для пользователя.",
        "Добавь валидацию входных query-параметров (например, limit).",
        "Обработай некорректный ввод понятным сообщением об ошибке.",
      ],
      whyItMatters: "Разработка и валидация API-эндпоинтов — ежедневная основа работы backend-разработчика.",
      expectedResult: "Рабочий эндпоинт GET /users, который возвращает валидированные типизированные данные и корректно обрабатывает ошибки ввода.",
      estimatedMinutes: 60,
      difficulty: "MEDIUM",
    },
  },
  javascript: {
    en: {
      title: "Fetch and render a list from a public API",
      description: "Write a JavaScript function that fetches data from a public API and renders it as a list, handling loading and error states.",
      goal: "Practice the fetch → loading/error → render cycle used in almost every frontend app.",
      instructions: [
        "Pick any free public API that returns a list of items.",
        "Write a function that fetches the data.",
        "Render the items as a simple list once loaded.",
        "Show a loading indicator while the request is in flight.",
        "Show an error message if the request fails.",
      ],
      whyItMatters: "Handling async data with proper loading/error states is one of the most common real frontend tasks.",
      expectedResult: "A working fetch-and-render flow with visible loading and error states.",
      estimatedMinutes: 45,
      difficulty: "MEDIUM",
    },
    ru: {
      title: "Загрузи и отобрази список из публичного API",
      description: "Напиши JS-функцию, которая загружает данные из публичного API и отображает их списком, с состояниями загрузки и ошибки.",
      goal: "Отработать цикл fetch → загрузка/ошибка → рендер, используемый почти в любом фронтенд-приложении.",
      instructions: [
        "Выбери любой бесплатный публичный API, возвращающий список элементов.",
        "Напиши функцию, которая загружает данные.",
        "Отобрази элементы простым списком после загрузки.",
        "Покажи индикатор загрузки, пока запрос выполняется.",
        "Покажи сообщение об ошибке, если запрос не удался.",
      ],
      whyItMatters: "Корректная обработка асинхронных данных с состояниями загрузки/ошибки — одна из самых частых фронтенд-задач.",
      expectedResult: "Рабочий цикл загрузки и отображения данных с видимыми состояниями загрузки и ошибки.",
      estimatedMinutes: 45,
      difficulty: "MEDIUM",
    },
  },
  react: {
    en: {
      title: "Build a data-fetching React component",
      description: "Build a small React component that fetches and displays a list of items, with loading and error states.",
      goal: "Practice a realistic, self-contained React component.",
      instructions: [
        "Create a new component that fetches a list of items on mount.",
        "Show a loading state while fetching.",
        "Render the items once loaded.",
        "Show an error state if the fetch fails.",
        "Add a button to manually refetch.",
      ],
      whyItMatters: "Most real React components manage exactly this loading/data/error lifecycle.",
      expectedResult: "A working component with visible loading, data, and error states, plus a refetch action.",
      estimatedMinutes: 50,
      difficulty: "MEDIUM",
    },
    ru: {
      title: "Построй React-компонент с загрузкой данных",
      description: "Сделай небольшой React-компонент, который загружает и отображает список, с состояниями загрузки и ошибки.",
      goal: "Отработать реалистичный самостоятельный React-компонент.",
      instructions: [
        "Создай компонент, который загружает список при монтировании.",
        "Покажи состояние загрузки, пока идёт запрос.",
        "Отобрази элементы после загрузки.",
        "Покажи состояние ошибки, если запрос не удался.",
        "Добавь кнопку для повторной загрузки.",
      ],
      whyItMatters: "Большинство реальных React-компонентов управляют именно этим циклом: загрузка/данные/ошибка.",
      expectedResult: "Рабочий компонент с видимыми состояниями загрузки, данных и ошибки, плюс возможность повторной загрузки.",
      estimatedMinutes: 50,
      difficulty: "MEDIUM",
    },
  },
  css: {
    en: {
      title: "Recreate a card layout with Flexbox",
      description: "Recreate a simple card layout (image, title, description, button) using CSS Flexbox.",
      goal: "Get comfortable with Flexbox for real UI layout.",
      instructions: [
        "Sketch or find a reference card design (image, title, description, button).",
        "Build the HTML structure for one card.",
        "Style it with Flexbox to match the layout.",
        "Make it responsive down to a narrow mobile width.",
      ],
      whyItMatters: "Card layouts are one of the most common UI patterns, and Flexbox is the default tool for building them.",
      expectedResult: "A responsive card component matching the reference layout.",
      estimatedMinutes: 35,
      difficulty: "EASY",
    },
    ru: {
      title: "Собери карточку на Flexbox",
      description: "Воссоздай простую карточку (картинка, заголовок, описание, кнопка) с помощью CSS Flexbox.",
      goal: "Уверенно освоить Flexbox для реальной вёрстки интерфейса.",
      instructions: [
        "Найди или набросай референс карточки (картинка, заголовок, описание, кнопка).",
        "Собери HTML-структуру одной карточки.",
        "Заверстай её через Flexbox по референсу.",
        "Сделай адаптивной для узкого мобильного экрана.",
      ],
      whyItMatters: "Карточки — один из самых частых UI-паттернов, а Flexbox — стандартный инструмент для их вёрстки.",
      expectedResult: "Адаптивный компонент-карточка, соответствующий референсу.",
      estimatedMinutes: 35,
      difficulty: "EASY",
    },
  },
  git: {
    en: {
      title: "Practice a realistic Git workflow",
      description: "Create a branch, make 3 commits, write a pull-request description, and resolve one merge conflict.",
      goal: "Build muscle memory for the Git workflow used on real teams.",
      instructions: [
        "Create a new branch in a scratch repository.",
        "Make 3 separate, well-described commits.",
        "Write a short pull-request description summarizing the change.",
        "Intentionally create and resolve one merge conflict.",
      ],
      whyItMatters: "This exact branch → commit → PR → merge workflow is how almost every real engineering team operates.",
      expectedResult: "A branch with 3 clean commits, a PR description, and a resolved merge conflict.",
      estimatedMinutes: 30,
      difficulty: "EASY",
    },
    ru: {
      title: "Отработай реалистичный Git-воркфлоу",
      description: "Создай ветку, сделай 3 коммита, напиши описание pull request и разреши один конфликт слияния.",
      goal: "Закрепить на практике Git-воркфлоу, используемый в реальных командах.",
      instructions: [
        "Создай новую ветку в тестовом репозитории.",
        "Сделай 3 отдельных коммита с понятными описаниями.",
        "Напиши краткое описание pull request с сутью изменений.",
        "Намеренно создай и разреши один конфликт слияния.",
      ],
      whyItMatters: "Именно по такой схеме ветка → коммит → PR → merge работает практически любая инженерная команда.",
      expectedResult: "Ветка с 3 аккуратными коммитами, описанием PR и разрешённым конфликтом слияния.",
      estimatedMinutes: 30,
      difficulty: "EASY",
    },
  },
};

const genericSkillTemplate = (skill: string, locale: Locale): MissionTemplate =>
  locale === "ru"
    ? {
        title: `Практика: ${skill}`,
        description: `Целенаправленная практическая сессия по теме «${skill}».`,
        goal: `Применить «${skill}» на практике, а не просто прочитать о ней.`,
        instructions: [
          `Найди короткий практический пример по теме «${skill}».`,
          "Пройди его самостоятельно, не копируя решение.",
          "Примени изученное к небольшой собственной задаче.",
          "Запиши 2-3 предложения о том, что усвоил(а).",
        ],
        whyItMatters: `«${skill}» — один из навыков, которых сейчас не хватает для твоей карьерной цели.`,
        expectedResult: `Один законченный небольшой пример по теме «${skill}» плюс краткие заметки.`,
        estimatedMinutes: 40,
        difficulty: "MEDIUM",
      }
    : {
        title: `Practice: ${skill}`,
        description: `A focused, hands-on practice session on ${skill}.`,
        goal: `Apply ${skill} in practice, not just read about it.`,
        instructions: [
          `Find a short hands-on exercise related to ${skill}.`,
          "Work through it yourself rather than copying a solution.",
          "Apply what you learned to a small example of your own.",
          "Write 2-3 sentences summarizing what you learned.",
        ],
        whyItMatters: `${skill} is one of the skills currently missing for your target career.`,
        expectedResult: `One completed small exercise on ${skill}, plus short notes.`,
        estimatedMinutes: 40,
        difficulty: "MEDIUM",
      };

export function getSkillMissionTemplate(skillKey: string, locale: Locale): MissionTemplate {
  const key = skillKey.trim().toLowerCase();
  return skillTemplates[key]?.[locale] ?? genericSkillTemplate(skillKey, locale);
}

type MilestoneCategory = "foundation" | "portfolio" | "resume" | "interview" | "apply" | "firstJob";

const milestoneCategoryTemplates: Record<MilestoneCategory, Localized<MissionTemplate[]>> = {
  foundation: {
    en: [
      {
        title: "Map out the role",
        description: "Write a one-paragraph summary of what {career} does day to day, and list your top 3 missing skills.",
        goal: "Build a clear, honest picture of the role and the gap to close.",
        instructions: [
          "Research what a {career} actually does day to day.",
          "Write a one-paragraph summary in your own words.",
          "List the 3 skills you're most missing right now.",
          "Note which one you'll focus on first.",
        ],
        whyItMatters: "A clear target makes every future mission easier to prioritize.",
        expectedResult: "A short written summary of the role plus a prioritized list of 3 missing skills.",
        estimatedMinutes: 30,
        difficulty: "EASY",
      },
    ],
    ru: [
      {
        title: "Разберись в роли",
        description: "Напиши абзац о том, чем занимается {career} день за днём, и выпиши 3 самых слабых своих места.",
        goal: "Составить чёткую, честную картину роли и разрыва, который нужно закрыть.",
        instructions: [
          "Изучи, чем реально занимается {career} день за днём.",
          "Напиши абзац своими словами.",
          "Выпиши 3 навыка, которых тебе сейчас больше всего не хватает.",
          "Отметь, с какого начнёшь в первую очередь.",
        ],
        whyItMatters: "Чёткая цель делает приоритизацию каждой следующей миссии проще.",
        expectedResult: "Короткое письменное описание роли и приоритизированный список из 3 недостающих навыков.",
        estimatedMinutes: 30,
        difficulty: "EASY",
      },
    ],
  },
  portfolio: {
    en: [
      {
        title: "Add authentication to your portfolio project",
        description: "Add a login/signup flow to your portfolio project.",
        goal: "Add a real, commonly-expected feature to a portfolio project.",
        instructions: [
          "Pick your strongest in-progress portfolio project.",
          "Add a login/signup flow (a simple email+password is fine).",
          "Protect at least one page or route so only logged-in users can access it.",
          "Test the full flow: sign up, log out, log back in.",
        ],
        whyItMatters: "Authentication is one of the first things reviewers look for in a portfolio project.",
        expectedResult: "A working login/signup flow protecting at least one page of your project.",
        estimatedMinutes: 60,
        difficulty: "HARD",
      },
      {
        title: "Write a strong README",
        description: "Write a clear, well-structured README for your strongest portfolio project.",
        goal: "Make your project's value obvious to someone seeing it for the first time.",
        instructions: [
          "Pick your strongest portfolio project.",
          "Write a short description of what it does and why you built it.",
          "Add setup/run instructions.",
          "Add a screenshot or short description of the demo.",
        ],
        whyItMatters: "A good README is often the first — and sometimes only — thing a reviewer reads.",
        expectedResult: "A complete README covering what, why, setup, and a demo.",
        estimatedMinutes: 30,
        difficulty: "EASY",
      },
    ],
    ru: [
      {
        title: "Добавь авторизацию в проект портфолио",
        description: "Добавь в проект портфолио сценарий входа/регистрации.",
        goal: "Добавить в проект портфолио функцию, которую реально ожидают увидеть.",
        instructions: [
          "Выбери самый сильный проект в разработке.",
          "Добавь вход/регистрацию (простой связки email+пароль достаточно).",
          "Защити минимум одну страницу или роут — доступ только для авторизованных.",
          "Протестируй весь сценарий: регистрация, выход, повторный вход.",
        ],
        whyItMatters: "Авторизация — одна из первых вещей, на которые смотрят при оценке проекта в портфолио.",
        expectedResult: "Рабочий сценарий входа/регистрации, защищающий минимум одну страницу проекта.",
        estimatedMinutes: 60,
        difficulty: "HARD",
      },
      {
        title: "Напиши сильный README",
        description: "Напиши понятный, хорошо структурированный README для своего лучшего проекта в портфолио.",
        goal: "Сделать ценность проекта очевидной для того, кто видит его впервые.",
        instructions: [
          "Выбери свой самый сильный проект в портфолио.",
          "Опиши, что он делает и зачем ты его сделал(а).",
          "Добавь инструкции по установке и запуску.",
          "Добавь скриншот или краткое описание демо.",
        ],
        whyItMatters: "Хороший README часто первое — а иногда и единственное, — что читает проверяющий.",
        expectedResult: "Полный README с описанием проекта, инструкциями по запуску и демо.",
        estimatedMinutes: 30,
        difficulty: "EASY",
      },
    ],
  },
  resume: {
    en: [
      {
        title: "Write the first version of your resume",
        description: "Draft your resume summary and one experience bullet point using the STAR method.",
        goal: "Get a real first draft down instead of waiting for it to be perfect.",
        instructions: [
          "Write a 2-3 sentence professional summary targeting {career}.",
          "Pick one project or experience.",
          "Rewrite it as a bullet point using STAR (Situation, Task, Action, Result).",
          "Make sure the result is measurable if possible.",
        ],
        whyItMatters: "A first draft is what turns 'I should write a resume' into an actual resume.",
        expectedResult: "A written summary plus one STAR-formatted bullet point.",
        estimatedMinutes: 35,
        difficulty: "MEDIUM",
      },
    ],
    ru: [
      {
        title: "Напиши первую версию резюме",
        description: "Составь краткое summary и один пункт опыта по методу STAR.",
        goal: "Получить реальный первый черновик, вместо ожидания идеальной версии.",
        instructions: [
          "Напиши summary на 2-3 предложения под роль {career}.",
          "Выбери один проект или пункт опыта.",
          "Перепиши его в формате STAR (Situation, Task, Action, Result).",
          "По возможности сделай результат измеримым.",
        ],
        whyItMatters: "Первый черновик превращает «надо бы написать резюме» в реальное резюме.",
        expectedResult: "Написанное summary и один пункт опыта в формате STAR.",
        estimatedMinutes: 35,
        difficulty: "MEDIUM",
      },
    ],
  },
  interview: {
    en: [
      {
        title: "Answer one mock interview question out loud",
        description: "Answer one realistic interview question for a {career} role, spoken out loud, in full.",
        goal: "Build comfort speaking through an answer under light pressure.",
        instructions: [
          "Pick one common interview question for a {career} role.",
          "Speak your full answer out loud (record it if possible).",
          "Listen back and note one thing to improve.",
          "Answer it again, incorporating that improvement.",
        ],
        whyItMatters: "Speaking an answer out loud reveals gaps that just thinking about it never does.",
        expectedResult: "One fully spoken answer, reviewed once, and improved.",
        estimatedMinutes: 25,
        difficulty: "MEDIUM",
      },
      {
        title: "Solve one medium practice problem",
        description: "Complete one medium-difficulty practice problem relevant to a {career} role.",
        goal: "Keep problem-solving skills sharp under realistic constraints.",
        instructions: [
          "Pick one medium-difficulty practice problem relevant to the role.",
          "Solve it without looking at the solution first.",
          "Review your approach against a reference solution afterward.",
          "Note anything you'd do differently.",
        ],
        whyItMatters: "Technical interviews reward practiced problem-solving, not just theoretical knowledge.",
        expectedResult: "One solved practice problem, reviewed against a reference approach.",
        estimatedMinutes: 40,
        difficulty: "MEDIUM",
      },
    ],
    ru: [
      {
        title: "Ответь на один вопрос собеседования вслух",
        description: "Ответь вслух и полностью на один реалистичный вопрос собеседования для роли {career}.",
        goal: "Наработать уверенность в устном ответе под лёгким давлением.",
        instructions: [
          "Выбери один частый вопрос собеседования для роли {career}.",
          "Ответь на него вслух полностью (по возможности запиши).",
          "Прослушай запись и отметь, что улучшить.",
          "Ответь ещё раз, учитывая это улучшение.",
        ],
        whyItMatters: "Устный ответ вскрывает пробелы, которые не заметны, пока просто думаешь об ответе.",
        expectedResult: "Один полностью проговорённый ответ, разобранный и улучшенный.",
        estimatedMinutes: 25,
        difficulty: "MEDIUM",
      },
      {
        title: "Реши одну задачу среднего уровня",
        description: "Реши одну практическую задачу среднего уровня сложности, релевантную роли {career}.",
        goal: "Поддерживать навык решения задач в реалистичных условиях.",
        instructions: [
          "Выбери одну задачу среднего уровня, релевантную роли.",
          "Реши её самостоятельно, не глядя на решение.",
          "Сверь свой подход с эталонным решением.",
          "Отметь, что сделал(а) бы иначе.",
        ],
        whyItMatters: "Технические собеседования вознаграждают натренированное решение задач, а не только теорию.",
        expectedResult: "Одна решённая задача, сверенная с эталонным подходом.",
        estimatedMinutes: 40,
        difficulty: "MEDIUM",
      },
    ],
  },
  apply: {
    en: [
      {
        title: "Analyze 3 job descriptions",
        description: "Analyze 3 job descriptions for {career} positions and list the 5 most commonly requested skills.",
        goal: "Know exactly what the market is asking for right now.",
        instructions: [
          "Find 3 real job postings for a {career} role.",
          "List the required/preferred skills from each.",
          "Identify the 5 skills that show up most often across all 3.",
          "Compare that list against your current skills.",
        ],
        whyItMatters: "Applying well starts with knowing exactly what's actually being asked for.",
        expectedResult: "A list of the 5 most commonly requested skills across 3 real postings, compared to your own.",
        estimatedMinutes: 30,
        difficulty: "EASY",
      },
    ],
    ru: [
      {
        title: "Проанализируй 3 вакансии",
        description: "Проанализируй 3 описания вакансий {career} и выпиши 5 самых часто встречающихся навыков.",
        goal: "Точно понимать, что сейчас реально требует рынок.",
        instructions: [
          "Найди 3 реальные вакансии на роль {career}.",
          "Выпиши требуемые/желательные навыки из каждой.",
          "Определи 5 навыков, которые встречаются чаще всего во всех трёх.",
          "Сравни этот список со своими текущими навыками.",
        ],
        whyItMatters: "Качественный отклик начинается с точного понимания того, что реально требуется.",
        expectedResult: "Список из 5 самых частых навыков по 3 реальным вакансиям, сопоставленный с твоими текущими.",
        estimatedMinutes: 30,
        difficulty: "EASY",
      },
    ],
  },
  firstJob: {
    en: [
      {
        title: "Practice explaining your project",
        description: "Practice explaining your strongest project out loud for 10 minutes, focused on your contribution and impact.",
        goal: "Be ready to talk about your work clearly and confidently.",
        instructions: [
          "Pick your strongest project.",
          "Set a timer for 10 minutes.",
          "Explain what it does, your specific role, and the impact — out loud, as if to an interviewer.",
          "Note anything that felt unclear or hard to explain.",
        ],
        whyItMatters: "Being able to clearly explain your own work is one of the most underrated interview and onboarding skills.",
        expectedResult: "A confident, clear 10-minute explanation of your project, plus notes on what to sharpen.",
        estimatedMinutes: 15,
        difficulty: "EASY",
      },
    ],
    ru: [
      {
        title: "Потренируйся рассказывать о своём проекте",
        description: "10 минут практикуйся вслух объяснять свой самый сильный проект, фокусируясь на своём вкладе и результате.",
        goal: "Быть готовым уверенно и понятно рассказывать о своей работе.",
        instructions: [
          "Выбери свой самый сильный проект.",
          "Поставь таймер на 10 минут.",
          "Объясни, что он делает, какова была твоя роль и какой результат — вслух, как будто интервьюеру.",
          "Отметь, что показалось неясным или сложным для объяснения.",
        ],
        whyItMatters: "Умение чётко рассказать о своей работе — один из самых недооценённых навыков на собеседовании и в начале работы.",
        expectedResult: "Уверенное, понятное 10-минутное объяснение проекта плюс заметки, что стоит доработать.",
        estimatedMinutes: 15,
        difficulty: "EASY",
      },
    ],
  },
};

const categoryKeywords: [RegExp, MilestoneCategory][] = [
  [/portfolio|портфолио/i, "portfolio"],
  [/resume|резюме/i, "resume"],
  [/interview|интервью|собесед/i, "interview"],
  [/application|отклик|вакан/i, "apply"],
  [/first job|первая работа/i, "firstJob"],
  [/foundation|основы карьеры/i, "foundation"],
];

export function detectMilestoneCategory(milestoneTitle: string): MilestoneCategory | null {
  const match = categoryKeywords.find(([pattern]) => pattern.test(milestoneTitle));
  return match ? match[1] : null;
}

export function getMilestoneCategoryTemplates(category: MilestoneCategory, locale: Locale): MissionTemplate[] {
  return milestoneCategoryTemplates[category][locale];
}
