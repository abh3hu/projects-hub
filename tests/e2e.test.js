const { test, expect } = require('@playwright/test');

test('homepage renders summary cards and active project', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Projects Hub');
  await expect(page.getByRole('heading', { name: 'Active Projects' })).toBeVisible();
  await expect(page.locator('#activeProjects')).toContainText('Projects Hub');
});
