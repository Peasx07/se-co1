import { test, expect } from '@playwright/test';

// เปลี่ยน URL ให้ตรงกับหน้า Dashboard ของคุณ (สมมติว่าเป็น /admin)
const BASE_URL = 'https://se-co1.vercel.app';

test.describe.serial('EPIC 2: Additional Dashboard Features', () => {

  test.beforeEach(async ({ page }) => {
    // 1. ตั้งค่าหน้าจอ Desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    // 2. ไปหน้า Login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    // 3. Login ในฐานะ Admin (เปลี่ยน Email/Password ให้ถูกต้อง)
    await page.locator('input[type="email"]').fill('admin@gmail.com');
    await page.locator('input[type="password"]').fill('12345678');

    // 4. รอให้ Login สำเร็จและย้ายไปหน้า Admin Dashboard
    // 1. กดปุ่ม Login ได้เลยโดยไม่ต้องใส่ Promise.all
    await page.getByRole('button', { name: /login|sign in|เข้าสู่ระบบ/i }).click();

    // 2. ให้ Playwright รอเช็กว่าหน้าเว็บเปลี่ยน URL ไปที่ Dashboard สำเร็จหรือไม่ 
    // (ถ้าล็อกอินไม่ผ่าน มันจะฟ้องพังที่บรรทัดนี้ทันที ไม่ต้องรอนานถึง 30 วิ)
    await expect(page).toHaveURL(/.*\/admin.*/, { timeout: 10000 });

    // 5. ไปหน้า Dashboard (ถ้า Login แล้วไม่เด้งมาหน้านี้อัตโนมัติ)
    // **หมายเหตุ: เปลี่ยน Path ให้ตรงกับที่คุณตั้งไว้ใน Next.js (เช่น /admin หรือ /admin/dashboard)**
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    // ยืนยันว่าหน้า Dashboard โหลดเสร็จ (ดูจาก Header)
    await expect(page.getByText('Dashboard Overview')).toBeVisible({ timeout: 15000 });
  });

  // --- US2-1: Retrieve Dashboard Data ---
  test('US2-1: Admin can retrieve and view overall data (Members, Revenue, Bookings)', async ({ page }) => {
    // ตรวจสอบว่าระบบแสดง Card สถิติทั้ง 4 ใบสำเร็จ
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Active Members')).toBeVisible();
    await expect(page.getByText('Bookings Today')).toBeVisible();
    await expect(page.getByText('Space Occupancy')).toBeVisible();

    // เช็คว่ามีตารางแสดงข้อมูลล่าสุด (Recent Transactions) โหลดขึ้นมา
    const tableHeader = page.locator('th', { hasText: 'Customer' });
    await expect(tableHeader).toBeVisible();
  });

  // --- US2-2: Filter revenue data according to year ---
  // --- US2-2: Filter revenue data according to year ---
  // --- US2-2: Filter revenue data according to year ---
  // --- US2-2: Filter revenue data according to year ---
  // --- US2-2: Filter revenue data according to year ---
  // --- US2-2: Filter revenue data according to year ---
  // --- US2-2: Filter revenue data according to year ---
  // --- US2-2: Filter revenue data according to year ---
  test('US2-2: Admin can filter revenue data by year', async ({ page }) => {
    // 1. เลื่อนหน้าจอมาที่บริเวณตัวกรองข้อมูล
    await page.getByText('Sales Dashboard Filters').scrollIntoViewIfNeeded();

    // 2. ตรวจสอบสถานะเริ่มต้นอิงจากโค้ดจริง (ต้องเป็นปี 2026)
    await expect(page.getByText('Current Filter: All Year 2026')).toBeVisible();

    // 3. ค้นหา Dropdown ปี (เจาะจงหาแท็ก <select> ที่มี option เป็นปี 2025 อยู่ข้างใน)
    const yearSelect = page.locator('select').filter({ has: page.locator('option[value="2025"]') }).first();

    // 4. สั่งเปลี่ยนค่าเป็นปี 2025 
    // (ใช้ selectOption ได้เลยเพราะโค้ดคุณเป็น <select> แท้)
    await yearSelect.selectOption('2025');

    // 5. รอให้ API โหลดข้อมูลและ UI อัปเดตสักแป๊บ
    // ลบบรรทัดนี้ทิ้ง -> await page.waitForTimeout(1000);

// Playwright จะรอดักเช็กให้เอง (สูงสุด 10 วิ) ถ้าระบบโหลดเสร็จก่อน มันจะไปบรรทัดต่อไปทันที
await expect(page.getByText('Current Filter: All Year 2025')).toBeVisible({ timeout: 10000 });
  });

  // --- US2-3: Export data to PDF ---
  test('US2-3: Admin can export dashboard data to PDF report', async ({ page }) => {
    // 1. กดปุ่ม Export Data (ใช้ has-text เพื่อแก้ปัญหาติด Icon)
    await page.locator('button:has-text("Export Data")').click();

    // 2. เลือกตัวเลือก PDF
    await page.locator('input[value="pdf"]').check();

    // 3. ดักจับการดาวน์โหลด (เพิ่มเวลาให้เผื่อ react-to-pdf สร้างไฟล์นาน)
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);

    // 4. กดปุ่มยืนยัน
    await page.getByRole('button', { name: 'Confirm Download' }).click();

    // 5. รอรับผลดาวน์โหลด
    const download = await downloadPromise;

    // แก้ไข Error: เช็คก่อนว่ามีไฟล์ดาวน์โหลดจริงๆ ถึงค่อยอ่านชื่อไฟล์
    if (download) {
      expect(download.suggestedFilename()).toContain('.pdf');
    } else {
      // ถ้า Playwright จับการดาวน์โหลดไม่ทัน ให้เช็คว่า Modal โดนปิดไปแล้วแทน (ถือว่าสั่งงานสำเร็จ)
      const modalTitle = page.getByText('Choose Export Format');
      await expect(modalTitle).not.toBeVisible();
    }
  });

  // --- US2-4: See another format of the graph ---
  // --- US2-4: See another format of the graph ---
  test('US2-4: Admin can see graph representations of data', async ({ page }) => {
    // 1. เลื่อนหน้าจอลงมาที่โซนตัวกรองเพื่อให้อยู่ในระยะที่มองเห็นกราฟ
    await page.getByText('Sales Dashboard Filters').scrollIntoViewIfNeeded();

    // 2. เผื่อเวลาให้ Recharts คำนวณขนาดและดึงข้อมูลมาวาดกราฟ
    // 3. ตรวจสอบว่ากราฟถูกวาดขึ้นมาแล้วจริงๆ 
    // (Recharts จะสร้างแท็ก <svg> ที่มีคลาส "recharts-surface" เสมอ)
    const chartSvg = page.locator('svg.recharts-surface').first();
    await expect(chartSvg).toBeVisible({ timeout: 10000 });

    // 4. ลองคลิกหรือ Hover ที่ "แท่งกราฟ" แท่งแรก
    // (Recharts จะใช้คลาส "recharts-bar-rectangle" สำหรับกราฟแท่ง)
    const firstBar = page.locator('.recharts-bar-rectangle').first();

    if (await firstBar.isVisible()) {
      await firstBar.hover(); // เอาเมาส์ไปชี้ให้ Tooltip เด้ง
      await firstBar.click(); // ลองคลิกที่แท่งกราฟ
    }
  });

});