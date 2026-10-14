import type { Page } from "@playwright/test";
import { test, expect } from "./testSetup";
import { Role, type User } from "../src/service/pizzaService";
import { admin, diner, installApiMocks } from "./mocks";

const franchisesRegion = (page: Page) =>
  page.getByRole("region", { name: "Franchises" });
const usersRegion = (page: Page) =>
  page.getByRole("region", { name: "Users" });

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
  await expect(franchisesRegion(page).locator("table")).toContainText("LotaPizza");
  await expect(franchisesRegion(page).locator("table")).toContainText("PizzaCorp");
  await expect(franchisesRegion(page).locator("table")).toContainText("Fran Franchise");
  await expect(franchisesRegion(page).locator("table")).toContainText("Lehi");
  await expect(franchisesRegion(page).locator("table")).toContainText("1,234 ₿");
});

test("pages through franchises", async ({ page }) => {
  await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  const next = franchisesRegion(page).getByRole("button", { name: "»" });
  const previous = franchisesRegion(page).getByRole("button", { name: "«" });
  await expect(next).toBeEnabled();
  await expect(previous).toBeDisabled();

  await next.click();

  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();
});

test("filters franchises by name", async ({ page }) => {
  await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  await franchisesRegion(page).getByPlaceholder("Filter franchises").fill("Corp");
  await franchisesRegion(page).getByRole("button", { name: "Submit" }).click();

  await expect(franchisesRegion(page).locator("table")).toContainText("PizzaCorp");
  await expect(franchisesRegion(page).getByText("LotaPizza")).toHaveCount(0);
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

  await franchisesRegion(page)
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

  await franchisesRegion(page)
    .getByRole("row", { name: /Lehi/ })
    .getByRole("button", { name: "Close" })
    .click();

  await expect(page.getByRole("heading", { name: "Sorry to see you go" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Lehi");

  await page.getByRole("button", { name: "Close", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Mama Ricci's kitchen" })).toBeVisible();
  expect(state.closedStores).toHaveLength(1);
});

test("lists users with their name, email, and role", async ({ page }) => {
  await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  const table = usersRegion(page).locator("table");
  await expect(table).toContainText("Kai Chen");
  await expect(table).toContainText("d@jwt.com");
  await expect(table).toContainText("Ada Admin");
  await expect(table).toContainText("a@jwt.com");
  await expect(table).toContainText("diner");
  await expect(table).toContainText("admin");
});

test("filters users by name", async ({ page }) => {
  await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  await usersRegion(page).getByPlaceholder("Filter users").fill("Kai");
  await usersRegion(page).getByRole("button", { name: "Submit" }).click();

  await expect(usersRegion(page).locator("table")).toContainText("Kai Chen");
  await expect(usersRegion(page).getByText("Ada Admin")).toHaveCount(0);
});

test("pages through users", async ({ page }) => {
  const extras: User[] = Array.from({ length: 6 }, (_, i) => ({
    id: String(200 + i),
    name: `User ${i}`,
    email: `user${i}@jwt.com`,
    roles: [{ role: Role.Diner }],
  }));

  await installApiMocks(page, { user: admin, users: [admin, ...extras] });
  await page.goto("/admin-dashboard");

  const next = usersRegion(page).getByRole("button", { name: "»" });
  const previous = usersRegion(page).getByRole("button", { name: "«" });
  await expect(next).toBeEnabled();
  await expect(previous).toBeDisabled();

  await next.click();

  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();
});

test("deletes a user", async ({ page }) => {
  const state = await installApiMocks(page, { user: admin });
  await page.goto("/admin-dashboard");

  await usersRegion(page)
    .getByRole("row", { name: /Kai Chen/ })
    .getByRole("button", { name: "Delete" })
    .click();

  await expect(usersRegion(page).locator("table")).not.toContainText("Kai Chen");
  expect(state.deletedUsers).toEqual(["3"]);
});
