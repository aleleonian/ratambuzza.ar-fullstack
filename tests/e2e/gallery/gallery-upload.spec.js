import { test, expect } from '@playwright/test';
import { insertMedia } from '../../utils/seed/helpers/mediaHelpers.js';
import { getUserId } from '../../utils/seed/helpers/userHelpers.js';
import { getTripId } from '../../utils/seed/helpers/tripHelpers.js';

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

        // // Verify the image was uploaded by checking gallery items
        // const galleryItemsCount = await page.evaluate(async () => {
        //     if (typeof getGalleryItems === 'function') {
        //         const items = await getGalleryItems();
        //         return items.length;
        //     }
        //     // Alternative: count actual DOM elements
        //     return document.querySelectorAll('.media-item, .gallery-item').length;
        // });

        // expect(galleryItemsCount).toBe(1);
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
    // test('will add media but not uploading', async ({ page }) => {

    //     const userId = await getUserId(process.env.FIRST_TEST_USER_NAME);
    //     const tripId = await getTripId(process.env.FIRST_TRIP_NAME)
    //     await insertMedia(null, tripId, userId, )

    //     await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);

    //     // Click the upload modal button
    //     await page.click('#showUploadModalButton');

    //     // Verify modal opens with expected text
    //     await expect(page.locator('text=Subite unas fotis, Rey')).toBeVisible();

    //     // Upload the test image
    //     const fileInput = page.locator('input[type="file"]');
    //     await fileInput.setInputFiles(['tests/e2e/fixtures/images/image2.jpeg', 'tests/e2e/fixtures/images/image3.jpeg']);
    //     // await fileInput.setInputFiles('tests/e2e/fixtures/images/image3.jpeg');

    //     await page.getByRole('button', { name: 'Súbele' }).click();

    //     await expect(page.locator('.media-item')).toHaveCount(3, { timeout: 5000 });

    // });
});