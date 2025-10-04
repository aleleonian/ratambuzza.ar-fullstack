const { test, expect } = require('@playwright/test');

test.describe('Login Process', () => {

    test('should successfully login with valid credentials', async ({ page }) => {
        // Navigate to login page
        await page.goto('/logout');
        await page.goto('/login');

        // Fill in login form
        await page.goto(`http://${process.env.APP_HOST}:${process.env.PORT}/login`); // adjust to your app URL
        await page.fill('input[name="handle"]', process.env.FIRST_TEST_USER_NAME);
        await page.fill('input[name="password"]', process.env.FIRST_TEST_USER_PASS);
        await page.click('button[type="submit"]');

        // Should redirect to a logged-in page (likely trips or home)
        await expect(page).toHaveURL('/'); // or wherever it redirects

        // Verify user is logged in by checking for user-specific elements
        // This might be a logout button, user handle display, etc.
        await expect(page.locator('.logo.desktop-only')).toBeVisible();
    });

    test('should fail login with invalid credentials', async ({ page }) => {
        await page.goto('/logout');
        await page.goto('/login');

        await page.fill('input[name="handle"]', process.env.FIRST_TEST_USER_NAME);
        await page.fill('input[name="password"]', 'wrongpassword');

        await page.click('button[type="submit"]');

        // Should stay on login page or show error
        await expect(page).toHaveURL('/login');
        await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

});