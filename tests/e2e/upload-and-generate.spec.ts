import { test, expect } from '@playwright/test';
import { generateSchedule, loginAsTestUser, uploadFilesForCase } from './helpers';

const hasAuth = Boolean(process.env.E2E_SUPABASE_EMAIL && process.env.E2E_SUPABASE_PASSWORD);

test.describe('Upload and generate smoke', () => {
  test.skip(!hasAuth, 'E2E credentials are missing.');

  test('[case:happy-path-minimal] uploads required files and generates schedule', async ({ page }) => {
    await loginAsTestUser(page);
    await uploadFilesForCase(page, 'happy-path-minimal', true, false);
    await generateSchedule(page);

    await expect(page.getByText('Assignments scheduled')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().toLowerCase()).toContain('schedule');
  });

  test('[case:happy-path-with-timeoff] timeoff rep is not scheduled on blocked date', async ({ page }) => {
    await loginAsTestUser(page);
    await uploadFilesForCase(page, 'happy-path-with-timeoff', true, true);
    await generateSchedule(page);

    await page.getByPlaceholder('Search reps or stores...').fill('2026-03-10');
    await expect(page.locator('tbody')).not.toContainText('Timeoff Target');
  });
});
