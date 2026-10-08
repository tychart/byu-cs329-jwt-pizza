import { test, expect } from "./testSetup";
import { diner, fillLogin, installApiMocks, orderPizzas } from "./mocks";

test("checkout while signed out redirects to login and returns", async ({ page }) => {
  await installApiMocks(page);
  await orderPizzas(page, ["Veggie", "Pepperoni"]);

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await fillLogin(page, diner);

  await expect(page.getByRole("heading", { name: "So worth it" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Send me those 2 pizzas right now!");
});

test("pay now places the order and lands on delivery", async ({ page }) => {
  await installApiMocks(page, { user: diner });
  await orderPizzas(page, ["Veggie", "Pepperoni"]);

  await page.getByRole("button", { name: "Pay now" }).click();

  await expect(page.getByRole("heading", { name: "Here is your JWT Pizza!" })).toBeVisible();
  await expect(page.getByText("pie count:")).toBeVisible();
  await expect(page.getByRole("main")).toContainText("0.008");
});

test("a failed order is reported to the user", async ({ page }) => {
  await installApiMocks(page, { user: diner, orderError: true });
  await orderPizzas(page, ["Veggie"]);

  await page.getByRole("button", { name: "Pay now" }).click();

  await expect(page.getByText("Your card was declined")).toBeVisible();
});

test("cancel returns to the menu with the order intact", async ({ page }) => {
  await installApiMocks(page, { user: diner });
  await orderPizzas(page, ["Veggie"]);

  await expect(page.getByRole("main")).toContainText("Send me that pizza right now!");

  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("heading", { name: "Awesome is a click away" })).toBeVisible();
  await expect(page.getByText("Selected pizzas: 1")).toBeVisible();
});
