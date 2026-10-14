import { expect, test } from "playwright-test-coverage";

test("updateUser name", async ({ page }) => {
	const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
	await page.goto("/");
	await page.getByRole("link", { name: "Register" }).click();
	await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
	await page.getByRole("textbox", { name: "Email address" }).fill(email);
	await page.getByRole("textbox", { name: "Password" }).fill("diner");
	await page.getByRole("button", { name: "Register" }).click();

	await page.getByRole("link", { name: "pd" }).click();

	await expect(page.getByRole("main")).toContainText("pizza diner");

	await page.getByRole("button", { name: "Edit" }).click();
	await expect(page.locator("h3")).toContainText("Edit user");
	await page.getByRole("button", { name: "Update" }).click();

	await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });

	await expect(page.getByRole("main")).toContainText("pizza diner");

	await page.getByRole("button", { name: "Edit" }).click();
	await expect(page.locator("h3")).toContainText("Edit user");
	await page.getByRole("textbox").first().fill("pizza dinerx");
	await page.getByRole("button", { name: "Update" }).click();

	await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });

	await expect(page.getByRole("main")).toContainText("pizza dinerx");

	await page.getByRole("link", { name: "Logout" }).click();
	await page.getByRole("link", { name: "Login" }).click();

	await page.getByRole("textbox", { name: "Email address" }).fill(email);
	await page.getByRole("textbox", { name: "Password" }).fill("diner");
	await page.getByRole("button", { name: "Login" }).click();

	await page.getByRole("link", { name: "pd" }).click();

	await expect(page.getByRole("main")).toContainText("pizza dinerx");
});

test("updateUser email", async ({ page }) => {
	const email1 = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
	const email2 = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
	const email3 = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
	await page.goto("/");

	// Make a fake user first to then have a conflict when the user tries to change their email
	await page.getByRole("link", { name: "Register" }).click();
	await page.getByRole("textbox", { name: "Full name" }).fill("user 1");
	await page.getByRole("textbox", { name: "Email address" }).fill(email1);
	await page.getByRole("textbox", { name: "Password" }).fill("diner");
	await page.getByRole("button", { name: "Register" }).click();

	await page.getByRole("link", { name: "Logout" }).click();

	await page.getByRole("link", { name: "Register" }).click();
	await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
	await page.getByRole("textbox", { name: "Email address" }).fill(email2);
	await page.getByRole("textbox", { name: "Password" }).fill("diner");
	await page.getByRole("button", { name: "Register" }).click();

	await page.getByRole("link", { name: "pd" }).click();

	await expect(page.getByRole("main")).toContainText("pizza diner");

	await page.getByRole("button", { name: "Edit" }).click();
	await expect(page.locator("h3")).toContainText("Edit user");
	await page.locator('input[type="email"]').click({
		clickCount: 3,
	});
	await page.locator('input[type="email"]').fill(email1);

	await page.getByRole("button", { name: "Update" }).click();

	// Look for text "email already taken"
	await expect(page.getByRole("alert")).toContainText("email already taken");

	await page.locator('input[type="email"]').click({
		clickCount: 3,
	});
	await page.locator('input[type="email"]').fill(email3);

	await page.getByRole("button", { name: "Update" }).click();

	await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });

	await expect(page.getByRole("main")).toContainText(email3);

	await page.getByRole("link", { name: "Logout" }).click();
	await page.getByRole("link", { name: "Login" }).click();

	await page.getByRole("textbox", { name: "Email address" }).fill(email3);
	await page.getByRole("textbox", { name: "Password" }).fill("diner");
	await page.getByRole("button", { name: "Login" }).click();

	await page.getByRole("link", { name: "pd" }).click();

	await expect(page.getByRole("main")).toContainText("pizza diner");
});
