// global-setup.js
import { chromium } from '@playwright/test';
import { insertUser } from './tests/utils/seed/helpers/userHelpers.js';
import { insertTrip, addUsersToTrip } from './tests/utils/seed/helpers/tripHelpers.js';
import { initDb, cleanDb } from './tests/utils/seed/helpers/db.js';

export default async () => {
  await initDb();
  await cleanDb();
  await insertUser(process.env.FIRST_TEST_USER_NAME, process.env.FIRST_TEST_USER_PASS, process.env.ADMIN_ROLE);
  await insertUser(process.env.SECOND_TEST_USER_NAME, process.env.SECOND_TEST_USER_PASS, process.env.USER_ROLE);
  await insertUser(process.env.THIRD_TEST_USER_NAME, process.env.THIRD_TEST_USER_PASS, process.env.USER_ROLE);
  await insertUser(process.env.FOURTH_TEST_USER_NAME, process.env.FOURTH_TEST_USER_PASS, process.env.USER_ROLE);
  await insertTrip(process.env.FIRST_TRIP_NAME, process.env.FIRST_TRIP_SLUG, process.env.FIRST_TRIP_START_DATE, process.env.FIRST_TRIP_END_DATE, process.env.FIRST_TRIP_LANDSCAPE_IMAGE)
  await addUsersToTrip([process.env.FIRST_TEST_USER_NAME, process.env.SECOND_TEST_USER_NAME, process.env.THIRD_TEST_USER_NAME , process.env.FOURTH_TEST_USER_NAME], process.env.FIRST_TRIP_NAME);

  // 2. Create browser and login
  // const browser = await chromium.launch();
  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto(`http://${process.env.APP_HOST}:${process.env.PORT}/login`); // adjust to your app URL
  await page.fill('input[name="handle"]', process.env.FIRST_TEST_USER_NAME);
  await page.fill('input[name="password"]', process.env.FIRST_TEST_USER_PASS);
  await page.click('button[type="submit"]');

  const cookies = await page.context().cookies();
  console.log('Cookies after login:', cookies.map(c => c.name));
  const sessionCookie = cookies.find(c => c.name === 'connect.sid');

  if (!sessionCookie) {
    throw new Error('Session cookie not set after login!');
  }
  await page.screenshot({ path: 'test-results/screenshots/after-login.png' });

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
