import { test, expect } from '@playwright/test';
import { generateSchedule, loginAsTestUser, uploadFilesForCase } from './helpers';

const hasAuth = Boolean(process.env.E2E_SUPABASE_EMAIL && process.env.E2E_SUPABASE_PASSWORD);

test.describe('Edge-case smoke', () => {
  test.skip(!hasAuth, 'E2E credentials are missing.');

  test('[case:missing-availability-file] shows required upload validation error', async ({ page }) => {
    await loginAsTestUser(page);
    await uploadFilesForCase(page, 'missing-availability-file', false, false);

    await page.getByRole('button', { name: 'Generate Weekly Plan' }).click();
    await expect(page.getByText('Please complete all required data uploads.')).toBeVisible();
  });

  test('[case:inactive-rep-not-scheduled] inactive rep is not shown in schedule table', async ({ page }) => {
    await loginAsTestUser(page);
    await uploadFilesForCase(page, 'inactive-rep-not-scheduled', true, false);
    await generateSchedule(page);

    await expect(page.locator('tbody')).not.toContainText('Inactive Member');
  });
});
