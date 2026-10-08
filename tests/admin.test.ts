import { test, expect } from "./testSetup";
import { admin, diner, installApiMocks } from "./mocks";

test("a non-admin cannot see the admin dashboard", async ({ page }) => {
  await installApiMocks(page, { user: diner });
  await page.goto("/admin-dashboard");

  await expect(page.getByRole("heading", { name: "Oops" })).toBeVisible();
  await expect(page.getByText(/dropped a pizza on the floor/)).toBeVisible();
});

test("lists franchises, admins, and store revenue", async ({ page }) => {
  await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  await expect(page.getByRole("heading", { name: "Mama Ricci's kitchen" })).toBeVisible();
  await expect(page.locator("table")).toContainText("LotaPizza");
  await expect(page.locator("table")).toContainText("PizzaCorp");
  await expect(page.locator("table")).toContainText("Fran Franchise");
  await expect(page.locator("table")).toContainText("Lehi");
  await expect(page.locator("table")).toContainText("1,234 ₿");
});

test("pages through franchises", async ({ page }) => {
  await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  const next = page.getByRole("button", { name: "»" });
  const previous = page.getByRole("button", { name: "«" });
  await expect(next).toBeEnabled();
  await expect(previous).toBeDisabled();

  await next.click();

  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();
});

test("filters franchises by name", async ({ page }) => {
  await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  await page.getByPlaceholder("Filter franchises").fill("Corp");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.locator("table")).toContainText("PizzaCorp");
  await expect(page.getByText("LotaPizza")).toHaveCount(0);
});

test("creates a franchise", async ({ page }) => {
  const state = await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  await page.getByRole("button", { name: "Add Franchise" }).click();
  await expect(page.getByRole("heading", { name: "Create franchise" })).toBeVisible();

  await page.getByPlaceholder("franchise name").fill("NewCo");
  await page.getByPlaceholder("franchisee admin email").fill("new@jwt.com");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByRole("heading", { name: "Mama Ricci's kitchen" })).toBeVisible();
  expect(state.createdFranchises).toEqual([
    {
      id: "",
      name: "NewCo",
      stores: [],
      admins: [{ email: "new@jwt.com" }],
    },
  ]);
});

test("closes a franchise", async ({ page }) => {
  const state = await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  await page
    .getByRole("row", { name: /LotaPizza/ })
    .getByRole("button", { name: "Close" })
    .click();

  await expect(page.getByRole("heading", { name: "Sorry to see you go" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("LotaPizza");

  await page.getByRole("button", { name: "Close", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Mama Ricci's kitchen" })).toBeVisible();
  expect(state.closedFranchises).toEqual(["2"]);
});

test("closes a store from the admin dashboard", async ({ page }) => {
  const state = await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  await page
    .getByRole("row", { name: /Lehi/ })
    .getByRole("button", { name: "Close" })
    .click();

  await expect(page.getByRole("heading", { name: "Sorry to see you go" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Lehi");

  await page.getByRole("button", { name: "Close", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Mama Ricci's kitchen" })).toBeVisible();
  expect(state.closedStores).toHaveLength(1);
});
