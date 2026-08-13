import { test, expect } from "@playwright/test";

test("sign up, add a book with a review, and find it in the catalog", async ({ page }) => {
  const unique = Date.now();
  const email = `e2e-${unique}@example.com`;
  const bookTitle = `E2E Test Book ${unique}`;
  const reviewBody = "Прекрасная книга, прочитал за один вечер!";

  await page.goto("/auth");
  await page.getByRole("button", { name: "Еще нет аккаунта?" }).click();

  await page.locator("#name1").fill("E2E Tester");
  await page.locator("#em1").fill(email);
  await page.locator("#pass1").fill("e2e-password-123");
  await page.locator("#pass2").fill("e2e-password-123");

  // Anti-bot check rejects submissions faster than 1500ms after the form rendered.
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page).toHaveURL(/confirm-email/);

  await page.goto("/office");
  await page.getByRole("button", { name: "Добавить книгу" }).click();
  await page.getByRole("button", { name: "Добавить свою" }).click();

  await page.getByPlaceholder("Название").fill(bookTitle);
  await page.getByPlaceholder("Автор").fill("E2E Author");
  await page.getByPlaceholder("Год").fill("2020");
  await page.getByPlaceholder("URL обложки").fill("https://covers.openlibrary.org/b/id/240727-L.jpg");
  await page.locator('select[name="genre"]').selectOption("Роман");
  await page.getByPlaceholder("Написать рецензию").fill(reviewBody);
  await page.getByRole("radio", { name: "Оценка 5 из 5" }).click();

  await page.getByRole("button", { name: "Добавить рецензию" }).click();
  await expect(page.getByText("Книга успешно добавлена!")).toBeVisible();

  await page.goto("/");
  await page.getByPlaceholder("Поиск по названию").fill(bookTitle);
  const bookLink = page.getByRole("link", { name: bookTitle }).first();
  await expect(bookLink).toBeVisible();
  await bookLink.click();

  await expect(page.getByRole("heading", { name: bookTitle })).toBeVisible();
  await expect(page.getByRole("paragraph").filter({ hasText: reviewBody })).toBeVisible();
});
