import { test, expect } from '@playwright/test';

test.describe('Postcards flow', () => {

    test.beforeEach(async ({ page }) => {
        // Start fresh on /postcards (assuming current trip = rio2025 for test)
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/postcards`);

    });

    // helper: select avatar from Tom Select
    async function selectAvatar(page, text) {
        const avatarInput = page.locator('#avatar-select + .ts-wrapper .ts-control input');
        await avatarInput.click();
        await avatarInput.fill(text);
        await page.keyboard.press('Enter');
    }

    test.skip('can create a postcard and see it in the grid', async ({ page }) => {
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

    test('enforces max 3 avatars', async ({ page }) => {
        await selectAvatar(page, process.env.FIRST_TEST_USER_NAME);
        await selectAvatar(page, process.env.SECOND_TEST_USER_NAME);
        await selectAvatar(page, process.env.THIRD_TEST_USER_NAME);
        await selectAvatar(page, process.env.FOURTH_TEST_USER_NAME);

        // ✅ Only 3 items selected
        const selectedCount = await page.locator('#avatar-select + .ts-wrapper .ts-control .item').count();
        expect(selectedCount).toBe(3);
    });
});
