import { test, expect } from './testSetup';

const validUsers: Record<string, { name: string; id: string }> = {
  'a@jwt.com': { name: 'Admin', id: '1' },
  'd@jwt.com': { name: 'Kai Chen', id: '3' },
};

test('login with a@jwt.com', async ({ page }) => {
  // Mock API routes
  await page.route('*/**/api/auth', async (route) => {
    const body = route.request().postDataJSON();
    const user = validUsers[body.email];
    if (!user) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
      return;
    }
    await route.fulfill({
      json: {
        user: { ...user, email: body.email, password: body.password, roles: [{ role: 'diner' }] },
        token: 'test-token',
      },
    });
  });

  await page.route('*/**/api/user/me', async (route) => {
    await route.fulfill({
      json: { ...validUsers['a@jwt.com'], email: 'a@jwt.com', roles: [{ role: 'diner' }] },
    });
  });

  await page.route('*/**/api/order/menu', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('*/**/api/franchise', async (route) => {
    await route.fulfill({ json: { franchises: [] } });
  });

  // Navigate and log in
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();

  // Assert login succeeded (link shows user initials)
  await expect(page.getByRole('link', { name: 'A', exact: true })).toBeVisible();
});