const { test, expect } = require('@playwright/test');
const { initDb, getDb } = require('../../utils/seed/helpers/db.js');

test.describe('Feed Search Feature', () => {
    test.beforeAll(async () => {
        await initDb();
    });

    test.beforeEach(async ({ page }) => {
        // Navigate to feed page before each test
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);
        await page.waitForSelector('#posts-container', { timeout: 10000 });
    });

    test.skip('should show desktop search form in sidebar', async ({ page }) => {
        // Desktop search form should be visible in sidebar
        await expect(page.locator('#search-form')).toBeVisible();
        await expect(page.locator('#search-form input[name="search"]')).toBeVisible();
        await expect(page.locator('#search-form select[name="user"]')).toBeVisible();
        await expect(page.locator('#search-form button[type="submit"]')).toBeVisible();
        await expect(page.locator('#clear-filters')).toBeVisible();
    });

    test.skip('should show mobile search interface', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Mobile search button should be visible
        await expect(page.locator('button[onclick="toggleSearch()"]')).toBeVisible();

        // Search form should be hidden initially
        await expect(page.locator('#search-form-wrapper')).toHaveClass(/hidden/);

        // Click search button to reveal form
        await page.click('button[onclick="toggleSearch()"]');

        // Search form should now be visible
        await expect(page.locator('#search-form-wrapper')).not.toHaveClass(/hidden/);
        await expect(page.locator('#search-form-mobile')).toBeVisible();
        await expect(page.locator('#search-form-mobile input[name="search"]')).toBeVisible();
        await expect(page.locator('#search-form-mobile select[name="user"]')).toBeVisible();
    });

    test.skip('should perform text search and show results', async ({ page }) => {
        // First, create some test posts with specific content to search for
        await page.click('#new-post-button-desktop');
        await page.fill('#new-post-content', 'Unique searchable content deangelo');
        await page.click('#submit-button');
        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Create another post with different content
        await page.click('#new-post-button-desktop');
        await page.fill('#new-post-content', 'Different content without the keyword');
        await page.click('#submit-button');
        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Now perform search
        await page.fill('#search-form input[name="search"]', 'deangelo');
        await page.click('#search-form button[type="submit"]');

        // Wait for search results to load
        await page.waitForTimeout(1000);

        // Verify search results header appears
        await expect(page.locator('text=🔍 Resultados:')).toBeVisible();
        await expect(page.locator('text=Mostrando todos los resultados')).toBeVisible();

        // Verify only matching posts are shown
        const posts = page.locator('#post');
        await expect(posts).toHaveCount(1);
        await expect(posts.first()).toContainText('deangelo');
    });

    test('should filter posts by user', async ({ page }) => {
        const userSelect = page.locator('#user-filter');

        const options = await page.locator('#user-filter option').allTextContents();
        const firstOptionText = options[1].trim();

        // Get all non-empty option values as locators
        const optionLocators = userSelect.locator('option:not([value=""])');
        const optionCount = await optionLocators.count();

        if (optionCount === 0) {
            throw new Error('There are no users in the users select in the search form.');
        }

        const firstOption = await page.locator('#user-filter option:not([value=""])').first();
        const value = await firstOption.getAttribute('value');
        console.log('Trying to select option with value:', value);

        const firstUserValue = await optionLocators.nth(0).getAttribute('value');
        await page.evaluate((value) => {
            const tom = tomSelectInstances['user-filter'];
            tom.setValue(value);
        }, firstUserValue);

        await page.screenshot({ path: 'fullpage-prior-to-submit.png', fullPage: true });

        // Submit form
        await page.click('#search-form button[type="submit"]');
        await page.waitForTimeout(1500);

        await page.waitForSelector('#user-filter', { state: 'visible' });

        await page.screenshot({ path: 'fullpage-post-submit.png', fullPage: true });

        // make sure the text in #no-search-results is not present:
        await expect(page.locator('#no-search-results')).toHaveCount(0);

        // Assert visible posts
        const posts = page.locator('#post');
        const postCount = await posts.count();

        if (postCount > 0) {
            for (let i = 0; i < postCount; i++) {
                const post = posts.nth(i);
                await expect(post).toBeVisible();
                const handleEl = post.locator('#post-handle');
                const actualHandle = await handleEl.textContent();
                expect(actualHandle?.trim()).toBe(`@${firstOptionText}`);
            }
        }
    });


    test.skip('should clear search filters and return to normal feed', async ({ page }) => {
        // Perform a search first
        await page.fill('#search-form input[name="search"]', 'test');
        await page.click('#search-form button[type="submit"]');
        await page.waitForTimeout(1000);

        // Verify we're in search mode
        await expect(page.locator('text=🔍 Resultados:')).toBeVisible();

        // Click clear filters
        await page.click('#clear-filters');

        // Should reload page and return to normal feed
        await page.waitForSelector('#posts-container', { timeout: 10000 });

        // Search results header should be gone
        await expect(page.locator('text=🔍 Resultados:')).not.toBeVisible();

        // Search inputs should be cleared
        await expect(page.locator('#search-form input[name="search"]')).toHaveValue('');
        await expect(page.locator('#search-form select[name="user"]')).toHaveValue('');
    });

    test.skip('should hide load more button during search', async ({ page }) => {
        // First, verify load more button exists in normal feed (if there are enough posts)
        const loadMoreSection = page.locator('#load-more-section');
        const hasLoadMore = await loadMoreSection.isVisible();

        if (hasLoadMore) {
            // Perform search
            await page.fill('#search-form input[name="search"]', 'test');
            await page.click('#search-form button[type="submit"]');
            await page.waitForTimeout(1000);

            // Load more button should be hidden during search
            await expect(loadMoreSection).toBeHidden();

            // Clear search
            await page.click('#clear-filters');
            await page.waitForSelector('#posts-container', { timeout: 10000 });

            // Load more button should reappear
            await expect(loadMoreSection).toBeVisible();
        }
    });

    test.skip('should show no results message when search returns empty', async ({ page }) => {
        // Search for something that definitely won't exist
        await page.fill('#search-form input[name="search"]', 'xyznonexistentcontent123');
        await page.click('#search-form button[type="submit"]');
        await page.waitForTimeout(1000);

        // Should show no results message
        await expect(page.locator('text=No se encontraron posts que coincidan')).toBeVisible();
    });

    test.skip('should preserve search values in form fields', async ({ page }) => {
        const searchText = 'preserved search text';
        const userSelect = page.locator('#search-form select[name="user"]');

        // Fill search form
        await page.fill('#search-form input[name="search"]', searchText);

        // Select a user if available
        const options = await userSelect.locator('option[value!=""]').all();
        let selectedUserValue = '';
        if (options.length > 0) {
            selectedUserValue = await options[0].getAttribute('value');
            await userSelect.selectOption(selectedUserValue);
        }

        // Submit search
        await page.click('#search-form button[type="submit"]');
        await page.waitForTimeout(1000);

        // Verify form values are preserved
        await expect(page.locator('#search-form input[name="search"]')).toHaveValue(searchText);
        if (selectedUserValue) {
            await expect(page.locator('#search-form select[name="user"]')).toHaveValue(selectedUserValue);
        }
    });

    test.skip('should work with mobile search interface', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Open mobile search
        await page.click('button[onclick="toggleSearch()"]');
        await expect(page.locator('#search-form-mobile')).toBeVisible();

        // Create a test post first
        await page.click('#new-post-button-mobile');
        await page.fill('#new-post-content', 'Mobile search test content');
        await page.click('#submit-button');
        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Reopen search (might have been hidden after post creation)
        await page.click('button[onclick="toggleSearch()"]');

        // Perform search
        await page.fill('#search-form-mobile input[name="search"]', 'Mobile search');
        await page.click('#search-form-mobile button[type="submit"]');
        await page.waitForTimeout(1000);

        // Verify search results
        await expect(page.locator('text=🔍 Resultados:')).toBeVisible();
        const posts = page.locator('#post');
        await expect(posts.first()).toContainText('Mobile search');
    });

    test.skip('should handle combined text and user search', async ({ page }) => {
        // Create specific test content
        await page.click('#new-post-button-desktop');
        await page.fill('#new-post-content', 'Combined search test content');
        await page.click('#submit-button');
        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Fill both search fields
        await page.fill('#search-form input[name="search"]', 'Combined');

        const userSelect = page.locator('#search-form select[name="user"]');
        const options = await userSelect.locator('option[value!=""]').all();

        if (options.length > 0) {
            const userValue = await options[0].getAttribute('value');
            await userSelect.selectOption(userValue);
        }

        // Submit search
        await page.click('#search-form button[type="submit"]');
        await page.waitForTimeout(1000);

        // Verify search results (should filter by both text AND user)
        await expect(page.locator('text=🔍 Resultados:')).toBeVisible();

        const posts = page.locator('#post');
        const postCount = await posts.count();

        // If results exist, they should match both criteria
        if (postCount > 0) {
            await expect(posts.first()).toContainText('Combined');
        }
    });

    test.skip('should maintain search state when returning from post detail', async ({ page }) => {
        // Perform search
        await page.fill('#search-form input[name="search"]', 'test');
        await page.click('#search-form button[type="submit"]');
        await page.waitForTimeout(1000);

        // Verify we're in search mode
        await expect(page.locator('text=🔍 Resultados:')).toBeVisible();

        // Click on a post to go to detail view (if posts exist)
        const posts = page.locator('#post');
        const postCount = await posts.count();

        if (postCount > 0) {
            const firstPost = posts.first();
            const postLink = firstPost.locator('a').first();

            if (await postLink.isVisible()) {
                await postLink.click();

                // Should navigate to post detail
                await expect(page).toHaveURL(/\/feed\/\d+/);

                // Go back to feed
                await page.goBack();

                // Search state should be maintained
                await expect(page.locator('text=🔍 Resultados:')).toBeVisible();
                await expect(page.locator('#search-form input[name="search"]')).toHaveValue('test');
            }
        }
    });

    test.skip('should handle special characters in search', async ({ page }) => {
        // Create post with special characters
        await page.click('#new-post-button-desktop');
        await page.fill('#new-post-content', 'Special chars: ñáéíóú @#$%');
        await page.click('#submit-button');
        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Search for special characters
        await page.fill('#search-form input[name="search"]', 'ñáéíóú');
        await page.click('#search-form button[type="submit"]');
        await page.waitForTimeout(1000);

        // Should find the post
        await expect(page.locator('text=🔍 Resultados:')).toBeVisible();
        const posts = page.locator('#post');
        await expect(posts.first()).toContainText('ñáéíóú');
    });

    test.skip('should be case insensitive in search', async ({ page }) => {
        // Create post with mixed case
        await page.click('#new-post-button-desktop');
        await page.fill('#new-post-content', 'CaseInsensitive Test Content');
        await page.click('#submit-button');
        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Search with different case
        await page.fill('#search-form input[name="search"]', 'caseinsensitive');
        await page.click('#search-form button[type="submit"]');
        await page.waitForTimeout(1000);

        // Should find the post regardless of case
        await expect(page.locator('text=🔍 Resultados:')).toBeVisible();
        const posts = page.locator('#post');
        await expect(posts.first()).toContainText('CaseInsensitive');
    });
});