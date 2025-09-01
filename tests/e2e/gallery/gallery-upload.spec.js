import { test, expect } from '@playwright/test';
import path from 'path';
import { insertMedia } from '../../utils/seed/helpers/mediaHelpers.js';
import { getUserId } from '../../utils/seed/helpers/userHelpers.js';
import { getTripId } from '../../utils/seed/helpers/tripHelpers.js';
import { getDb, initDb } from '../../utils/seed/helpers/db.js';

test.describe('Gallery Upload', () => {

    test('should upload an image to gallery', async ({ page }) => {
        // Navigate to gallery page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);

        // Click the upload modal button
        await page.click('#showUploadModalButton');

        // Verify modal opens with expected text
        await expect(page.locator('text=Subite unas fotis, Rey')).toBeVisible();

        // Upload the test image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles('tests/e2e/fixtures/images/image1.jpeg');

        await page.getByRole('button', { name: 'Súbele' }).click();

        // Wait for upload to complete (you may need to click a submit button)
        // Adjust this based on your actual upload flow

        await expect(page.locator('.media-item')).toHaveCount(1, { timeout: 5000 });
    });
    test('should upload two more images to gallery', async ({ page }) => {

        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);

        // Click the upload modal button
        await page.click('#showUploadModalButton');

        // Verify modal opens with expected text
        await expect(page.locator('text=Subite unas fotis, Rey')).toBeVisible();

        // Upload the test image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(['tests/e2e/fixtures/images/image2.jpeg', 'tests/e2e/fixtures/images/image3.jpeg']);
        // await fileInput.setInputFiles('tests/e2e/fixtures/images/image3.jpeg');

        await page.getByRole('button', { name: 'Súbele' }).click();

        await expect(page.locator('.media-item')).toHaveCount(3, { timeout: 5000 });

    });
    test('will add media but not uploading', async ({ page }) => {

        await initDb();

        const mediaPath = path.resolve(__dirname, '../fixtures/images/image4.jpeg');
        const thumbPath = path.resolve(__dirname, '../fixtures/images/image4-thumb.jpg');

        const userId = await getUserId(process.env.SECOND_TEST_USER_NAME);
        const tripId = await getTripId(process.env.FIRST_TRIP_NAME);

        await insertMedia(null, tripId, userId, mediaPath, thumbPath, 480, 360, 'image')

        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);

        await expect(page.locator('.media-item')).toHaveCount(4, { timeout: 5000 });

        const db = await getDb();

        await db.end();
    });
    test('Will make use of the pill filters to discriminate media items', async ({ page }) => {

        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);
        await page.waitForSelector('#toggle-filters', { state: 'visible' });
        await page.click('#toggle-filters');
        await page.waitForSelector('.filter-container', { state: 'visible' });
        const firstAuthorPill = page.locator('.sorting-pill.author-pill', { hasText: 'test-user-1' });
        if (await firstAuthorPill.count() > 0) {
            await firstAuthorPill.first().click();
        }
        await expect(page.locator('.media-item')).toHaveCount(3, { timeout: 5000 });

        const secondAuthorPill = page.locator('.sorting-pill.author-pill', { hasText: 'test-user-2' });
        if (await secondAuthorPill.count() > 0) {
            await secondAuthorPill.first().click();
        }
        await expect(page.locator('.media-item')).toHaveCount(1, { timeout: 5000 });
    })
});