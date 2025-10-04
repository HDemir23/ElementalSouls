import { test } from '@playwright/test';

test.describe('Evolve flow', () => {
  test.skip(true, 'Requires running backend + blockchain simulation');

  test('user evolves a token', async ({ page }) => {
    await page.goto('/evolve');
    // Additional steps implemented once backend is available.
  });
});
