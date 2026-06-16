import { test, expect } from '@playwright/test';

test.describe('Infrastructure Flow (Buildings & Rooms)', () => {
  // Use the authenticated state stored in authFile
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should create a building and a room', async ({ page }) => {
    // 1. CREATE BUILDING
    await page.goto('/buildings');
    
    // Wait for page to load completely
    await expect(page.getByRole('heading', { name: 'Quản lý Toà nhà' })).toBeVisible({ timeout: 15000 });

    // Click "Thêm toà nhà"
    await page.getByRole('button', { name: 'Thêm toà nhà' }).first().click();

    // Fill in building details
    await expect(page.locator('#name')).toBeVisible();
    
    // Append timestamp to make the name unique so it doesn't conflict in future tests
    const timestamp = Date.now().toString().slice(-6);
    const buildingName = `Toà nhà E2E Test ${timestamp}`;
    
    await page.fill('#name', buildingName);
    await page.fill('#address', '123 Đường Tự Động Hóa, Quận 1');
    await page.fill('#num_floors', '5');
    await page.fill('#description', 'Toà nhà được tạo tự động bởi Playwright.');

    // Click submit ("Thêm mới")
    await page.getByRole('button', { name: 'Thêm mới' }).click();

    // Wait for the modal to close indicating success
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });

    // Wait for the building card to appear in the list
    const buildingCard = page.locator('.ant-card').filter({ hasText: buildingName }).first();
    await expect(buildingCard).toBeVisible({ timeout: 15000 });

    // Click the actual link (EyeOutlined action) inside the card
    await buildingCard.locator('a').first().click();

    // Wait for Building Detail Page to load by URL
    await page.waitForURL('**/buildings/*');

    // Click "Thêm phòng" using Regex to be safe
    await page.getByRole('button', { name: /Thêm phòng/i }).first().click();

    // Fill in room details
    await expect(page.locator('#name')).toBeVisible();
    await page.fill('#name', 'P101-Test');
    await page.fill('#floor', '1');
    await page.fill('#area_m2', '30');
    await page.fill('#default_rent', '5000000');
    
    // Click submit ("Thêm mới")
    // Wait, the modal has tabs now, so the button might be 'Thêm mới' (single)
    await page.getByRole('button', { name: 'Thêm mới' }).click();

    // Verify room was created
    await expect(page.getByText('P101-Test')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot of success
    await page.screenshot({ path: `playwright-report/infrastructure-success.png` });
  });
});
