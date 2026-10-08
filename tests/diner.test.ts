import { test, expect } from "./testSetup";
import { diner, franchisee, installApiMocks, orders } from "./mocks";

test("shows the order history for a signed in diner", async ({ page }) => {
  await installApiMocks(page, { user: diner, orders });
  await page.goto("/diner-dashboard");

  await expect(page.getByRole("heading", { name: "Your pizza kitchen" })).toBeVisible();
  await expect(page.getByText("Kai Chen")).toBeVisible();
  await expect(page.getByText("d@jwt.com")).toBeVisible();

  const table = page.locator("table");
  await expect(table).toContainText("23");
  await expect(table).toContainText("24");
  await expect(table).toContainText("0.004 ₿");
  await expect(table).toContainText("0.008 ₿");
});

test("prompts a diner with no orders", async ({ page }) => {
  await installApiMocks(page, { user: diner, orders: [] });
  await page.goto("/diner-dashboard");

  await expect(page.getByRole("heading", { name: "Your pizza kitchen" })).toBeVisible();
  await expect(page.getByText(/How have you lived this long/)).toBeVisible();
});

test("formats a franchisee role", async ({ page }) => {
  await installApiMocks(page, { user: franchisee, orders: [] });
  await page.goto("/diner-dashboard");

  await expect(page.getByText("Franchisee on 2")).toBeVisible();
});

test("the edit user dialog can be opened and closed", async ({ page }) => {
  await installApiMocks(page, { user: diner, orders: [] });
  await page.goto("/diner-dashboard");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Edit" }).click();
  await expect(dialog).toBeVisible();

  await page.getByRole("button", { name: "Update" }).click();
  await expect(dialog).toBeHidden();
});
