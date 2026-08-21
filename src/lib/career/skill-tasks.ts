import type { Locale } from "@/lib/i18n/config";

const skillTasksCatalog: Record<string, Record<Locale, string[]>> = {
  python: {
    en: ["Syntax & data types", "Functions & modules", "Working with files", "Error handling", "Virtual environments"],
    ru: ["Синтаксис и типы данных", "Функции и модули", "Работа с файлами", "Обработка ошибок", "Виртуальные окружения"],
  },
  sql: {
    en: ["SELECT", "JOIN", "GROUP BY", "Subqueries", "Window Functions"],
    ru: ["SELECT", "JOIN", "GROUP BY", "Подзапросы", "Оконные функции"],
  },
  databases: {
    en: ["Relational design basics", "Indexes & performance", "Transactions", "Normalization", "Backups & migrations"],
    ru: ["Основы реляционного дизайна", "Индексы и производительность", "Транзакции", "Нормализация", "Резервные копии и миграции"],
  },
  javascript: {
    en: ["Variables & types", "Functions & scope", "Arrays & objects", "Async/await & Promises", "DOM basics"],
    ru: ["Переменные и типы", "Функции и область видимости", "Массивы и объекты", "Async/await и промисы", "Основы DOM"],
  },
  react: {
    en: ["Components & props", "State & hooks", "Event handling", "Conditional rendering", "Fetching data"],
    ru: ["Компоненты и props", "State и хуки", "Обработка событий", "Условный рендеринг", "Загрузка данных"],
  },
  css: {
    en: ["Box model", "Flexbox", "Grid", "Responsive design", "Basic animations"],
    ru: ["Box model", "Flexbox", "Grid", "Адаптивная вёрстка", "Базовые анимации"],
  },
  "ui basics": {
    en: ["Visual hierarchy", "Color & typography", "Spacing & alignment", "Component consistency"],
    ru: ["Визуальная иерархия", "Цвет и типографика", "Отступы и выравнивание", "Согласованность компонентов"],
  },
  git: {
    en: ["Commits & branches", "Merging & rebasing", "Resolving conflicts", "Pull requests"],
    ru: ["Коммиты и ветки", "Merge и rebase", "Разрешение конфликтов", "Pull request'ы"],
  },
  apis: {
    en: ["REST basics", "Authentication", "Error handling", "Rate limits & pagination"],
    ru: ["Основы REST", "Аутентификация", "Обработка ошибок", "Rate limit и пагинация"],
  },
  figma: {
    en: ["Frames & auto layout", "Components & variants", "Prototyping basics", "Design handoff"],
    ru: ["Фреймы и авто-лейаут", "Компоненты и варианты", "Основы прототипирования", "Передача макетов в разработку"],
  },
  "user research": {
    en: ["Writing a research plan", "User interviews", "Synthesizing findings"],
    ru: ["Составление плана исследования", "Интервью с пользователями", "Синтез результатов"],
  },
  statistics: {
    en: ["Descriptive statistics", "Probability basics", "Hypothesis testing", "Correlation & regression"],
    ru: ["Описательная статистика", "Основы вероятности", "Проверка гипотез", "Корреляция и регрессия"],
  },
  "data visualization": {
    en: ["Choosing the right chart", "Building dashboards", "Storytelling with data"],
    ru: ["Выбор подходящего графика", "Создание дашбордов", "Сторителлинг на основе данных"],
  },
  "machine learning": {
    en: ["Supervised vs unsupervised learning", "Training & evaluating a model", "Overfitting & regularization", "Common libraries (scikit-learn)"],
    ru: ["Обучение с учителем и без", "Обучение и оценка модели", "Переобучение и регуляризация", "Основные библиотеки (scikit-learn)"],
  },
  excel: {
    en: ["Formulas & functions", "Pivot tables", "Data cleaning", "Charts"],
    ru: ["Формулы и функции", "Сводные таблицы", "Очистка данных", "Диаграммы"],
  },
  "financial modeling": {
    en: ["Building a 3-statement model", "Forecasting assumptions", "Scenario analysis"],
    ru: ["Построение трёхстраничной модели", "Прогнозные допущения", "Сценарный анализ"],
  },
  communication: {
    en: ["Structuring a clear message", "Active listening", "Giving & receiving feedback"],
    ru: ["Структурирование сообщения", "Активное слушание", "Обратная связь"],
  },
  seo: {
    en: ["Keyword research", "On-page optimization", "Basic analytics"],
    ru: ["Исследование ключевых слов", "On-page оптимизация", "Основы аналитики"],
  },
  "content strategy": {
    en: ["Audience research", "Content calendar", "Measuring performance"],
    ru: ["Исследование аудитории", "Контент-план", "Оценка эффективности"],
  },
  copywriting: {
    en: ["Writing clear headlines", "Tone of voice", "Editing for clarity"],
    ru: ["Написание заголовков", "Tone of voice", "Редактура текста"],
  },
  networking: {
    en: ["OSI model basics", "DNS & DHCP", "Firewalls & security basics"],
    ru: ["Основы модели OSI", "DNS и DHCP", "Основы файрволов и безопасности"],
  },
  "cloud basics": {
    en: ["Core cloud concepts", "Deploying a simple service", "Monitoring & logging"],
    ru: ["Базовые концепции облака", "Деплой простого сервиса", "Мониторинг и логирование"],
  },
};

const genericTasks: Record<Locale, string[]> = {
  en: ["Learn the fundamentals", "Practice with real examples", "Build a small project", "Review and reinforce"],
  ru: ["Изучить основы", "Попрактиковаться на реальных примерах", "Сделать небольшой проект", "Повторить и закрепить"],
};

export function getTasksForSkill(skill: string, locale: Locale): string[] {
  const key = skill.trim().toLowerCase();
  return skillTasksCatalog[key]?.[locale] ?? genericTasks[locale];
}
