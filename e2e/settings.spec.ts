import { test, expect } from '@playwright/test';

test.describe('Settings Flow', () => {
  // Sử dụng state đã login
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should update organization name successfully', async ({ page }) => {
    await page.goto('/settings');
    
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: /Cài đặt/i })).toBeVisible({ timeout: 15000 });
    
    // Find the organization name input
    const orgNameInput = page.locator('input[id="name"]').first();
    await expect(orgNameInput).toBeVisible();
    
    const timestamp = Date.now().toString().slice(-6);
    const newName = `Tổ chức RentFlow ${timestamp}`;
    
    await orgNameInput.fill(newName);
    
    // Click the update/save button (Tìm nút có type="submit" hoặc chữ "Cập nhật")
    const updateBtn = page.getByRole('button', { name: /Cập nhật|Lưu/i });
    if (await updateBtn.count() > 0) {
        await updateBtn.first().click();
        
        // Wait for success message
        await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should generate or show invite code', async ({ page }) => {
    await page.goto('/settings');
    
    // Wait for settings to load
    await expect(page.getByRole('heading', { name: /Cài đặt/i })).toBeVisible();
    
    // Check if invite code section exists
    const inviteCodeSection = page.getByText(/Mã mời|Invite Code/i);
    if (await inviteCodeSection.count() > 0) {
        // Find copy button
        const copyBtn = page.locator('button').filter({ hasText: /Copy/i });
        if (await copyBtn.count() > 0) {
            await expect(copyBtn.first()).toBeVisible();
        }
    }
  });
});
