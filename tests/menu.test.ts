import { test, expect } from "./testSetup";
import { diner, installApiMocks } from "./mocks";

test("menu lists pizzas and enables checkout once a store and pizza are picked", async ({
  page,
}) => {
  await installApiMocks(page);
  await page.goto("/menu");

  await expect(page.getByRole("heading", { name: "Awesome is a click away" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Image Description Veggie" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Image Description Pepperoni" })).toBeVisible();

  const checkout = page.getByRole("button", { name: "Checkout" });
  await expect(checkout).toBeDisabled();
  await expect(page.getByText(/What are you waiting for/)).toBeVisible();

  // Picking a store alone is not enough.
  await page.getByRole("combobox").selectOption("4");
  await expect(checkout).toBeDisabled();

  await page.getByRole("link", { name: "Image Description Veggie" }).click();
  await expect(page.getByText("Selected pizzas: 1")).toBeVisible();
  await expect(checkout).toBeEnabled();
});

test("checkout takes the selected pizzas to payment", async ({ page }) => {
  await installApiMocks(page, { user: diner });
  await page.goto("/menu");

  await page.getByRole("combobox").selectOption("5");
  await page.getByRole("link", { name: "Image Description Veggie" }).click();
  await page.getByRole("link", { name: "Image Description Pepperoni" }).click();
  await expect(page.getByText("Selected pizzas: 2")).toBeVisible();

  await page.getByRole("button", { name: "Checkout" }).click();

  await expect(page.getByRole("heading", { name: "So worth it" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Send me those 2 pizzas right now!");
  await expect(page.locator("tbody")).toContainText("Veggie");
  await expect(page.locator("tfoot")).toContainText("0.008 ₿");
});
