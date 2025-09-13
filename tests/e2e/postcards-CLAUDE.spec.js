import { test, expect } from '@playwright/test';
import { initDb, getDb } from '../utils/seed/helpers/db.js';

test.describe('Postcards Generation', () => {
    test.beforeAll(async () => {
        await initDb();
    });

    test('should create a postcard and view it in lightbox', async ({ page }) => {
        // Navigate to postcards page
        await page.goto('/trips/rio-2025/postcards');
        
        // Wait for form to load
        await page.waitForSelector('select[name="avatars"]', { timeout: 10000 });
        
        // Select 2 avatars from the first select (multi-select)
        const avatarSelect = page.locator('select[name="avatars"]');
        await avatarSelect.selectOption(['test-user-1', 'test-user-2']);
        
        // Select a location from the second select
        const locationSelect = page.locator('select[name="background"]');
        await locationSelect.selectOption('Rio beach');
        
        // Select an action from the third select
        const actionSelect = page.locator('select[name="action"]');
        await actionSelect.selectOption('drinking caipirinhas');
        
        // Submit the form
        await page.click('button[type="submit"]');
        
        // Wait for success toast or form update
        await page.waitForTimeout(1000);
        
        // Verify submission was successful (look for pending status or success message)
        await expect(page.locator('text=Se queueó tu job')).toBeVisible({ timeout: 5000 });
        
        // Since this is a background job that takes time to process,
        // we'll simulate waiting and then check if the postcard appears
        // In a real scenario, you might need to poll or wait longer
        
        // Reload the page to see if postcard appears
        await page.reload();
        await page.waitForSelector('.postcard-item, .postcard-grid', { timeout: 10000 });
        
        // Check if postcard appears in the grid
        const postcardItems = page.locator('.postcard-item');
        await expect(postcardItems).toHaveCount(1);
        
        // Click on the postcard to open lightbox
        await postcardItems.first().click();
        
        // Verify lightbox opens
        await expect(page.locator('.lightbox, .modal')).toBeVisible({ timeout: 5000 });
        
        // Verify postcard image is displayed in lightbox
        await expect(page.locator('.lightbox img, .modal img')).toBeVisible();
        
        // Optionally verify the postcard contains expected elements
        // (this depends on your lightbox implementation)
        
        // Close lightbox (ESC key or close button)
        await page.keyboard.press('Escape');
        await expect(page.locator('.lightbox, .modal')).not.toBeVisible();
    });

    test.skip('should show pending status while postcard is being generated', async ({ page }) => {
        await page.goto('/trips/rio-2025/postcards');
        
        // Submit a postcard request
        await page.selectOption('select[name="avatars"]', ['test-user-1']);
        await page.selectOption('select[name="background"]', 'Hostel kitchen');
        await page.selectOption('select[name="action"]', 'playing cards');
        await page.click('button[type="submit"]');
        
        // Should show pending state
        await expect(page.locator('text=pending, text=processing')).toBeVisible();
        
        // Form should be disabled or show different state
        await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });
});