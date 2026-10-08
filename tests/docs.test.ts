import { test, expect } from "./testSetup";
import { installApiMocks } from "./mocks";

test("documents the pizza service API", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/docs");

  await expect(page.getByRole("heading", { name: "JWT Pizza API" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("/api/order/menu");
  await expect(page.getByRole("link", { name: "http://localhost:3000" })).toBeVisible();
});

test("documents the pizza factory API", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/docs/factory");

  await expect(page.getByRole("heading", { name: "JWT Pizza API" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("/api/order/verify");
  await expect(
    page.getByRole("link", { name: "https://pizza-factory.cs329.click" }),
  ).toBeVisible();
});
