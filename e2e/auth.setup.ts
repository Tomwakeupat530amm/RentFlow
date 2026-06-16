import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  console.log('Logging in with test account...', process.env.TEST_EMAIL);
  
  await page.goto('/login');
  await page.fill('#login_email', process.env.TEST_EMAIL!);
  await page.fill('#login_password', process.env.TEST_PASSWORD!);
  
  // Submit the form
  await page.click('button[type="submit"]');

  // Next.js might redirect to /dashboard
  await page.waitForURL('**/dashboard');
  
  // Wait until a specific dashboard element is visible to ensure full hydration
  await expect(page.locator('text=Tổng Doanh Thu')).toBeVisible({ timeout: 15000 });
  
  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
