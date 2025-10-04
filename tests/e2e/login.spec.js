const { test, expect } = require('@playwright/test');

test.describe('Login Process', () => {
    const testHandle = 'test-user-1';
    const testPassword = '12345';

    test('should successfully login with valid credentials', async ({ page }) => {
        // Navigate to login page
        await page.goto('/');

        // Fill in login form
        await page.fill('input[name="handle"]', testHandle);
        await page.fill('input[name="password"]', testPassword);

        // Submit login form
        await page.click('button[type="submit"]');

        // Should redirect to a logged-in page (likely trips or home)
        await expect(page).toHaveURL(/\/(trips|home)/);

        // Verify user is logged in by checking for user-specific elements
        // This might be a logout button, user handle display, etc.
        await expect(page.locator('text=Ratambuzza.ar')).toBeVisible();
    });

    test('should fail login with invalid credentials', async ({ page }) => {
        await page.goto('/');

        await page.fill('input[name="handle"]', testHandle);
        await page.fill('input[name="password"]', 'wrongpassword');

        await page.click('button[type="submit"]');

        // Should stay on login page or show error
        await expect(page).toHaveURL('/');
        // Look for error message or login form still present
        await expect(page.locator('input[name="handle"]')).toBeVisible();
    });

});