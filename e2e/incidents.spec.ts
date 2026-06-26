import { test, expect } from '@playwright/test';

test.describe('Incidents Flow', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should create and drag-and-drop incident to change status', async ({ page }) => {
    await page.goto('/incidents');
    
    // Đợi trang load xong
    await expect(page.getByRole('heading', { name: /Sự cố|Incidents/i })).toBeVisible({ timeout: 15000 });

    // Click nút "Báo cáo sự cố"
    const addBtn = page.getByRole('button', { name: 'Báo cáo sự cố' });
    await addBtn.click();

    // Đợi Modal xuất hiện
    await expect(page.locator('.ant-modal-content')).toBeVisible({ timeout: 5000 });

    // Chọn Tòa nhà (Bắt buộc)
    await page.locator('#building_id').click();
    await page.locator('.ant-select-item-option').first().click();

    // Điền tiêu đề sự cố
    const incidentTitle = `Sự cố bóng đèn cháy ${Date.now()}`;
    await page.locator('#title').fill(incidentTitle);

    // Điền mô tả
    await page.locator('#description').fill('Bóng đèn hành lang tầng 2 bị cháy cần thay thế.');

    // Gửi báo cáo
    await page.locator('button[type="submit"]').click();

    // Đợi thông báo thành công
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 10000 });

    // Đợi Modal đóng
    await expect(page.locator('.ant-modal-content')).not.toBeVisible();

    // Tìm thẻ sự cố vừa tạo
    const card = page.locator('.ant-card', { hasText: incidentTitle }).first();
    await expect(card).toBeVisible({ timeout: 5000 });

    // Drag-and-drop thẻ từ cột "Mới báo cáo" sang "Đang xử lý"
    const inProgressColumn = page.locator('div').filter({ hasText: 'Đang xử lý' }).first();
    await card.dragTo(inProgressColumn);

    // Xác nhận cập nhật trạng thái thành công qua Antd message
    await expect(page.locator('.ant-message-success').first()).toBeVisible({ timeout: 10000 });
  });
});
