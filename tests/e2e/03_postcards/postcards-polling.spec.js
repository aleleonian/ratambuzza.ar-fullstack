const { test, expect } = require('@playwright/test');

test.describe('Postcards Polling Feature', () => {

    test.beforeEach(async ({ page }) => {
        // Start fresh on /playground/postcards
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/playground/postcards`);
    });

    async function selectAvatar(page, text) {
        const input = page.locator('#avatar-select + .ts-wrapper .ts-control input');
        await input.click();
        await input.fill('');
        await input.type(text, { delay: 50 });
        const dropdownOption = page.locator('.ts-dropdown .option', { hasText: text });
        await expect(dropdownOption).toBeVisible({ timeout: 3000 });
        await dropdownOption.click();
        const chip = page.locator('.ts-wrapper .ts-control .item', { hasText: text });
        await expect(chip).toBeVisible({ timeout: 1000 });
    }

    test('should start polling when postcard is submitted and shows pending status', async ({ page }) => {
        // Listen for console logs to verify polling behavior
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.text().includes('polling') || msg.text().includes('Polling')) {
                consoleLogs.push(msg.text());
            }
        });

        // Submit a postcard to create a pending status
        await selectAvatar(page, process.env.FIRST_TEST_USER_NAME);
        await selectAvatar(page, process.env.SECOND_TEST_USER_NAME);
        await page.fill('#background-select', 'Test Location');
        await page.fill('#action-select', 'Testing Polling');
        await page.click('button:has-text("Generar Postal")');

        // Verify pending status appears
        await expect(page.locator('.pending-status')).toBeVisible();
        await expect(page.locator('#polling-indicator')).toBeVisible();

        // Wait a bit and check that polling started
        await page.waitForTimeout(3000);
        
        // Check if polling messages appear in console
        const hasPollingStarted = consoleLogs.some(log => 
            log.includes('Starting postcard status polling') || 
            log.includes('Found') && log.includes('pending postcards')
        );
        
        expect(hasPollingStarted).toBeTruthy();
    });

    test('should test postcards-status endpoint returns correct data', async ({ page }) => {
        // Test the status endpoint via JavaScript fetch
        const statusResponse = await page.evaluate(async () => {
            const response = await fetch(`/trips/${window.location.pathname.split('/')[2]}/playground/postcards-status`);
            return response.ok ? await response.json() : { error: response.status };
        });

        // Should return valid status data
        expect(statusResponse).toHaveProperty('hasPending');
        expect(statusResponse).toHaveProperty('totalPostcards');
        expect(statusResponse).toHaveProperty('statusCounts');
        expect(statusResponse.statusCounts).toHaveProperty('pending');
        expect(statusResponse.statusCounts).toHaveProperty('done');
        expect(statusResponse.statusCounts).toHaveProperty('error');
    });

    test.skip('should stop polling when no pending postcards remain', async ({ page }) => {
        // This test would require mocking the backend to complete a postcard
        // or waiting for a real postcard to complete, which might take too long
        
        // Alternative: test the polling stop logic by manipulating DOM
        await page.evaluate(() => {
            // Simulate having no pending elements
            const pendingElements = document.querySelectorAll('.pending-status');
            pendingElements.forEach(el => el.remove());
            
            // Trigger the check
            if (window.checkAndStartPolling) {
                window.checkAndStartPolling();
            }
        });

        // Check console for stop polling message
        await page.waitForTimeout(1000);
    });
});