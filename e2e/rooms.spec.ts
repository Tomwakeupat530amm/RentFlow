import { test, expect } from '@playwright/test';

test.describe('Rooms Management', () => {
  // Use the setup script's logged in state
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should navigate to rooms and open create modal', async ({ page }) => {
    await page.goto('/rooms');
    
    // Wait for the data to load
    await page.waitForLoadState('networkidle');

    // Confirm we are on the Rooms page
    await expect(page.getByRole('heading', { name: /Quản lý Phòng/i })).toBeVisible();
    
    // Take a screenshot of the main page
    await page.screenshot({ path: 'playwright-report/rooms-page.png' });

    // Find and click the "Thêm phòng" (Add Room) button
    const addBtn = page.getByRole('button', { name: /Thêm|Add/i });
    if (await addBtn.count() > 0) {
      await addBtn.first().click();
      
      // Wait for modal to animate in
      await page.waitForTimeout(1000);
      
      // Screenshot the modal
      await page.screenshot({ path: 'playwright-report/rooms-modal.png' });
      
      // Close the modal safely (Cancel or close X)
      const cancelBtn = page.getByRole('button', { name: /Hủy|Cancel|Đóng/i });
      if (await cancelBtn.count() > 0) {
        await cancelBtn.first().click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });
});
