import { test, expect } from '@playwright/test';

const BASE_URL = 'https://se-co1.vercel.app';

test.describe.serial('EPIC 1: Co-working Space Management', () => {

  // 🔥 shared variable
  let spaceName: string;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto(`${BASE_URL}/login`);

    await page.locator('input[type="email"]').fill('admin@gmail.com');
    await page.locator('input[type="password"]').fill('12345678');

    // 1. กดปุ่ม Login ได้เลยโดยไม่ต้องใส่ Promise.all
    await page.getByRole('button', { name: /login|sign in|เข้าสู่ระบบ/i }).click();

    // 2. ให้ Playwright รอเช็กว่าหน้าเว็บเปลี่ยน URL ไปที่ Dashboard สำเร็จหรือไม่ 
    // (ถ้าล็อกอินไม่ผ่าน มันจะฟ้องพังที่บรรทัดนี้ทันที ไม่ต้องรอนานถึง 30 วิ)
    await expect(page).toHaveURL(/.*\/admin.*/, { timeout: 10000 });

    await page.goto(`${BASE_URL}/admin/spaces`, { waitUntil: 'networkidle' });

    await expect(page.getByText('Spaces Management')).toBeVisible();
    await expect(page.getByRole('button', { name: /add space/i })).toBeVisible();
  });

  // =========================
  // ✅ US1-1: CREATE
  // =========================
  test('US1-1: Admin can create co-working space', async ({ page }) => {
    spaceName = `Space-${Date.now()}`;

    await page.getByRole('button', { name: /add space/i }).click();
    await expect(page.getByText(/add new space/i)).toBeVisible();

    await page.locator('input[name="name"]').fill(spaceName);
    await page.locator('input[name="address"]').fill('Test Address');
    await page.locator('input[name="telephone"]').fill('0812345678');
    await page.locator('input[name="price_per_hour"]').fill('250');

    // ✅ FIX: input type="time" ต้องใช้ HH:mm เท่านั้น
    await page.locator('input[name="open_time"]').fill('08:00');
    await page.locator('input[name="close_time"]').fill('22:00');

    await page.locator('select[name="type"]').selectOption('room');

    // status (บางระบบมี)
    const status = page.locator('select[name="status"]');
    if (await status.count() > 0) {
      await status.selectOption('available');
    }

    const createBtn = page.getByRole('button', { name: /create space/i });

    await expect(createBtn).toBeEnabled(); // 🔥 กันพลาด
    await createBtn.click();

    // รอ modal ปิด
    await expect(page.locator('form')).not.toBeVisible({ timeout: 10000 });

    // verify
    await page.getByPlaceholder('Search by name or address...').fill(spaceName);
    await expect(page.locator('tbody')).toContainText(spaceName);
  });

  // =========================
  // ✅ US1-2: VIEW
  // =========================
  test('US1-2: Admin can view co-working space', async ({ page }) => {
    expect(spaceName).toBeTruthy(); // 🔥 กัน undefined

    await page.getByPlaceholder('Search by name or address...').fill(spaceName);
    await expect(page.locator('tbody')).toContainText(spaceName);
  });

  // =========================
  // ✅ US1-3: UPDATE
  // =========================
  test('US1-3: Admin can update co-working space', async ({ page }) => {
    expect(spaceName).toBeTruthy();

    const updatedName = `${spaceName}-Updated`;

    await page.getByPlaceholder('Search by name or address...').fill(spaceName);

    // กด edit
    await page.locator('button[title="Edit"]').first().click();

    await expect(page.locator('input[name="name"]')).toBeVisible();

    await page.locator('input[name="name"]').fill(updatedName);

    const updateBtn = page.getByRole('button', { name: /update/i });
    await expect(updateBtn).toBeEnabled();
    await updateBtn.click();

    // รอ modal ปิด
    await expect(page.locator('form')).not.toBeVisible();

    // verify
    await page.getByPlaceholder('Search by name or address...').fill(updatedName);
    await expect(page.locator('tbody')).toContainText(updatedName);

    // 🔁 update ค่า
    spaceName = updatedName;
  });

  // =========================
  // ✅ US1-4: DELETE
  // =========================
  test('US1-4: Admin can delete co-working space', async ({ page }) => {
    expect(spaceName).toBeTruthy();

    await page.getByPlaceholder('Search by name or address...').fill(spaceName);

    // soft delete
    await page.locator('button[title="Move to Recycle Bin"]').first().click();
    await page.getByRole('button', { name: /archive space/i }).click();

    await expect(page.getByText(/archived/i)).toBeVisible();

    // ไป recycle bin
    await page.getByRole('button', { name: 'Recycle Bin', exact: true }).click();

    await page.getByPlaceholder('Search by name or address...').fill(spaceName);

    // hard delete
    await page.locator('button[title="Permanently Delete"]').first().click();
    await page.getByRole('button', { name: /yes, delete/i }).click();

    await expect(page.getByText(/deleted/i)).toBeVisible();
  });

});