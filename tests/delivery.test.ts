import { test, expect } from "./testSetup";
import { diner, installApiMocks, orderPizzas } from "./mocks";

test("delivery summarises the order and verifies a valid JWT", async ({ page }) => {
  await installApiMocks(page, { user: diner });
  await orderPizzas(page, ["Veggie", "Pepperoni"]);
  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page.getByRole("heading", { name: "Here is your JWT Pizza!" })).toBeVisible();

  await page.getByRole("button", { name: "Verify" }).click();

  await expect(page.locator("#hs-jwt-modal")).toBeVisible();
  await expect(page.locator("#hs-jwt-modal h3")).toHaveText(/JWT Pizza - valid/);
  await expect(page.locator("#hs-jwt-modal pre")).toContainText("23");
});

test("delivery reports an invalid JWT", async ({ page }) => {
  await installApiMocks(page, { user: diner, verifyInvalid: true });
  await orderPizzas(page, ["Veggie"]);
  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page.getByRole("heading", { name: "Here is your JWT Pizza!" })).toBeVisible();

  await page.getByRole("button", { name: "Verify" }).click();

  await expect(page.locator("#hs-jwt-modal h3")).toContainText("invalid JWT");
});

test("order more returns to the menu", async ({ page }) => {
  await installApiMocks(page, { user: diner });
  await orderPizzas(page, ["Veggie"]);
  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page.getByRole("heading", { name: "Here is your JWT Pizza!" })).toBeVisible();

  await page.getByRole("button", { name: "Order more" }).click();

  await expect(page.getByRole("heading", { name: "Awesome is a click away" })).toBeVisible();
});
