# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\qa-admin.spec.ts >> Screenshot 02-profil
- Location: tests\e2e\qa-admin.spec.ts:54:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/admin/**" until "load"
  navigated to "http://localhost:3000/login"
  navigated to "http://localhost:3000/login"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e3]:
    - generic [ref=f1e4]:
      - heading "Smart Space Booking" [level=1] [ref=f1e8]
      - paragraph [ref=f1e9]: Masuk ke akun Anda
    - generic [ref=f1e10]:
      - generic [ref=f1e11]:
        - generic [ref=f1e12]: Username
        - textbox "Username" [ref=f1e13]:
          - /placeholder: Masukkan username
      - generic [ref=f1e14]:
        - generic [ref=f1e15]: Password
        - textbox "Password" [ref=f1e16]:
          - /placeholder: Masukkan password
      - button "Masuk" [disabled] [ref=f1e17]
    - generic [ref=f1e18]:
      - paragraph [ref=f1e19]:
        - text: Belum punya akun?
        - link "Daftar sebagai Member" [ref=f1e20] [cursor=pointer]:
          - /url: /register/member
      - paragraph [ref=f1e21]:
        - text: Pengelola space?
        - link "Daftar sebagai Admin" [ref=f1e22] [cursor=pointer]:
          - /url: /register/admin
  - button "Open Next.js Dev Tools" [ref=f1e28] [cursor=pointer]
  - alert [ref=f1e32]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'fs';
  3  | import path from 'path';
  4  | 
  5  | const screenshotsDir = './screenshots';
  6  | if (!fs.existsSync(screenshotsDir)) {
  7  |   fs.mkdirSync(screenshotsDir);
  8  | }
  9  | 
  10 | const consoleLogPath = path.join(screenshotsDir, 'console-log.txt');
  11 | 
  12 | test.beforeEach(async ({ page }) => {
  13 |   // Capture console errors
  14 |   page.on('console', msg => {
  15 |     if (msg.type() === 'error') {
  16 |       fs.appendFileSync(consoleLogPath, `[PAGE CONSOLE ERROR]: ${msg.text()}\n`);
  17 |     }
  18 |   });
  19 |   page.on('pageerror', err => {
  20 |     fs.appendFileSync(consoleLogPath, `[PAGE ERROR]: ${err.message}\n`);
  21 |   });
  22 | 
  23 |   // Login
  24 |   await page.goto('/login');
  25 |   
  26 |   // Wait for login form to be ready using placeholder
  27 |   await page.getByPlaceholder('Masukkan username').waitFor();
  28 |   
  29 |   await page.getByPlaceholder('Masukkan username').fill('admin_space'); 
  30 |   await page.getByPlaceholder('Masukkan password').fill('admin_space');
  31 |   
  32 |   // Wait for the login button to be enabled and click it
  33 |   const loginButton = page.getByRole('button', { name: 'Masuk' });
  34 |   await expect(loginButton).toBeEnabled();
  35 |   await loginButton.click();
  36 | 
  37 |   // Wait for dashboard or error
  38 |   // Assuming dashboard has a specific unique element, e.g. "Selamat Datang" or similar text
  39 |   // Let's just wait for ANY navigation to contain "/admin/"
> 40 |   await page.waitForURL('**/admin/**', { timeout: 30000 });
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  41 | });
  42 | 
  43 | const pages = [
  44 |   { name: '01-dashboard', url: '/admin/dashboard' },
  45 |   { name: '02-profil', url: '/admin/profil' },
  46 |   { name: '03-members', url: '/admin/members' },
  47 |   { name: '04-spaces', url: '/admin/spaces' },
  48 |   { name: '05-diskon', url: '/admin/diskon' },
  49 |   { name: '06-reservasi', url: '/admin/reservasi' },
  50 |   { name: '07-laporan', url: '/admin/laporan' },
  51 | ];
  52 | 
  53 | for (const p of pages) {
  54 |   test(`Screenshot ${p.name}`, async ({ page }) => {
  55 |     fs.appendFileSync(consoleLogPath, `--- Halaman: ${p.url} ---\n`);
  56 |     await page.goto(p.url);
  57 |     await page.waitForLoadState('networkidle');
  58 |     await page.screenshot({ path: path.join(screenshotsDir, `${p.name}.png`), fullPage: true });
  59 |     
  60 |     // Check if error is rendered on page
  61 |     const errorText = await page.locator('text=Cannot read properties of').count();
  62 |     if (errorText > 0) {
  63 |       fs.appendFileSync(consoleLogPath, `[UI ERROR]: Found error text on ${p.url}\n`);
  64 |     }
  65 |   });
  66 | }
  67 | 
```