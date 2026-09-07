import { test as base, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { legacyPlanHref } from "../src/lib/career/plan-navigation";

const password = "ProfyMind-test-2026!";
const goal = "Разработчик интерфейсов и доступных мобильных приложений";
const taskTitle = "Подготовить первый проект для портфолио";
const milestoneTitle = "Практика разработки доступных интерфейсов";

// Only create and remove our own temporary users, and only on a local DB.
const test = base.extend<{ account: { id: string; email: string; db: PrismaClient } }>({
  account: async ({}, runFixture) => {
    const host = new URL(process.env.DATABASE_URL!).hostname;
    if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) throw new Error("Tests require a local database");
    const db = new PrismaClient();
    const email = `mobile-plan-${randomUUID()}@example.test`;
    const user = await db.user.create({ data: {
      email, name: "Проверка мобильного плана", passwordHash: await hash(password, 4),
      profile: { create: { onboardingCompleted: true, tourCompleted: true } },
    } });
    try { await runFixture({ id: user.id, email, db }); }
    finally {
      await db.user.deleteMany({ where: { id: user.id, email } });
      await db.$disconnect();
    }
  },
});

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/dashboard");
}

async function expectFits(page: Page) {
  // Wait for the app’s entrance animations, including portal sheets, before measuring.
  const panel = page.locator('[data-slot="sheet-content"]');
  if (await panel.count()) {
    await expect(panel).toHaveCSS("opacity", "1");
    await expect(panel).not.toHaveAttribute("data-starting-style", "");
  }
  const root = page.locator("main > div").first();
  if (await root.count()) await expect(root).toHaveCSS("opacity", "1");
  const overflow = await page.evaluate(() => {
    const main = document.querySelector("main");
    const dialog = document.querySelector('[role="dialog"]');
    return {
      document: document.documentElement.scrollWidth - window.innerWidth,
      main: main ? main.scrollWidth - main.clientWidth : 0,
      dialog: dialog ? dialog.scrollWidth - dialog.clientWidth : 0,
    };
  });
  expect(overflow).toEqual({ document: 0, main: 0, dialog: 0 });
}

async function seedPlan(db: PrismaClient, userId: string) {
  const roadmap = await db.roadmap.create({ data: { userId, careerTitle: goal, milestones: { create: [
    { order: 0, title: milestoneTitle, description: "Описание этапа", whyItMatters: "Практический опыт", expectedResult: "Готовый проект", estimatedWeeks: 2, status: "AVAILABLE", skills: ["Доступность"], tasks: { create: {
      order: 0, title: taskTitle, resources: { create: { title: "Руководство по доступности", type: "DOCUMENTATION", url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility", verified: true } },
    } } },
    { order: 1, title: "Подготовка к поиску работы", description: "Следующий этап", whyItMatters: "Работа", expectedResult: "Резюме", estimatedWeeks: 1, status: "LOCKED", tasks: { create: { order: 0, title: "Обновить резюме" } } },
  ] } }, include: { milestones: { orderBy: { order: "asc" }, include: { tasks: true } } } });
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setUTCDate(today.getUTCDate() - 1);
  const defaults = { userId, roadmapId: roadmap.id, title: taskTitle, description: "Небольшое действие на пути к карьерной цели.", goal: "Добавить проект в портфолио", instructions: ["Выбрать пример", "Подготовить результат"], whyItMatters: "Практика", expectedResult: "Проект", estimatedMinutes: 20, missionDate: today };
  const mission = await db.careerMission.create({ data: { ...defaults, milestoneId: roadmap.milestones[0].id, roadmapTaskId: roadmap.milestones[0].tasks[0].id } });
  const skipped = await db.careerMission.create({ data: { ...defaults, title: "Дополнительное задание" } });
  for (const status of ["COMPLETED", "SKIPPED", "EXPIRED"] as const) {
    await db.careerMission.create({ data: { ...defaults, title: `История: ${status}`, status, missionDate: yesterday } });
  }
  return { roadmap, mission, skipped };
}

test("legacy links retain repeated and encoded query parameters", () => {
  expect(legacyPlanHref("all", { view: "today", source: ["a", "b"], q: "План & цель" }))
    .toBe("/dashboard/plan?view=all&source=a&source=b&q=%D0%9F%D0%BB%D0%B0%D0%BD+%26+%D1%86%D0%B5%D0%BB%D1%8C");
});

test("public pages fit mobile and desktop, touch controls reach 44px", async ({ page }, info) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectFits(page);
    await page.screenshot({ path: info.outputPath(`landing-${width}.png`), fullPage: true });
    if (width < 768) {
      const sizes = await page.locator('[data-slot="button"]:visible').evaluateAll(nodes => nodes.map(n => ({ w: n.getBoundingClientRect().width, h: n.getBoundingClientRect().height })));
      expect(sizes.every(size => size.w >= 44 && size.h >= 44)).toBe(true);
      await page.goto("/register");
      await expectFits(page);
      for (const input of await page.locator("input").all()) expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: "Показать пароль" }).click();
      await expect(page.locator("#password")).toHaveAttribute("type", "text");
      await page.screenshot({ path: info.outputPath(`register-${width}.png`), fullPage: true });
    }
  }
});

