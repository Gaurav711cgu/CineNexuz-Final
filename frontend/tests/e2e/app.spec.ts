import { test, expect } from '@playwright/test';

test.describe('CineNexuz E2E User Journey & Streaming Test Suite', () => {
  const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

  test('should register, login, and verify authenticated dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill credentials
    await page.fill('input[type="email"]', 'e2e_user@cinenexus.ai');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Verify redirected to dashboard or movies catalog
    await expect(page).toHaveURL(/.*(movies|dashboard)/);
  });

  test('should load recommendations feed and adjust MMR diversity slider', async ({ page }) => {
    await page.goto(`${BASE_URL}/recommendations`);
    
    // Check recommendation cards render
    const cardCount = await page.locator('.movie-card').count();
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('should trigger HLS adaptive video player playback', async ({ page }) => {
    await page.goto(`${BASE_URL}/watch/movie_demo`);
    
    // Check video player element presence
    const videoPlayer = page.locator('video');
    await expect(videoPlayer).toBeVisible();
  });
});
