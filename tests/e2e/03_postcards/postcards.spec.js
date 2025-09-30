const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs/promises');

const { insertPostcard, updateJobStatus } = require('../../../lib/postcardJobs');
const { initDb, getDb } = require('../../utils/seed/helpers/db.js');
const { getUserId } = require('../../utils/seed/helpers/userHelpers.js');
const { getTripId } = require('../../utils/seed/helpers/tripHelpers.js');
const { createThumbnail } = require('../../../lib/upload.js');

test.describe('Postcards flow', () => {

    test.beforeEach(async ({ page }) => {
        // Start fresh on /playground/postcards (assuming current trip = rio2025 for test)
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/playground/postcards`);

    });

    async function selectAvatar(page, text) {
        const input = page.locator('#avatar-select + .ts-wrapper .ts-control input');

        // Click to focus
        await input.click();

        // Type the avatar name slowly (to simulate human speed)
        await input.fill('');
        await input.type(text, { delay: 50 });

        // Wait for the dropdown to render the option
        const dropdownOption = page.locator('.ts-dropdown .option', { hasText: text });
        await expect(dropdownOption).toBeVisible({ timeout: 3000 });

        // Click the dropdown option
        await dropdownOption.click();

        // Sanity check: ensure the chip appears
        const chip = page.locator('.ts-wrapper .ts-control .item', { hasText: text });
        await expect(chip).toBeVisible({ timeout: 1000 });
    }

    test('can create a postcard and see it in the grid', async ({ page }) => {
        // Select up to 3 avatars (Tom Select is a div+input combo)

        await selectAvatar(page, process.env.FIRST_TEST_USER_NAME);
        await selectAvatar(page, process.env.SECOND_TEST_USER_NAME);

        // Fill background + action
        await page.fill('#background-select', 'Discoteca');
        await page.fill('#action-select', 'Bailando');

        // Submit form
        await page.click('button:has-text("Generar Postal")');

        // ✅ Assert pending UI appears
        await expect(page.locator('.pending-status')).toBeVisible();

        await expect(page.locator('.form-row button')).toBeDisabled();
        // ⚡ In test mode, backend stubs postcard generation → mark complete instantly
        // Reload grid

        // After submit + pending UI check
        let postcardVisible = false;

        for (let i = 0; i < 5; i++) { // try up to 5 reloads
            await page.reload();
            await page.waitForTimeout(1500);
            postcardVisible = await page.locator('.postcard-grid .postcard-thumb').first().isVisible();
            if (postcardVisible) break;
        }

        expect(postcardVisible).toBeTruthy();

        // ✅ Assert generated postcard appears in grid
        const postcard = page.locator('.postcard-grid .postcard-thumb').first();
        await expect(postcard).toBeVisible();

        // Open in lightbox
        await postcard.click();
        await expect(page.locator('#lightbox')).toBeVisible();

        page.once('dialog', dialog => dialog.accept());

        // Delete postcard
        await page.locator('#lightbox-deletepost').click();

        // ✅ Assert it disappears from grid
        await expect(page.locator('.postcard-grid .postcard-thumb')).toHaveCount(0);

        // Closed lightbox
        // await page.locator('#lightbox #lightbox-close').click();
        await expect(page.locator('#lightbox')).toBeHidden();
    });

    test('form elements keep their values after validation errors', async ({ page }) => {
        // Test 1: Submit with just avatars (missing background and action)  
        await selectAvatar(page, process.env.FIRST_TEST_USER_NAME);
        await selectAvatar(page, process.env.SECOND_TEST_USER_NAME);

        await page.click('button:has-text("Generar Postal")');
        await page.waitForResponse(response =>
            response.url().includes('postcards/new') && response.status() === 200
        );
        await page.waitForLoadState('networkidle');

        // Avatars should be preserved
        await expect(page.locator('.ts-wrapper .ts-control .item')).toHaveCount(2);

        // Test 2: Add background, submit without action (missing action)
        await page.fill('#background-select', 'Discoteca');
        await page.click('button:has-text("Generar Postal")');
        await page.waitForResponse(response =>
            response.url().includes('postcards/new') && response.status() === 200
        );
        await page.waitForLoadState('networkidle');

        // Background and avatars should be preserved
        await expect(page.locator('#background-select')).toHaveValue('Discoteca');
        await expect(page.locator('.ts-wrapper .ts-control .item')).toHaveCount(2);

        // Test 3: Clear background, add action, submit (missing background)
        await page.fill('#background-select', '');
        await page.fill('#action-select', 'Bailando');

        await page.click('button:has-text("Generar Postal")');

        // Wait for HTMX response to complete properly
        await page.waitForResponse(response =>
            response.url().includes('postcards/new') && response.status() === 200
        );
        await page.waitForLoadState('networkidle');

        // Action should be preserved, background should be empty, avatars should remain
        await expect(page.locator('#action-select')).toHaveValue('Bailando');
        await expect(page.locator('#background-select')).toHaveValue('');
        await expect(page.locator('.ts-wrapper .ts-control .item')).toHaveCount(2);
    });

    test('lightbox supports keyboard navigation', async ({ page }) => {
        // 1. Visit the postcard page and ensure postcards exist
        await initDb();
        const db = getDb();

        // gotta copy a postcard, a postcard thumb and update the postcard record
        const postcard2Path = path.resolve(process.cwd(), `tests/e2e/fixtures/images/${process.env.POSTCARD_IMAGE_2}`);
        const postcard2DestinationPath = path.resolve(process.cwd(), `public/uploads/${process.env.POSTCARD_IMAGE_2}`);

        await fs.copyFile(postcard2Path, postcard2DestinationPath);

        // const postcard2ThumbDestinationPath = path.resolve(process.cwd(), `public/uploads/${process.env.POSTCARD_IMAGE_THUMB_2}`);
        const postcard2ThumbName = process.env.POSTCARD_IMAGE_THUMB_2;
        const thumbnail2Url = await createThumbnail(postcard2DestinationPath, postcard2ThumbName);

        const postcard3Path = path.resolve(process.cwd(), `tests/e2e/fixtures/images/${process.env.POSTCARD_IMAGE_3}`);
        const postcard3DestinationPath = path.resolve(process.cwd(), `public/uploads/${process.env.POSTCARD_IMAGE_3}`);
        await fs.copyFile(postcard3Path, postcard3DestinationPath);

        // const postcard3ThumbDestinationPath = path.resolve(process.cwd(), `public/uploads/${process.env.POSTCARD_IMAGE_THUMB_3}`);
        const postcard3ThumbName = process.env.POSTCARD_IMAGE_THUMB_3;
        const thumbnail3Url = await createThumbnail(postcard3DestinationPath, postcard3ThumbName);

        const userId = await getUserId(process.env.FIRST_TEST_USER_NAME);
        const tripId = await getTripId(process.env.FIRST_TRIP_NAME);

        let avatars = [process.env.FIRST_TEST_USER_NAME, process.env.SECOND_TEST_USER_NAME];
        let scene = "Finland";
        let action = "Picnic";
        let postcard1Id = await insertPostcard(db, userId, tripId, avatars, scene, action, "done");

        await updateJobStatus(db, postcard1Id, {
            image_url: "/uploads/" + process.env.POSTCARD_IMAGE_2,
            thumbnail_url: thumbnail2Url,
        });

        // copy postcard and generate a thumb

        scene = "En el parque";
        action = "Jugando ajedrez";
        postcard1Id = await insertPostcard(db, userId, tripId, avatars, scene, action, "done");

        await updateJobStatus(db, postcard1Id, {
            image_url: "/uploads/" + process.env.POSTCARD_IMAGE_3,
            thumbnail_url: thumbnail3Url,
        });

        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/playground/postcards`);

        const thumbnails = page.locator('.postcard-grid .postcard-thumb');
        const count = await thumbnails.count();
        expect(count).toBeGreaterThanOrEqual(2); // Need at least 2 for meaningful navigation

        // 2. Open the first postcard
        await thumbnails.nth(0).click();

        const lightbox = page.locator('#lightbox');
        await expect(lightbox).toBeVisible();

        // 3. Capture current image src
        const firstImageSrc = await lightbox.locator('img').getAttribute('src');

        // 4. Press ArrowRight to go to next
        await page.keyboard.press('ArrowRight');

        // Wait for image to change
        await expect(async () => {
            const newSrc = await lightbox.locator('img').getAttribute('src');
            expect(newSrc).not.toBe(firstImageSrc);
        }).toPass({ timeout: 2000 });

        // 5. Press ArrowLeft to go back
        await page.keyboard.press('ArrowLeft');
        await expect(async () => {
            const backSrc = await lightbox.locator('img').getAttribute('src');
            expect(backSrc).toBe(firstImageSrc);
        }).toPass({ timeout: 2000 });

        // 6. Press Escape to close
        await page.keyboard.press('Escape');
        await expect(lightbox).toBeHidden();

    });
    test('user can post postcard to feed and cannot post it twice', async ({ page }) => {
        // Step 1: Go to a postcard page (or open a specific one)

        // Step 2: Open the first postcard in lightbox
        await page.locator('.postcard-grid .postcard-thumb').first().click();
        await expect(page.locator('#lightbox')).toBeVisible();

        // Step 3: Extract original postcard filename from lightbox image
        const fullSrc = await page.locator('#lightbox-img').getAttribute('src');
        expect(fullSrc).toContain('/uploads/TEST-postcard-');

        // Derive the resized and thumbnail filenames
        const fileName = fullSrc.split('/').pop(); // e.g., postcard-1757982436831.png
        const resizedName = `resized-${fileName}`;
        const thumbName = `thumb-${resizedName}`;

        page.once('dialog', dialog => dialog.accept());

        // Step 4: Click the "Post to Feed" button
        await page.click('#lightbox-posttofeed'); // Adjust selector to match button

        // Step 5: Wait for backend response
        await page.waitForResponse(res =>
            res.url().includes('/playground/postcards/post') && res.status() === 200
        );

        // Step 6: Go to the feed
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);
        await page.waitForLoadState('networkidle');

        // Step 7: Assert that the posted postcard appears
        const thumbSelector = `img.post-image-thumb[src*="${thumbName}"]`;
        const fullSelector = `img.post-image-thumb[data-full*="${resizedName}"]`;

        const thumbExists = await page.locator(thumbSelector).count();
        const fullExists = await page.locator(fullSelector).count();

        expect(thumbExists + fullExists).toBeGreaterThan(0);

        // Step 8: Try posting again to check rejection
        await page.goto('/trips/rio-2025/playground/postcards');

        await page.locator('.postcard-grid .postcard-thumb').first().click();

        page.once('dialog', dialog => dialog.accept());

        await page.click('#lightbox-posttofeed'); // Adjust selector to match button

        // Expect toast message (assuming toast renders text in .toast class)
        await expect(page.locator('#toast-container')).toContainText('Ya se posteó esa imagen');
    });

});
