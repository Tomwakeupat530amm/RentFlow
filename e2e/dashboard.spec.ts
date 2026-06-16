import { test, expect } from '@playwright/test';

test.describe('Dashboard Features', () => {
  // Use the setup script's logged in state
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should load the dashboard and display overview cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for the main layout/sidebar
    await expect(page.locator('aside')).toBeVisible();

    // Check for summary cards (Revenue, Occupancy, etc.)
    await expect(page.getByText('Đang cho thuê').first()).toBeVisible();

    // Take a screenshot to prove it rendered
    await page.screenshot({ path: 'playwright-report/dashboard.png' });
  });

  test('should navigate to rooms management successfully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on the sidebar link to Rooms
    await page.click('text="Quản lý phòng"');

    // Wait for the route to load
    await page.waitForURL('**/rooms');

    // Confirm we are on the Rooms page
    await expect(page.getByRole('heading', { name: /Quản lý Phòng/i })).toBeVisible();
  });
});
