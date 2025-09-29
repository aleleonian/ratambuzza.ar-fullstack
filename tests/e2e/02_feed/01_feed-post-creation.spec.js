const { test, expect } = require('@playwright/test');
const { initDb, getDb } = require('../../utils/seed/helpers/db.js');

test.describe('Feed Post Creation', () => {
    test.beforeAll(async () => {
        await initDb();
    });

    const testPostContentGlobal = 'Test post from automated test - text only';

    test('logs in', async function ({ page }) {

        await page.goto(`http://${process.env.APP_HOST}:${process.env.PORT}/login`); // adjust to your app URL
        await page.fill('input[name="handle"]', process.env.FIRST_TEST_USER_NAME);
        await page.fill('input[name="password"]', process.env.FIRST_TEST_USER_PASS);
        await page.click('button[type="submit"]');

        const cookies = await page.context().cookies();
        console.log('Cookies after login:', cookies.map(c => c.name));
        const sessionCookie = cookies.find(c => c.name === 'connect.sid');

        if (!sessionCookie) {
            throw new Error('Session cookie not set after login!');
        }

        await page.waitForSelector('a.logo', { timeout: 5000 });

    })
    test('should create a text-only post and display it in feed', async ({ page }) => {

        // Navigate to feed page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        // Open the post creation modal
        await page.click('#new-post-button-desktop');

        // Verify modal opens
        await expect(page.locator('#postModal')).toBeVisible();
        await expect(page.locator('#add-post-form')).toBeVisible();

        // Fill in post content
        await page.fill('#new-post-content', testPostContentGlobal);

        // Submit the form
        await page.click('#submit-button');

        // Wait for HTMX response and modal to close
        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Verify success toast appears
        await expect(page.locator('#toast-container', { hasText: 'Se posteó.' })).toBeVisible();

        // Verify the new post appears at the top of the feed
        const firstPost = page.locator('#posts-container #post').first();
        await expect(firstPost).toBeVisible();
        await expect(firstPost).toContainText(testPostContentGlobal);

        // Verify post has user information
        await expect(firstPost.locator('#post-author')).toContainText(process.env.FIRST_TEST_USER_NAME);

        // Verify post has interaction buttons (like, reply)
        await expect(firstPost.locator('button[title="Like"]')).toBeVisible();
        await expect(firstPost.locator('#reply-button')).toBeVisible();

        // should clear form after successful submission

        // Open modal again and verify form is cleared
        await page.click('#new-post-button-desktop');
        await expect(page.locator('#postModal')).toBeVisible();

        // Content should be cleared
        const contentValue = await page.locator('#new-post-content').inputValue();
        expect(contentValue).toBe('');

        // File input should be cleared (no files selected)
        const fileInput = page.locator('input[type="file"][name="media"]');
        const fileInputValue = await fileInput.inputValue();
        expect(fileInputValue).toBe('');
    });

    test('should persist post in database', async ({ page }) => {
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        await page.waitForSelector('#post', { timeout: 10000 });

        const posts = page.locator('#post');

        await expect(posts.first().locator('.post-content')).toContainText(testPostContentGlobal);

        // Verify in database
        const db = getDb();
        const [rows] = await db.execute(
            'SELECT content FROM posts WHERE content = ? ORDER BY created_at DESC LIMIT 1',
            [testPostContentGlobal]
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].content).toBe(testPostContentGlobal);
    });

    test('should create a post with image attachment', async ({ page }) => {
        const testPostContent = 'Test post with image from automated test';

        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        // Open post creation modal
        await page.click('#new-post-button-desktop');
        await expect(page.locator('#postModal')).toBeVisible();
        await expect(page.locator('#add-post-form')).toBeVisible();

        // Fill in post content
        await page.fill('#new-post-content', testPostContent);

        // Upload test image
        const fileInput = page.locator('input[type="file"][name="media"]');
        await fileInput.setInputFiles('tests/e2e/fixtures/images/image1.jpeg');

        // Submit the form
        await page.click('#submit-button');

        // Wait for processing and modal to close
        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Verify success toast
        await expect(page.locator('#toast-container', { hasText: 'Se posteó.' })).toBeVisible();

        // Verify the new post with image appears
        const firstPost = page.locator('#posts-container #post').first();
        await expect(firstPost).toBeVisible();
        await expect(firstPost.locator('.post-content')).toContainText(testPostContent);

        // Verify image is displayed
        await expect(firstPost.locator('.post-images')).toBeVisible();
        await expect(firstPost.locator('.post-image-thumb')).toBeVisible();

        // Verify image has proper attributes for lightbox
        const imageThumb = firstPost.locator('.post-image-thumb').first();
        await expect(imageThumb).toHaveAttribute('data-full');
        await expect(imageThumb).toHaveAttribute('data-post-id');
    });

    test('should create a post with multiple images', async ({ page }) => {
        const testPostContent = 'Test post with multiple images';

        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        // Open post creation modal
        await page.click('#new-post-button-desktop');
        await expect(page.locator('#postModal')).toBeVisible();
        await expect(page.locator('#add-post-form')).toBeVisible();

        await page.fill('#new-post-content', testPostContent);

        // Upload multiple test images
        const fileInput = page.locator('input[type="file"][name="media"]');
        await fileInput.setInputFiles([
            'tests/e2e/fixtures/images/image1.jpeg',
            'tests/e2e/fixtures/images/image2.jpeg',
            'tests/e2e/fixtures/images/image3.jpeg'
        ]);

        await page.click('#submit-button');

        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });
        await expect(page.locator('#toast-container', { hasText: 'Se posteó.' })).toBeVisible();

        // Verify post with multiple images
        const firstPost = page.locator('#posts-container #post').first();
        await expect(firstPost).toBeVisible();
        await expect(firstPost.locator('.post-content')).toContainText(testPostContent);

        // Verify multiple images are displayed
        const imageContainer = firstPost.locator('.post-images');
        await expect(imageContainer).toBeVisible();

        const images = imageContainer.locator('.post-image-thumb');
        await expect(images).toHaveCount(3);

        // Verify each image has lightbox attributes
        for (let i = 0; i < 3; i++) {
            const image = images.nth(i);
            await expect(image).toHaveAttribute('data-full');
            await expect(image).toHaveAttribute('data-post-id');
        }
    });

    test('should validate required content field', async ({ page }) => {
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        await page.click('#new-post-button-desktop');
        // Verify modal opens
        await expect(page.locator('#postModal')).toBeVisible();
        await expect(page.locator('#add-post-form')).toBeVisible();

        // Try to submit without content
        await page.click('#submit-button');

        await expect(page.locator('#toast-container', { hasText: 'Broder, el texto del post no' })).toBeVisible();

        // Form should not submit (modal should stay open)
        await expect(page.locator('#postModal')).toBeVisible();
    });

    test('should increment post count when new post is added', async ({ page }) => {
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        // Count existing posts
        const initialPosts = page.locator('#post');
        const initialCount = await initialPosts.count();

        // Create new post
        await page.click('#new-post-button-desktop');
        await expect(page.locator('#postModal')).toBeVisible();
        await expect(page.locator('#add-post-form')).toBeVisible();

        await page.fill('#new-post-content', 'Post count increment test');
        await page.click('#submit-button');

        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Verify post count increased
        const finalPosts = page.locator('#post');
        await expect(finalPosts).toHaveCount(initialCount + 1);
    });

    test('should handle post creation via mobile interface', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        const testPostContent = 'Mobile post creation test';

        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        // On mobile, should use the mobile post button

        // Open post creation modal
        await page.click('#new-post-button-mobile');
        await expect(page.locator('#postModal')).toBeVisible();
        await expect(page.locator('#add-post-form')).toBeVisible();

        await page.fill('#new-post-content', testPostContent);

        await page.click('#submit-button');

        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });
        await expect(page.locator('#toast-container', { hasText: 'Se posteó.' })).toBeVisible();

        // Verify post appears
        const firstPost = page.locator('#post').first();
        await expect(firstPost.locator('.post-content')).toContainText(testPostContent);
    });

    test('should close modal on escape key', async ({ page }) => {
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        await page.click('#new-post-button-desktop');
        await expect(page.locator('#postModal')).toBeVisible();

        // Press escape key
        await page.keyboard.press('Escape');

        // Modal should close
        await expect(page.locator('#postModal')).toBeHidden();
    });

    test('should close modal on close button click', async ({ page }) => {
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        await page.click('#new-post-button-desktop');
        await expect(page.locator('#postModal')).toBeVisible();

        // Click close button
        await page.click('#closePostModal');

        // Modal should close
        await expect(page.locator('#postModal')).toBeHidden();
    });
});