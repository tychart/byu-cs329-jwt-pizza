import { test, expect } from "./testSetup";
import { alphaFranchise, franchisee, installApiMocks } from "./mocks";

test("pitches the franchise business when the user has none", async ({ page }) => {
  await installApiMocks(page, { user: franchisee });
  await page.goto("/franchise-dashboard");

  await expect(page.getByRole("heading", { name: "So you want a piece of the pie?" })).toBeVisible();
  await expect(page.getByText("Unleash Your Potential")).toBeVisible();
  await expect(page.getByRole("link", { name: "800-555-5555" })).toBeVisible();
});

test("shows the stores owned by the franchisee", async ({ page }) => {
  await installApiMocks(page, { user: franchisee, franchise: [alphaFranchise] });
  await page.goto("/franchise-dashboard");

  await expect(page.getByRole("heading", { name: "LotaPizza" })).toBeVisible();
  await expect(page.locator("table")).toContainText("Lehi");
  await expect(page.locator("table")).toContainText("Springville");
  await expect(page.locator("table")).toContainText("1,234 ₿");
});

test("creates a store", async ({ page }) => {
  const state = await installApiMocks(page, {
    user: franchisee,
    franchise: [alphaFranchise],
  });
  await page.goto("/franchise-dashboard");

  await page.getByRole("button", { name: "Create store" }).click();
  await expect(page.getByRole("heading", { name: "Create store" })).toBeVisible();

  await page.getByPlaceholder("store name").fill("Provo");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByRole("heading", { name: "LotaPizza" })).toBeVisible();
  expect(state.createdStores).toEqual([{ id: "", name: "Provo" }]);
});

test("closes a store", async ({ page }) => {
  const state = await installApiMocks(page, {
    user: franchisee,
    franchise: [alphaFranchise],
  });
  await page.goto("/franchise-dashboard");

  await page.getByRole("button", { name: "Close" }).first().click();
  await expect(page.getByRole("heading", { name: "Sorry to see you go" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Lehi");

  await page.getByRole("button", { name: "Close", exact: true }).click();

  await expect(page.getByRole("heading", { name: "LotaPizza" })).toBeVisible();
  expect(state.closedStores).toHaveLength(1);
});
