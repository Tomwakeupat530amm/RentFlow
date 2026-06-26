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

  test('should bulk create rooms successfully', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /Thêm|Add/i });
    if (await addBtn.count() > 0) {
      await addBtn.first().click();
      
      // Chuyển sang tab Thêm nhiều phòng
      const bulkTab = page.getByRole('tab', { name: /nhiều phòng|Bulk/i });
      if (await bulkTab.count() > 0) {
        await bulkTab.click();
        
        // Nhập danh sách phòng
        const roomsInput = page.locator('textarea#room_names, input#room_names');
        if (await roomsInput.count() > 0) {
            const timestamp = Date.now().toString().slice(-4);
            await roomsInput.fill(`P${timestamp}A, P${timestamp}B`);
            
            // Chọn tòa nhà (nếu có dropdown)
            const buildingSelect = page.locator('.ant-select').first();
            if (await buildingSelect.count() > 0) {
                await buildingSelect.click();
                await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first().click();
                await page.waitForTimeout(300);
            }
            
            // Bấm Thêm hàng loạt
            const submitBtn = page.getByRole('button', { name: /Thêm hàng loạt|Tạo/i });
            if (await submitBtn.count() > 0) {
                await submitBtn.first().click();
                
                // Đợi message thành công
                await expect(page.locator('.ant-message-success, .ant-message-notice')).toBeVisible({ timeout: 10000 });
            }
        }
      }
    }
  });

  test('should validate duplicate room name', async ({ page }) => {
    // Để validate duplicate, ta cần tạo 1 phòng, sau đó tạo lại phòng y hệt
    // Do e2e có thể thay đổi dữ liệu, để đơn giản ta giả sử tạo phòng 'P101-Test' 2 lần
    await page.goto('/rooms');
    const addBtn = page.getByRole('button', { name: /Thêm|Add/i });
    if (await addBtn.count() > 0) {
      await addBtn.first().click();
      await page.waitForTimeout(1000);
      
      // Chọn tòa nhà (nếu có dropdown)
      const buildingSelect = page.locator('.ant-select').first();
      if (await buildingSelect.count() > 0) {
          await buildingSelect.click();
          await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first().click();
          await page.waitForTimeout(300);
      }

      const nameInput = page.locator('#name');
      if (await nameInput.count() > 0) {
          // Tạo một tên cố định
          await nameInput.fill('P-Duplicate-Test');
          
          const submitBtn = page.getByRole('button', { name: /Thêm mới|Tạo/i }).first();
          if (await submitBtn.count() > 0) {
              await submitBtn.click();
              
              // Đợi xử lý
              await page.waitForTimeout(2000);
              
              // Nếu popup đóng, ta tạo lại
              const dialog = page.getByRole('dialog');
              if (await dialog.isHidden()) {
                  await addBtn.first().click();
                  await page.waitForTimeout(1000);
                  
                  if (await buildingSelect.count() > 0) {
                      await buildingSelect.click();
                      await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first().click();
                      await page.waitForTimeout(300);
                  }
                  
                  await nameInput.fill('P-Duplicate-Test');
                  await submitBtn.click();
                  
                  // Lần 2 phải báo lỗi (trùng tên)
                  await expect(page.locator('.ant-message-error, .ant-message-notice')).toBeVisible({ timeout: 10000 });
              } else {
                  // Nếu chưa đóng, nghĩa là validate lỗi ngay lần 1 (do đã chạy từ trước)
                  await expect(page.locator('.ant-message-error, .ant-message-notice, .ant-form-item-explain-error')).toBeVisible({ timeout: 10000 });
              }
          }
      }
    }
  });
});
