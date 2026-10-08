import { test, expect } from "./testSetup";

test("home page", async ({ page }) => {
  await page.goto("/");
  expect(await page.title()).toBe("JWT Pizza");
  await expect(page.getByRole("heading", { name: "The web's best pizza" })).toBeVisible();
});

test("about page", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "The secret sauce" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Our employees" })).toBeVisible();
});

test("history page", async ({ page }) => {
  await page.goto("/history");
  await expect(page.getByRole("heading", { name: "Mama Rucci, my my" })).toBeVisible();
  await expect(page.getByText(/Mama Ricci's kitchen/)).toBeVisible();
});

test("unknown routes show the not found page", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "Oops" })).toBeVisible();
  await expect(page.getByText(/dropped a pizza on the floor/)).toBeVisible();
});
