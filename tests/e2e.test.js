const { test, expect } = require('@playwright/test');

test('homepage renders summary cards and weekly recaps', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Projects Hub');
  await expect(page.getByRole('heading', { name: 'Weekly Recaps' })).toBeVisible();
  await expect(page.locator('#weeklyRecaps')).toContainText('Deployed the dashboard');
  await expect(page.locator('#activeProjects')).toContainText('Projects Hub');
});
