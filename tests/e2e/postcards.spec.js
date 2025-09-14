import { test, expect } from '@playwright/test';

test.describe('Postcards flow', () => {

    test.beforeEach(async ({ page }) => {
        // Start fresh on /postcards (assuming current trip = rio2025 for test)
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/postcards`);

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
});
