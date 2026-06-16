import { test, expect } from '@playwright/test';

test.describe('Tenant Onboarding Flow (Tenant & Contract)', () => {
  // Use the authenticated state stored in authFile
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should create a tenant and a contract', async ({ page }) => {
    // Increase timeout significantly for this multi-step flow
    test.setTimeout(120000);

    const timestamp = Date.now();
    const tenantName = `Khách thuê E2E ${timestamp}`;
    const idNumber = `079${timestamp.toString().slice(-9)}`; // 12 chars

    // ==========================================
    // 1. CREATE TENANT
    // ==========================================
    await page.goto('/tenants');
    await expect(page.getByRole('button', { name: /Thêm khách thuê/i })).toBeVisible();

    // Click Add
    await page.getByRole('button', { name: /Thêm khách thuê/i }).click();

    // Fill form
    await expect(page.locator('#full_name')).toBeVisible();
    await page.locator('#full_name').fill(tenantName);
    await page.locator('#phone').fill('0912345678');
    await page.locator('#id_number').fill(idNumber);

    // Submit - button says 'Thêm mới'
    await page.getByRole('button', { name: 'Thêm mới' }).click();

    // Verify tenant appears in the table (page reloads on success)
    await expect(page.locator('.ant-table-wrapper').filter({ hasText: tenantName })).toBeVisible({ timeout: 15000 });

    // ==========================================
    // 2. CREATE CONTRACT
    // ==========================================
    await page.goto('/contracts');
    // Button on the page toolbar says 'Tạo hợp đồng'
    await expect(page.getByRole('button', { name: /Tạo hợp đồng/i })).toBeVisible();

    // Click Add
    await page.getByRole('button', { name: /Tạo hợp đồng/i }).click();

    // Wait for modal and Antd selects to mount fully
    await page.waitForTimeout(1000);

    // 2.1 Select Building (Pick the first available)
    await page.locator('.ant-select').filter({ hasText: 'Chọn tòa nhà' }).click();
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first().click();
    await page.waitForTimeout(500);

    // 2.2 Select Room (Pick the first available, non-disabled room)
    await page.locator('.ant-select').filter({ hasText: 'Chọn phòng' }).click();
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option:not(.ant-select-item-option-disabled)').first().click();
    await page.waitForTimeout(500);

    // 2.3 Select Tenant (pick the first = our newly created one)
    await page.locator('.ant-select').filter({ hasText: 'Chọn khách thuê' }).click();
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first().click();
    await page.waitForTimeout(500);

    // 2.4 Start Date - fill directly into the input, then click modal title to close popup
    const dateInput = page.locator('.ant-form-item').filter({ hasText: 'Ngày bắt đầu' }).locator('input').first();
    await dateInput.fill('01/01/2026');
    // Click modal title to dismiss datepicker popup without closing the modal
    await page.locator('.ant-modal-title').click();
    await page.waitForTimeout(300);

    // 2.5 Fill Rent Amount (InputNumber — click then type)
    const rentInput = page.locator('.ant-form-item').filter({ hasText: 'Giá thuê' }).locator('input').first();
    await rentInput.click({ clickCount: 3 });
    await rentInput.type('3500000');

    // 2.6 Fill Deposit
    const depositInput = page.locator('.ant-form-item').filter({ hasText: 'Tiền cọc' }).locator('input').first();
    await depositInput.click({ clickCount: 3 });
    await depositInput.type('3500000');

    // 2.7 Select Status (required field!)
    await page.locator('.ant-form-item').filter({ hasText: 'Trạng thái' }).locator('.ant-select').click();
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').filter({ hasText: 'Đang hiệu lực' }).click();
    await page.waitForTimeout(300);

    // 2.8 Submit Contract — click the primary (blue) button in modal footer
    await page.locator('.ant-modal-footer .ant-btn-primary').click();

    // Verify: modal closes and contracts page reloads successfully
    // (onSuccess calls window.location.reload(), toast appears before reload)
    await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/contracts/);
    // Page should show contracts table after reload
    await expect(page.locator('.ant-table-wrapper')).toBeVisible({ timeout: 15000 });
  });
});
