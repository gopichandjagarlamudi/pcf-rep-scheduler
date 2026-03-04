import fs from 'node:fs';
import path from 'node:path';
import { expect, Page } from '@playwright/test';

export function fixtureFile(caseId: string, fileName: string): string {
  return path.resolve(process.cwd(), 'tests/generated-fixtures', caseId, fileName);
}

export async function loginAsTestUser(page: Page): Promise<void> {
  const email = process.env.E2E_SUPABASE_EMAIL;
  const password = process.env.E2E_SUPABASE_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_SUPABASE_EMAIL and E2E_SUPABASE_PASSWORD are required for e2e tests.');
  }

  await page.goto('/');

  const signInButton = page.getByRole('button', { name: 'Sign In' });
  if (await signInButton.isVisible({ timeout: 10000 }).catch(() => false)) {
    await page.getByPlaceholder('user@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await signInButton.click();
  }

  await expect(page.getByText('Data Pipeline')).toBeVisible({ timeout: 30000 });
}

export async function uploadFilesForCase(page: Page, caseId: string, includeAvailability = true, includeTimeoff = true): Promise<void> {
  const inputs = page.locator('input[type="file"]');

  await inputs.nth(0).setInputFiles(fixtureFile(caseId, 'reps.csv'));
  await inputs.nth(1).setInputFiles(fixtureFile(caseId, 'locations.csv'));

  const availabilityPath = fixtureFile(caseId, 'availability.csv');
  if (includeAvailability && fs.existsSync(availabilityPath)) {
    await inputs.nth(2).setInputFiles(availabilityPath);
  }

  const timeoffPath = fixtureFile(caseId, 'timeoff.csv');
  if (includeTimeoff && fs.existsSync(timeoffPath)) {
    await inputs.nth(3).setInputFiles(timeoffPath);
  }
}

export async function generateSchedule(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Generate Weekly Plan' }).click();
  await expect(page.getByText('Work Schedule')).toBeVisible({ timeout: 30000 });
}