test("existing data, links and history survive; mission completion updates the full plan", async ({ page, account }, info) => {
  const { roadmap, mission, skipped } = await seedPlan(account.db, account.id);
  const original = await account.db.roadmap.findUnique({ where: { id: roadmap.id }, include: { milestones: { include: { tasks: { include: { resources: true } } } } } });
  await page.setViewportSize({ width: 320, height: 850 });
  await login(page, account.email);
  await page.goto("/dashboard/roadmap?source=bookmark&source=old");
  await expect(page).toHaveURL(/\/dashboard\/plan\?source=bookmark&source=old&view=all/);
  await expect(page.getByRole("heading", { name: "Мой план", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Мой план", exact: true }).getByRole("link", { name: "Весь план" })).toHaveAttribute("aria-current", "page");
  await expectFits(page);
  await page.screenshot({ path: info.outputPath("plan-all-320.png"), fullPage: true });
  await page.goto("/dashboard/missions");
  await expect(page).toHaveURL(/view=today/);
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute("aria-valuenow", "0");
  await page.getByText("История заданий", { exact: true }).click();
  for (const status of ["COMPLETED", "SKIPPED", "EXPIRED"]) await expect(page.getByText(`История: ${status}`, { exact: true })).toBeVisible();
  expect(await account.db.roadmap.findUnique({ where: { id: roadmap.id }, include: { milestones: { include: { tasks: { include: { resources: true } } } } } })).toEqual(original);
  await expectFits(page);
  await page.screenshot({ path: info.outputPath("plan-today-320.png"), fullPage: true });
  await page.getByRole("button", { name: new RegExp(taskTitle) }).click();
  await expectFits(page);
  await page.screenshot({ path: info.outputPath("mission-sheet-320.png"), fullPage: true });
  // A failed request keeps the task and lets the user retry.
  await page.route(`**/api/career-missions/${mission.id}/start`, route => route.fulfill({ status: 500, json: { error: "generic" } }));
  await page.getByRole("button", { name: "Начать задание", exact: true }).click();
  await expect(page.getByRole("button", { name: "Начать задание", exact: true })).toBeEnabled();
  expect((await account.db.careerMission.findUnique({ where: { id: mission.id } }))!.status).toBe("AVAILABLE");
  await page.unroute(`**/api/career-missions/${mission.id}/start`);
  await page.getByRole("button", { name: "Начать задание", exact: true }).click();
  await page.getByRole("button", { name: "Отметить выполненным", exact: true }).click();
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("navigation", { name: "Мой план", exact: true }).getByRole("link", { name: "Весь план" }).click();
  await page.getByRole("button", { name: new RegExp(milestoneTitle) }).click();
  await expect(page.getByRole("checkbox", { name: taskTitle })).toBeChecked();
  await expect(page.getByRole("link", { name: /Руководство по доступности/ })).toHaveAttribute("href", "https://developer.mozilla.org/en-US/docs/Web/Accessibility");
  await expectFits(page);
  await page.screenshot({ path: info.outputPath("milestone-sheet-320.png"), fullPage: true });
  await page.getByRole("checkbox", { name: taskTitle }).uncheck();
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("checkbox", { name: taskTitle })).toBeEnabled();
  await page.getByRole("checkbox", { name: taskTitle }).check();
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute("aria-valuenow", "50");
  await page.reload();
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("navigation", { name: "Мой план", exact: true }).getByRole("link", { name: "Сегодня", exact: true }).click();
  await page.getByRole("button", { name: /Дополнительное задание/ }).click();
  await page.getByRole("button", { name: "Пропустить", exact: true }).click();
  await page.getByRole("button", { name: "Пропустить задание", exact: true }).click();
  await expect.poll(async () => (await account.db.careerMission.findUnique({ where: { id: skipped.id } }))!.status).toBe("SKIPPED");
  expect((await account.db.careerMission.findUnique({ where: { id: mission.id } }))!.roadmapTaskId).toBe(roadmap.milestones[0].tasks[0].id);
  expect(await account.db.careerMission.count({ where: { userId: account.id } })).toBe(5);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard/plan?view=all");
    await expectFits(page);
    await page.screenshot({ path: info.outputPath(`plan-all-${width}.png`), fullPage: true });
  }
});

test("empty plan generates once, generates today's tasks, and keeps the goal after navigation", async ({ page, account }) => {
  const renderingErrors: string[] = [];
  page.on("console", message => {
    if (message.type() === "error" && /unique.*key|hydration/i.test(message.text())) renderingErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, account.email);
  await page.goto("/dashboard/plan");
  await expect(page.getByRole("heading", { name: "Мой план", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Сгенерировать дорожную карту", exact: true }).click();
  await page.getByPlaceholder("Напиши любую профессию…").fill("Frontend-разработчик");
  await page.getByRole("button", { name: "Построить план", exact: true }).click();
  await expect(page.locator('[role="progressbar"]')).toBeVisible();
  await page.getByRole("button", { name: "Сгенерировать задания", exact: true }).click();
  await expect(page.getByText("Главное задание дня", { exact: true })).toBeVisible();
  const before = await account.db.roadmap.findUnique({ where: { userId: account.id } });
  await page.getByRole("navigation", { name: "Мой план", exact: true }).getByRole("link", { name: "Весь план" }).click();
  await page.reload();
  expect((await account.db.roadmap.findUnique({ where: { userId: account.id } }))!.id).toBe(before!.id);
  expect(await account.db.careerMission.count({ where: { userId: account.id } })).toBeGreaterThan(0);
  await expectFits(page);
  expect(renderingErrors).toEqual([]);
});
