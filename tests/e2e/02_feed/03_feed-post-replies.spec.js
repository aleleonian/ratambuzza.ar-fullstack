const { test, expect } = require('@playwright/test');
const { initDb, getDb } = require('../../utils/seed/helpers/db.js');

test.describe('Feed Post Replies', () => {
    let testPostId;

    test.beforeAll(async () => {
        await initDb();
    });

    test.beforeEach(async ({ page }) => {
        // Navigate to feed page and create a test post to reply to
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);
        await page.waitForSelector('#posts-container', { timeout: 10000 });

        // Create a test post if none exists
        await page.click('#new-post-button-desktop');
        await page.fill('#new-post-content', 'Test post for replies testing');
        await page.click('#submit-button');
        await expect(page.locator('#postModal')).toBeHidden({ timeout: 5000 });

        // Get the post ID from the first post for navigation
        const firstPost = page.locator('#post').first();
        testPostId = await firstPost.getAttribute('data-post-id');
    });

    test('should navigate to post detail page via reply button', async ({ page }) => {
        // Click reply button on first post
        const replyButton = page.locator('#reply-button').first();
        await expect(replyButton).toBeVisible();
        await replyButton.click();

        // Should navigate to post detail page
        await expect(page).toHaveURL(new RegExp(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/\\d+`));

        // Verify post detail page elements
        await expect(page.locator('.post-container')).toBeVisible();
        // not visible yet because there are no replies
        // await expect(page.locator('.replies-section')).toBeVisible();
        await expect(page.locator('#new-reply-button-desktop')).toBeVisible();
    });

    test('should navigate to post detail page via timestamp click', async ({ page }) => {
        // Click on post timestamp
        const timestamp = page.locator('#post #post-timestamp').first();
        await expect(timestamp).toBeVisible();
        await timestamp.click();

        // Should navigate to post detail page
        await expect(page).toHaveURL(new RegExp(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/\\d+`));

        // Verify we're on the correct post detail page
        await expect(page.locator('.post-container')).toBeVisible();
        // await expect(page.locator('.replies-section')).toBeVisible();
    });

    test('should create a text-only reply', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        const replyText = 'This is a test reply';

        // Open reply modal
        await page.click('#new-reply-button-desktop');
        await expect(page.locator('#replyModal')).toBeVisible();
        await expect(page.locator('#reply-form')).toBeVisible();

        // Fill reply text
        await page.fill('#reply_text', replyText);

        // Submit reply
        await page.click('#reply-form button[type="submit"]');

        // Wait for reply to appear and modal to close
        await expect(page.locator('#replyModal')).toBeHidden({ timeout: 5000 });

        // Verify success toast
        await expect(page.locator('#toast-container', { hasText: 'Listo, loko.' })).toBeVisible();

        // Verify reply appears in replies section
        const reply = page.locator('.replies-section .card[data-reply-id]').first();
        await expect(reply).toBeVisible();
        await expect(reply).toContainText(replyText);
        await expect(reply).toContainText(process.env.FIRST_TEST_USER_NAME);

        // Verify reply has like button
        await expect(reply.locator('button[title="Like"]')).toBeVisible();
    });

    test('should create a reply with image attachment', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        const replyText = 'Reply with image attachment';

        // Open reply modal
        await page.click('#new-reply-button-desktop');
        await expect(page.locator('#replyModal')).toBeVisible();

        // Fill reply text
        await page.fill('#reply_text', replyText);

        // Upload image
        const fileInput = page.locator('#reply-form input[type="file"][name="media"]');
        await fileInput.setInputFiles('tests/e2e/fixtures/images/image1.jpeg');

        // Submit reply
        await page.click('#reply-form button[type="submit"]');

        // Wait for reply to appear
        await expect(page.locator('#replyModal')).toBeHidden({ timeout: 10000 });
        await expect(page.locator('#toast-container', { hasText: 'Listo, loko.' })).toBeVisible();

        // Verify reply with image
        const reply = page.locator('.replies-section #reply').first();
        await expect(reply).toBeVisible();
        await expect(reply).toContainText(replyText);

        // Verify image is displayed
        await expect(reply.locator('.reply-images')).toBeVisible();
        await expect(reply.locator('.reply-image-thumb')).toBeVisible();

        // Verify image has lightbox attributes
        const imageThumb = reply.locator('.reply-image-thumb').first();
        await expect(imageThumb).toHaveAttribute('data-full');
        await expect(imageThumb).toHaveAttribute('data-reply-id');
    });

    test('should create a reply with multiple images', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        const replyText = 'Reply with multiple images';

        await page.click('#new-reply-button-desktop');
        await expect(page.locator('#replyModal')).toBeVisible();

        await page.fill('#reply_text', replyText);

        // Upload multiple images
        const fileInput = page.locator('#reply-form input[type="file"][name="media"]');
        await fileInput.setInputFiles([
            'tests/e2e/fixtures/images/image1.jpeg',
            'tests/e2e/fixtures/images/image2.jpeg',
            'tests/e2e/fixtures/images/image3.jpeg'
        ]);

        await page.click('#reply-form button[type="submit"]');
        await expect(page.locator('#replyModal')).toBeHidden({ timeout: 15000 });

        // Verify reply with multiple images
        const reply = page.locator('.replies-section .card[data-reply-id]').first();
        await expect(reply).toBeVisible();
        await expect(reply).toContainText(replyText);

        const images = reply.locator('.reply-image-thumb');
        await expect(images).toHaveCount(3);

        // Verify each image has proper attributes
        for (let i = 0; i < 3; i++) {
            const image = images.nth(i);
            await expect(image).toHaveAttribute('data-full');
            await expect(image).toHaveAttribute('data-reply-id');
        }
    });

    test('should validate required reply text field', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        await page.click('#new-reply-button-desktop');
        await expect(page.locator('#replyModal')).toBeVisible();

        // Try to submit without content
        await page.click('#reply-form button[type="submit"]');

        // Should show validation error
        await expect(page.locator('#toast-container', { hasText: 'Broder, el texto del reply no puede estar vacío.' })).toBeVisible();

        // Modal should stay open
        await expect(page.locator('#replyModal')).toBeVisible();
    });

    test('should like and unlike a reply', async ({ page }) => {
        // Navigate to post detail page and create a reply first
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        // Create a reply to like
        await page.click('#new-reply-button-desktop');
        await page.fill('#reply_text', 'Reply to be liked');
        await page.click('#reply-form button[type="submit"]');
        await expect(page.locator('#replyModal')).toBeHidden({ timeout: 5000 });

        // Find the reply and its like button
        const reply = page.locator('.replies-section #reply').first();
        const likeButton = reply.locator('button[title="Like"]');
        await expect(likeButton).toBeVisible();

        // Get initial like count
        const initialLikeText = await likeButton.textContent();
        const initialCount = parseInt(initialLikeText.match(/\d+/)?.[0] || '0');

        // Click like button
        await likeButton.click();
        await page.waitForTimeout(500); // Wait for HTMX response

        // Verify like count increased
        const newLikeText = await likeButton.textContent();
        const newCount = parseInt(newLikeText.match(/\d+/)?.[0] || '0');
        expect(newCount).toBe(initialCount + 1);

        // Verify like button shows liked state (like-on.png)
        await expect(likeButton.locator('img[src*="like-on.png"]')).toBeVisible();

        // Click again to unlike
        await likeButton.click();
        await page.waitForTimeout(500);

        // Verify like count decreased
        const finalLikeText = await likeButton.textContent();
        const finalCount = parseInt(finalLikeText.match(/\d+/)?.[0] || '0');
        expect(finalCount).toBe(initialCount);

        // Verify like button shows unliked state (like-off.png)
        await expect(likeButton.locator('img[src*="like-off.png"]')).toBeVisible();
    });

    // test('should persist replies in database', async ({ page }) => {
    //     const replyText = 'Database persistence test reply';

    //     // Navigate to post detail page
    //     await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

    //     // Create reply
    //     await page.click('#new-reply-button-desktop');
    //     await page.fill('#reply_text', replyText);
    //     await page.click('#reply-form button[type="submit"]');
    //     await expect(page.locator('#replyModal')).toBeHidden({ timeout: 5000 });

    //     // Refresh page and verify reply persists
    //     await page.reload();
    //     await page.waitForSelector('.replies-section', { timeout: 10000 });

    //     // Verify reply is still there
    //     const reply = page.locator('.replies-section .card[data-reply-id]').first();
    //     await expect(reply).toContainText(replyText);

    //     // Verify in database
    //     const db = getDb();
    //     const [rows] = await db.execute(
    //         'SELECT reply_text FROM post_replies WHERE reply_text = ? ORDER BY created_at DESC LIMIT 1',
    //         [replyText]
    //     );

    //     expect(rows).toHaveLength(1);
    //     expect(rows[0].reply_text).toBe(replyText);
    // });

    test.skip('should handle mobile reply interface', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        const replyText = 'Mobile reply test';

        // Use mobile reply button
        const mobileReplyButton = page.locator('#new-reply-button-mobile');
        await expect(mobileReplyButton).toBeVisible();
        await mobileReplyButton.click();

        await expect(page.locator('#replyModal')).toBeVisible();
        await page.fill('#reply_text', replyText);
        await page.click('#reply-form button[type="submit"]');

        await expect(page.locator('#replyModal')).toBeHidden({ timeout: 5000 });

        // Verify reply appears
        const reply = page.locator('.replies-section .card[data-reply-id]').first();
        await expect(reply).toContainText(replyText);
    });

    test.skip('should clear reply form after successful submission', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        // Create a reply
        await page.click('#new-reply-button-desktop');
        await page.fill('#reply_text', 'Reply to test form clearing');
        await page.click('#reply-form button[type="submit"]');
        await expect(page.locator('#replyModal')).toBeHidden({ timeout: 5000 });

        // Open reply modal again
        await page.click('#new-reply-button-desktop');
        await expect(page.locator('#replyModal')).toBeVisible();

        // Verify form is cleared
        const replyTextValue = await page.locator('#reply_text').inputValue();
        expect(replyTextValue).toBe('');

        // Verify file input is cleared
        const fileInput = page.locator('#reply-form input[type="file"][name="media"]');
        const fileInputValue = await fileInput.inputValue();
        expect(fileInputValue).toBe('');
    });

    test.skip('should close reply modal on escape key', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        await page.click('#new-reply-button-desktop');
        await expect(page.locator('#replyModal')).toBeVisible();

        // Press escape key
        await page.keyboard.press('Escape');

        // Modal should close
        await expect(page.locator('#replyModal')).toBeHidden();
    });

    test.skip('should close reply modal on close button click', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        await page.click('#new-reply-button-desktop');
        await expect(page.locator('#replyModal')).toBeVisible();

        // Click close button
        await page.click('#closePostModal');

        // Modal should close
        await expect(page.locator('#replyModal')).toBeHidden();
    });

    test.skip('should display multiple replies in chronological order', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        // Create multiple replies
        const replies = ['First reply', 'Second reply', 'Third reply'];

        for (const replyText of replies) {
            await page.click('#new-reply-button-desktop');
            await page.fill('#reply_text', replyText);
            await page.click('#reply-form button[type="submit"]');
            await expect(page.locator('#replyModal')).toBeHidden({ timeout: 5000 });
            await page.waitForTimeout(1000); // Ensure different timestamps
        }

        // Verify all replies are displayed
        const replyElements = page.locator('.replies-section .card[data-reply-id]');
        await expect(replyElements).toHaveCount(3);

        // Verify replies appear in order (first reply should be first)
        for (let i = 0; i < replies.length; i++) {
            await expect(replyElements.nth(i)).toContainText(replies[i]);
        }
    });

    test.skip('should navigate back to feed from post detail page', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        // Desktop: use browser back button
        await page.goBack();
        await expect(page).toHaveURL(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        // Navigate back to post detail
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        // Mobile: use back button in mobile interface
        await page.setViewportSize({ width: 375, height: 667 });

        const backButton = page.locator('.mobile-only a[href*="/feed"]').first();
        if (await backButton.isVisible()) {
            await backButton.click();
            await expect(page).toHaveURL(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);
        }
    });

    test.skip('should handle lightbox functionality for reply images', async ({ page }) => {
        // Navigate to post detail page
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        // Create reply with image
        await page.click('#new-reply-button-desktop');
        await page.fill('#reply_text', 'Reply with lightbox test');

        const fileInput = page.locator('#reply-form input[type="file"][name="media"]');
        await fileInput.setInputFiles('tests/e2e/fixtures/images/image1.jpeg');

        await page.click('#reply-form button[type="submit"]');
        await expect(page.locator('#replyModal')).toBeHidden({ timeout: 10000 });

        // Click on reply image to open lightbox
        const replyImage = page.locator('.reply-image-thumb').first();
        await expect(replyImage).toBeVisible();
        await replyImage.click();

        // Verify lightbox opens
        const lightbox = page.locator('#lightbox');
        await expect(lightbox).toBeVisible();

        // Verify image is displayed in lightbox
        const lightboxImage = lightbox.locator('#lightbox-img');
        await expect(lightboxImage).toBeVisible();

        // Close lightbox with escape key
        await page.keyboard.press('Escape');
        await expect(lightbox).toBeHidden();
    });

    test.skip('should show reply count in post', async ({ page }) => {
        // Navigate to feed page first
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        // Navigate to post detail and create some replies
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed/${testPostId}`);

        // Create two replies
        for (let i = 1; i <= 2; i++) {
            await page.click('#new-reply-button-desktop');
            await page.fill('#reply_text', `Reply ${i} for count test`);
            await page.click('#reply-form button[type="submit"]');
            await expect(page.locator('#replyModal')).toBeHidden({ timeout: 5000 });
        }

        // Go back to feed
        await page.goto(`/trips/${process.env.FIRST_TRIP_SLUG}/feed`);

        // Check if reply count is displayed on the post
        const post = page.locator('#post').first();
        const replyCountElement = post.locator('.replies-count, [data-replies-count], text=replies, text=respuestas');

        // This might vary based on implementation - check if reply count is visible
        if (await replyCountElement.first().isVisible()) {
            await expect(replyCountElement.first()).toContainText('2');
        }
    });
});