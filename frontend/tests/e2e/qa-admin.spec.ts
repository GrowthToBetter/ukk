import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const screenshotsDir = './screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

const consoleLogPath = path.join(screenshotsDir, 'console-log.txt');

test.beforeEach(async ({ page }) => {
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      fs.appendFileSync(consoleLogPath, `[PAGE CONSOLE ERROR]: ${msg.text()}\n`);
    }
  });
  page.on('pageerror', err => {
    fs.appendFileSync(consoleLogPath, `[PAGE ERROR]: ${err.message}\n`);
  });

  // Login
  await page.goto('/login');
  
  // Wait for login form to be ready using placeholder
  await page.getByPlaceholder('Masukkan username').waitFor();
  
  await page.getByPlaceholder('Masukkan username').fill('admin_space'); 
  await page.getByPlaceholder('Masukkan password').fill('admin_space');
  
  // Wait for the login button to be enabled and click it
  const loginButton = page.getByRole('button', { name: 'Masuk' });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();

  // Wait for dashboard or error
  // Assuming dashboard has a specific unique element, e.g. "Selamat Datang" or similar text
  // Let's just wait for ANY navigation to contain "/admin/"
  await page.waitForURL('**/admin/**', { timeout: 30000 });
});

const pages = [
  { name: '01-dashboard', url: '/admin/dashboard' },
  { name: '02-profil', url: '/admin/profil' },
  { name: '03-members', url: '/admin/members' },
  { name: '04-spaces', url: '/admin/spaces' },
  { name: '05-diskon', url: '/admin/diskon' },
  { name: '06-reservasi', url: '/admin/reservasi' },
  { name: '07-laporan', url: '/admin/laporan' },
];

for (const p of pages) {
  test(`Screenshot ${p.name}`, async ({ page }) => {
    fs.appendFileSync(consoleLogPath, `--- Halaman: ${p.url} ---\n`);
    await page.goto(p.url);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, `${p.name}.png`), fullPage: true });
    
    // Check if error is rendered on page
    const errorText = await page.locator('text=Cannot read properties of').count();
    if (errorText > 0) {
      fs.appendFileSync(consoleLogPath, `[UI ERROR]: Found error text on ${p.url}\n`);
    }
  });
}
