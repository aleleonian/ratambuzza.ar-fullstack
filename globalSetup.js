// global-setup.js
import { chromium, expect } from '@playwright/test';
import { insertUser } from './tests/utils/seed/helpers/userHelpers.js';
import { insertTrip } from './tests/utils/seed/helpers/tripHelpers.js';
import { initDb, cleanDb } from './tests/utils/seed/helpers/db.js';

const USER = 'test-user-1';
const PASS = '12345';
const ADMIN_ROLE = 'admin';

export default async () => {
  await initDb();
  await cleanDb();
  await insertUser(USER, PASS, ADMIN_ROLE);
  await insertTrip('RIO 2025', 'rio-2025', '2025-10-08', '2025-10-12', 'copa.jpg')


  // 2. Create browser and login
  // const browser = await chromium.launch();
  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto(`http://${process.env.APP_HOST}:${process.env.PORT}/login`); // adjust to your app URL
  await page.fill('input[name="handle"]', USER);
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');

  const cookies = await page.context().cookies();
  console.log('Cookies after login:', cookies.map(c => c.name));
  const sessionCookie = cookies.find(c => c.name === 'connect.sid');

  if (!sessionCookie) {
    throw new Error('Session cookie not set after login!');
  }
  await page.screenshot({ path: 'test-results/screenshots/after-login.png' });

  // await expect(page.getByText('Ratambuzza.ar', { exact: false })).toBeVisible();

  await page.waitForSelector('a.logo', { timeout: 5000 });

  // await expect(page.locator('a.logo.desktop-only[href="/"]')).toHaveText('Ratambuzza.ar');

  // 3. Save storageState

  let tries = 0;
  while (tries < 10) {
    const cookies = await page.context().cookies();
    if (cookies.find(c => c.name === 'connect.sid')) break;
    await new Promise(res => setTimeout(res, 250));
    tries++;
  }

  if (tries === 10) throw new Error('Session cookie not set after login');

  // or await page.waitForTimeout(2000);

  await page.context().storageState({ path: 'storageState.json' });
  await browser.close();
};
