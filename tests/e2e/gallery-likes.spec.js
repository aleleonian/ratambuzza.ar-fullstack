import { test, expect } from '@playwright/test';
import { initDb, getDb } from '../utils/seed/helpers/db.js';

test.describe('Gallery Likes', () => {
    test.beforeAll(async () => {
        await initDb();
    });

    test.skip('should like and unlike a media item', async ({ page }) => {
        // Navigate to gallery page
        await page.goto('/trips/rio-2025/gallery');
        
        // Wait for media items to load
        await page.waitForSelector('.media-item', { timeout: 10000 });
        
        // Find the first media item's like button
        const likeButton = page.locator('.like-button').first();
        await expect(likeButton).toBeVisible();
        
        // Get initial like count
        const initialLikeCount = await likeButton.locator('.like-count').textContent();
        const initialCount = parseInt(initialLikeCount) || 0;
        
        // Click like button
        await likeButton.click();
        
        // Wait for HTMX response and verify like count increased
        await page.waitForTimeout(500); // Give HTMX time to update
        const newLikeCount = await likeButton.locator('.like-count').textContent();
        const newCount = parseInt(newLikeCount) || 0;
        
        expect(newCount).toBe(initialCount + 1);
        
        // Verify button shows liked state (might change color, icon, etc.)
        await expect(likeButton).toHaveClass(/liked|active/);
        
        // Click again to unlike
        await likeButton.click();
        await page.waitForTimeout(500);
        
        // Verify like count decreased back to original
        const finalLikeCount = await likeButton.locator('.like-count').textContent();
        const finalCount = parseInt(finalLikeCount) || 0;
        
        expect(finalCount).toBe(initialCount);
        
        // Verify button shows unliked state
        await expect(likeButton).not.toHaveClass(/liked|active/);
    });

    test.skip('should persist likes in database', async ({ page }) => {
        // Navigate to gallery and like an item
        await page.goto('/trips/rio-2025/gallery');
        await page.waitForSelector('.media-item', { timeout: 10000 });
        
        const likeButton = page.locator('.like-button').first();
        await likeButton.click();
        await page.waitForTimeout(500);
        
        // Refresh page and verify like persists
        await page.reload();
        await page.waitForSelector('.media-item', { timeout: 10000 });
        
        const likeButtonAfterReload = page.locator('.like-button').first();
        await expect(likeButtonAfterReload).toHaveClass(/liked|active/);
        
        // Verify in database
        const likeCount = await page.evaluate(async () => {
            const db = await import('../utils/seed/helpers/db.js').then(m => m.getDb());
            const [rows] = await db.execute('SELECT COUNT(*) as count FROM likes_media');
            return rows[0].count;
        });
        
        expect(likeCount).toBeGreaterThan(0);
    });
});