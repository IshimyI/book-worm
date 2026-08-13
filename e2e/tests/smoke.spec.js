import { test, expect } from "@playwright/test";

test("homepage loads the book catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Mr Book Worm").first()).toBeVisible();
  await expect(page.getByPlaceholder("Поиск по названию")).toBeVisible();
});

test("auth page toggles between login and signup forms", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

  await page.getByRole("button", { name: "Еще нет аккаунта?" }).click();
  await expect(page.getByRole("heading", { name: "Регистрация" })).toBeVisible();
});
