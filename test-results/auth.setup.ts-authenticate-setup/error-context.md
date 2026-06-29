# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> authenticate
- Location: e2e\auth.setup.ts:6:6

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Lối tắt nhanh')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('text=Lối tắt nhanh')

```

```yaml
- complementary:
  - img "home"
  - text: RentFlow
  - menu:
    - menuitem "dashboard Tổng quan":
      - img "dashboard"
      - link "Tổng quan":
        - /url: /dashboard
    - separator
    - text: Quản lý tài sản
    - group:
      - menuitem "project Toà nhà":
        - img "project"
        - link "Toà nhà":
          - /url: /buildings
      - menuitem "home Phòng":
        - img "home"
        - link "Phòng":
          - /url: /rooms
    - text: Khách & Hợp đồng
    - group:
      - menuitem "team Khách thuê":
        - img "team"
        - link "Khách thuê":
          - /url: /tenants
      - menuitem "file-text Hợp đồng":
        - img "file-text"
        - link "Hợp đồng":
          - /url: /contracts
    - text: Tài chính
    - group:
      - menuitem "thunderbolt Điện nước":
        - img "thunderbolt"
        - link "Điện nước":
          - /url: /meters
      - menuitem "dollar Hoá đơn":
        - img "dollar"
        - link "Hoá đơn":
          - /url: /invoices
      - menuitem "wallet Chi phí":
        - img "wallet"
        - link "Chi phí":
          - /url: /expenses
    - text: Homestay
    - group:
      - menuitem "schedule Lịch đặt phòng":
        - img "schedule"
        - link "Lịch đặt phòng":
          - /url: /homestay/bookings
      - menuitem "clear Dọn dẹp":
        - img "clear"
        - link "Dọn dẹp":
          - /url: /homestay/housekeeping
    - text: Vận hành
    - group:
      - menuitem "tool Sự cố":
        - img "tool"
        - link "Sự cố":
          - /url: /incidents
      - menuitem "setting Cài đặt":
        - img "setting"
        - link "Cài đặt":
          - /url: /settings
      - menuitem "crown Nâng cấp":
        - img "crown"
        - link "Nâng cấp":
          - /url: /pricing
- banner:
  - button "menu-fold":
    - img "menu-fold"
  - img "bell"
  - img "user"
  - text: Minh Chủ quản lý
- main
- alert
```

# Test source

```ts
  1  | import { test as setup, expect } from '@playwright/test';
  2  | import path from 'path';
  3  | 
  4  | const authFile = path.join(__dirname, '../playwright/.auth/user.json');
  5  | 
  6  | setup('authenticate', async ({ page }) => {
  7  |   console.log('Logging in with test account...', process.env.TEST_EMAIL);
  8  |   
  9  |   await page.goto('/login');
  10 |   await page.fill('#login_email', process.env.TEST_EMAIL || 'minhnt@funix.edu.vn');
  11 |   await page.fill('#login_password', process.env.TEST_PASSWORD || 'Tom03456789!');
  12 |   
  13 |   // Submit the form
  14 |   await page.click('button[type="submit"]');
  15 | 
  16 |   // Next.js might redirect to /dashboard
  17 |   await page.waitForURL('**/dashboard');
  18 |   
  19 |   // Wait until a specific dashboard element is visible to ensure full hydration
> 20 |   await expect(page.locator('text=Lối tắt nhanh')).toBeVisible({ timeout: 15000 });
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  21 |   
  22 |   // Save the authenticated state
  23 |   await page.context().storageState({ path: authFile });
  24 | });
  25 | 
```