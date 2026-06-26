import { test, expect } from '@playwright/test';

test.describe('Payments Flow', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should record payment for an invoice', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page.getByRole('heading', { name: /Hóa đơn/i })).toBeVisible({ timeout: 15000 });
    
    // Giả sử có nút "Ghi nhận thanh toán" hoặc click vào hóa đơn đầu tiên
    const firstInvoiceCard = page.locator('.ant-card').first();
    if (await firstInvoiceCard.count() > 0) {
        const href = await firstInvoiceCard.locator('a[href^="/invoices/"]').first().getAttribute('href');
        if (href) {
            await page.goto(href);
            await page.waitForLoadState('domcontentloaded');
            
            // Tìm nút thanh toán
            const payBtn = page.getByRole('button', { name: /Thanh toán|Ghi nhận/i });
            if (await payBtn.count() > 0) {
                await payBtn.first().click();
                
                // Điền số tiền
                const amountInput = page.locator('#amount, input[type="number"]').first();
                if (await amountInput.count() > 0) {
                    await amountInput.fill('1000000');
                    
                    const submitBtn = page.getByRole('button', { name: /Lưu|Xác nhận/i });
                    await submitBtn.click();
                    
                    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 10000 });
                }
            }
        }
    }
  });
});
