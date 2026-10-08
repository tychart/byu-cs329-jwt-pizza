import { test, expect } from "./testSetup";
import { diner, fillLogin, installApiMocks } from "./mocks";

test("register new user", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("test");
  await page.getByRole("textbox", { name: "Email address" }).fill("test@test.com");
  await page.getByRole("textbox", { name: "Password" }).fill("test");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.locator("#navbar-dark")).toContainText("Logout");
  await expect(page.getByRole("link", { name: "t", exact: true })).toBeVisible();
});

test("register reports an error", async ({ page }) => {
  await installApiMocks(page);
  // Override the auth route so registration is rejected.
  await page.route("*/**/api/auth", (route) =>
    route.fulfill({ status: 400, json: { message: "Email already in use" } }),
  );
  await page.goto("/register");
  await page.getByRole("textbox", { name: "Full name" }).fill("test");
  await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.getByText(/Email already in use/)).toBeVisible();
});

test("login", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await fillLogin(page, diner);

  await expect(page.getByRole("link", { name: "KC" })).toBeVisible();
});

test("login with bad credentials shows an error", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("nobody@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("wrong");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText(/Unauthorized/)).toBeVisible();
});

test("login fails gracefully when the service is unreachable", async ({ page }) => {
  await installApiMocks(page);
  // Override the auth route so the request is aborted, exercising the service catch.
  await page.route("*/**/api/auth", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText(/Failed to fetch/)).toBeVisible();
});

test("login and register link to each other", async ({ page }) => {
  await installApiMocks(page);
  await page.goto("/login");
  await page.getByRole("main").getByText("Register").click();
  await expect(page.getByRole("heading", { name: "Welcome to the party" })).toBeVisible();

  await page.getByRole("main").getByText("Login").click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("logout clears the session", async ({ page }) => {
  await installApiMocks(page, { user: diner });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "KC" })).toBeVisible();

  await page.getByRole("link", { name: "Logout" }).click();

  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
});

test("an expired session is discarded on load", async ({ page }) => {
  await installApiMocks(page, { user: diner, userMeError: true });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
});
