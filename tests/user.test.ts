import type { Page } from "@playwright/test";
import { expect, test } from "./testSetup";
import { installApiMocks } from "./mocks";

/** Random, collision-free email so the mocked user directory stays unique. */
function randomEmail() {
	return `user${Math.floor(Math.random() * 1_000_000)}@jwt.com`;
}

/** Fill out and submit the registration form (must already be on a page with the link). */
async function registerDiner(
	page: Page,
	{ name = "pizza diner", email, password = "diner" }: { name?: string; email: string; password?: string },
) {
	await page.getByRole("link", { name: "Register" }).click();
	await page.getByRole("textbox", { name: "Full name" }).fill(name);
	await page.getByRole("textbox", { name: "Email address" }).fill(email);
	await page.getByRole("textbox", { name: "Password" }).fill(password);
	await page.getByRole("button", { name: "Register" }).click();
}

async function login(page: Page, email: string, password: string) {
	await page.getByRole("link", { name: "Login" }).click();
	await page.getByRole("textbox", { name: "Email address" }).fill(email);
	await page.getByRole("textbox", { name: "Password" }).fill(password);
	await page.getByRole("button", { name: "Login" }).click();
}

async function logout(page: Page) {
	await page.getByRole("link", { name: "Logout" }).click();
}

test("updateUser name", async ({ page }) => {
	await installApiMocks(page);
	const email = randomEmail();
	await page.goto("/");
	await registerDiner(page, { email });

	await page.getByRole("link", { name: "pd" }).click();
	await expect(page.getByRole("main")).toContainText("pizza diner");

	// Opening and dismissing the dialog without changes leaves the user alone.
	await page.getByRole("button", { name: "Edit" }).click();
	await expect(page.locator("h3")).toContainText("Edit user");
	await page.getByRole("button", { name: "Update" }).click();
	await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });
	await expect(page.getByRole("main")).toContainText("pizza diner");

	// Change the name.
	await page.getByRole("button", { name: "Edit" }).click();
	await expect(page.locator("h3")).toContainText("Edit user");
	await page.getByRole("textbox").first().fill("pizza dinerx");
	await page.getByRole("button", { name: "Update" }).click();
	await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });
	await expect(page.getByRole("main")).toContainText("pizza dinerx");

	// Log out and back in to prove the change was persisted.
	await logout(page);
	await login(page, email, "diner");
	await page.getByRole("link", { name: "pd" }).click();
	await expect(page.getByRole("main")).toContainText("pizza dinerx");
});

test("updateUser email", async ({ page }) => {
	await installApiMocks(page);
	const email1 = randomEmail();
	const email2 = randomEmail();
	const email3 = randomEmail();
	await page.goto("/");

	// Register a second user first so the email is already taken.
	await registerDiner(page, { name: "user 1", email: email1 });
	await logout(page);

	await registerDiner(page, { name: "pizza diner", email: email2 });
	await page.getByRole("link", { name: "pd" }).click();
	await expect(page.getByRole("main")).toContainText("pizza diner");

	// Changing to an email that belongs to another user reports the conflict.
	await page.getByRole("button", { name: "Edit" }).click();
	await expect(page.locator("h3")).toContainText("Edit user");
	await page.locator('input[type="email"]').fill(email1);
	await page.getByRole("button", { name: "Update" }).click();
	await expect(page.getByRole("alert")).toContainText("email already taken");

	// A unique email succeeds and the dialog closes.
	await page.locator('input[type="email"]').fill(email3);
	await page.getByRole("button", { name: "Update" }).click();
	await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });
	await expect(page.getByRole("main")).toContainText(email3);

	// The new email is used to log back in.
	await logout(page);
	await login(page, email3, "diner");
	await page.getByRole("link", { name: "pd" }).click();
	await expect(page.getByRole("main")).toContainText("pizza diner");
});

test("updateUser password", async ({ page }) => {
	await installApiMocks(page);
	const email = randomEmail();
	await page.goto("/");
	await registerDiner(page, { email });

	await page.getByRole("link", { name: "pd" }).click();
	await page.getByRole("button", { name: "Edit" }).click();
	await page.locator("#password").fill("newpass");
	await page.getByRole("button", { name: "Update" }).click();
	await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });

	// The old password no longer works.
	await logout(page);
	await page.getByRole("link", { name: "Login" }).click();
	await page.getByRole("textbox", { name: "Email address" }).fill(email);
	await page.getByRole("textbox", { name: "Password" }).fill("diner");
	await page.getByRole("button", { name: "Login" }).click();
	await expect(page.getByText(/Unauthorized/)).toBeVisible();

	// The new password does.
	await page.getByRole("textbox", { name: "Password" }).fill("newpass");
	await page.getByRole("button", { name: "Login" }).click();
	await page.getByRole("link", { name: "pd" }).click();
	await expect(page.getByRole("main")).toContainText("pizza diner");
});
