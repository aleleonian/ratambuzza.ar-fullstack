const { test, expect } = require('@playwright/test');
const path = require('path');
const { insertMedia, changeAllMediaOwnership } = require('../../utils/seed/helpers/mediaHelpers.js');
const { changeUserType, getUserId } = require('../../utils/seed/helpers/userHelpers.js');
const { getTripId } = require('../../utils/seed/helpers/tripHelpers.js');
const { getDb, initDb } = require('../../utils/seed/helpers/db.js');

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
    });
    test('navigates forward and backward in lightbox', async ({ page }) => {
        // Go to gallery
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);

        // Make sure there are at least 2 media items
        const items = page.locator('.media-grid .media-item');
        await expect(items).toHaveCount(4); // or >1 if dynamic

        // Open the first image in the lightbox
        const firstItem = items.first();
        await firstItem.hover();
        await firstItem.locator('button[title="Play"]').click();

        const lightbox = page.locator('#lightbox');
        const image = lightbox.locator('#lightbox-img');

        // Wait for lightbox to be visible
        await expect(lightbox).toBeVisible();

        // Save current image src
        const firstSrc = await image.getAttribute('src');
        expect(firstSrc).toBeTruthy();

        // Click "Next"
        await page.locator('#lightbox-next').click();
        await expect(image).toBeVisible();
        // Wait until image src changes
        await expect(image).not.toHaveAttribute('src', firstSrc);
        const secondSrc = await image.getAttribute('src');
        // expect(secondSrc).not.toEqual(firstSrc);

        // Now go back to previous image
        await page.locator('#lightbox-prev').click();
        await expect(image).toBeVisible();
        // Expect src to go back to the original one
        await expect(image).toHaveAttribute('src', firstSrc);

        await page.locator('#lightbox-next').click();
        await expect(image).toBeVisible();
        await page.locator('#lightbox-next').click();
        await expect(image).toBeVisible();

        const thirdSrc = await image.getAttribute('src');
        await expect(image).not.toHaveAttribute('src', secondSrc);

        await page.locator('#lightbox-next').click();
        await expect(image).toBeVisible();
        // const fourthSrc = await image.getAttribute('src');
        await expect(image).not.toHaveAttribute('src', thirdSrc);

    });
    test('will make use of the pill filters to discriminate media items', async ({ page }) => {

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
    });
    test('should tag first media item using hover menu and lightbox', async ({ page }) => {
        // Go to gallery page
        const FIRST_TAG = 'yanzi';
        const SECOND_TAG = 'crack'
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);

        await page.click('#toggle-filters');

        // Hover over first media item
        let firstMediaItem = page.locator('.media-item').first();
        await firstMediaItem.hover();

        // Click the 🏷️ "Edit Tags" button inside the overlay
        const tagButton = firstMediaItem.locator('button[title="Edit Tags"]');
        await tagButton.click();

        // Wait for tag input form to load
        const tagTextarea = firstMediaItem.locator('textarea[name="tags"]');
        await expect(tagTextarea).toBeVisible();
        // Fill in the tag
        await tagTextarea.fill(FIRST_TAG);
        await tagTextarea.press('Enter');

        // Click the save button (assumes it's inside the same editor block)
        // const saveButton = firstMediaItem.locator('button', { hasText: 'Save' });
        // await saveButton.click();

        // ✅ Assert tag is shown in the item's tag list
        const tagPill = firstMediaItem.locator('.tag-list .tag-pill', { hasText: FIRST_TAG });
        await expect(tagPill).toBeVisible();

        // ✅ Assert tag appears in the filter container
        let filterPill = page.locator('.filter-container .sorting-pill.tag-pill', { hasText: FIRST_TAG });
        await expect(filterPill).toBeVisible();

        await filterPill.click()
        await expect(page.locator('.media-item')).toHaveCount(1, { timeout: 5000 });


        // Click the 🏷️ "Edit Tags" button inside the overlay
        firstMediaItem = page.locator('.media-item').first();
        await firstMediaItem.hover();
        const playButton = firstMediaItem.locator('button[title="Play"]');
        await playButton.click();

        const lightbox = page.locator('#lightbox');
        await expect(lightbox).toBeVisible();

        const lightboxEditTagsButton = page.locator('#lightbox-edit-tags-button');
        lightboxEditTagsButton.click();

        const textarea = page.locator('#lightbox-tag-editor-modal textarea[name="tags"]');
        await expect(textarea).toBeVisible();

        // Fill it
        await textarea.fill('yanzi, crack');

        // Press Enter to trigger the submit handler
        await textarea.press('Enter');

        // let's check the lightbox tags are updated:

        // ✅ Assert tag is shown in the item's tag list
        const lightboxTagPill = lightbox.locator('.tag-list .tag-pill', { hasText: SECOND_TAG });
        await expect(lightboxTagPill).toBeVisible();

        await lightbox.press('Escape');

        filterPill = page.locator('.filter-container .sorting-pill.tag-pill', { hasText: SECOND_TAG });
        await expect(filterPill).toBeVisible();

    });
    test('Likes last item then sorts by most liked', async ({ page }) => {
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);

        await page.click('#toggle-filters');

        // Grab all media items and pick the last one
        let items = page.locator('.media-grid .media-item');
        const total = await items.count();
        expect(total).toEqual(4);

        let lastItem = items.nth(total - 1);

        // Get its media-id so we can assert ordering later
        const originalLastItemMediaId = await lastItem.locator('a.gallery-item').getAttribute('data-media-id');
        expect(originalLastItemMediaId).toBeTruthy();

        // Hover so overlay buttons are visible, then like it
        await lastItem.hover();
        let likeBtn = lastItem.locator('form.like-form button[title="Like"]');
        let buttonText = await likeBtn.innerText();
        expect(buttonText).toContain('0');

        await likeBtn.click();
        // Wait for like to register (aria-pressed toggles to "1" or count updates)
        await expect(likeBtn).toHaveAttribute('aria-pressed', 'true');
        buttonText = await likeBtn.innerText();
        expect(buttonText).toContain('1');

        // Click the "Más likes" sort pill
        // data-sort="1" == 'Mas likeados'
        await page.locator('.sorting-pill.sort-pill[data-sort="1"]').click();

        // Assert the previously liked item is now the FIRST in the grid
        const firstItem = page.locator('.media-grid .media-item').first();
        await expect(firstItem.locator(`a.gallery-item[data-media-id="${originalLastItemMediaId}"]`)).toBeVisible();
        await firstItem.hover();
        // add a lightbox like test too
        const playButton = firstItem.locator('button[title="Play"]');
        await playButton.click();

        const lightbox = page.locator('#lightbox');
        await expect(lightbox).toBeVisible();
        const lightboxLikeButton = page.locator('#lightbox-like-button');
        await lightboxLikeButton.click();
        await lightbox.press('Escape');
        await expect(lightbox).toBeHidden();

        await expect(
            page.locator('.media-grid .media-item')
                .nth(total - 1)
                .locator(`a.gallery-item[data-media-id="${originalLastItemMediaId}"]`)
        ).toBeVisible();

        likeBtn = page.locator('.media-grid .media-item')
            .nth(total - 1)
            .locator('form.like-form button[title="Like"]');
        await expect(likeBtn).toHaveText(/0/);


    });
    test('deletes media items via hover and lightbox', async ({ page }) => {
        // 1. Go to gallery
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);

        // 2. Delete first media item via hover menu
        let items = page.locator('.media-grid .media-item');
        await expect(items).toHaveCount(4);

        const firstItem = items.first();
        await firstItem.hover();

        // Confirm the browser confirm dialog (Playwright auto-accepts by default)
        page.once('dialog', dialog => dialog.accept());

        const deleteButton = firstItem.locator('button[title="Delete"]');

        await deleteButton.click();

        // 3. Wait for the 'item eliminado!' toast
        await expect(page.locator('#toast-container', { hasText: 'item eliminado!' })).toBeVisible();

        // 4. Confirm 3 items remain
        await expect(items).toHaveCount(3);

        // 5. Delete new first media item via lightbox
        const newFirst = items.first();
        await newFirst.hover();

        const playBtn = newFirst.locator('button[title="Play"]');
        await playBtn.click();

        const lightbox = page.locator('#lightbox');
        await expect(lightbox).toBeVisible();

        // Accept the confirm prompt
        page.once('dialog', dialog => dialog.accept());

        const lightboxDelete = lightbox.locator('#lightbox-delete-button');
        await lightboxDelete.click();

        // Wait for the toast again
        await expect(page.locator('#toast-container', { hasText: 'item eliminado!' })).toBeVisible();

        // Wait for lightbox to close
        await lightbox.press('Escape');
        await expect(lightbox).toBeHidden();

        // 6. Confirm 2 items remain
        await expect(items).toHaveCount(2);
    });
    test('makes sure only the owner or admin can delete media items', async ({ page }) => {

        const adminUserId = await getUserId(process.env.FIRST_TEST_USER_NAME);

        const normalUserid = await getUserId(process.env.SECOND_TEST_USER_NAME);

        await changeUserType(adminUserId, 'user');

        await changeAllMediaOwnership(normalUserid)

        //logout and re log-in
        await page.goto('/logout'); // if your app has it
        await page.context().clearCookies();

        // Then log in again via UI
        await page.goto('/login');
        await page.fill('input[name="handle"]', process.env.FIRST_TEST_USER_NAME);
        await page.fill('input[name="password"]', '12345');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/'); // or wherever it redirects

        const cookies = await page.context().cookies();
        console.log('Cookies after login:', cookies.map(c => c.name));
        const sessionCookie = cookies.find(c => c.name === 'connect.sid');

        if (!sessionCookie) {
            throw new Error('Session cookie not set after login!');
        }

        // 1. Go to gallery
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/gallery`);

        // 2. Delete first media item via hover menu
        let items = page.locator('.media-grid .media-item');

        const firstItem = items.first();

        await firstItem.hover();

        await expect(firstItem.locator('button[title="Delete"]')).not.toBeVisible();

        const db = await getDb();

        await db.end();
    });
});