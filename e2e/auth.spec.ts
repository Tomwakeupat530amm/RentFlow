import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('should display error message on invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid credentials
    await page.locator('#login_email').fill('wrongemail@example.com');
    await page.locator('#login_password').fill('wrongpassword123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify that an error message (antd message) appears
    await expect(page.locator('.ant-message-error, .ant-message-notice').first()).toBeVisible({ timeout: 10000 });
    
    // Verify that we are still on the login page (no redirection)
    await expect(page).toHaveURL(/.*\/login/);
  });
});
