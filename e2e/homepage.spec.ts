import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/de/home');
  });

  test('should display hero section with correct content', async ({ page }) => {
    // Check hero heading is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check the "Zu den Standorten" button exists in hero section
    const locationButton = page.getByRole('link', { name: 'Zu den Standorten' });
    await expect(locationButton).toBeVisible();
  });

  test('should have working navigation to locations page', async ({ page }) => {
    // Click on the locations link in hero section
    const locationLink = page.getByRole('link', { name: 'Zu den Standorten' });
    await locationLink.click();
    
    // Should navigate to standorte page
    await expect(page).toHaveURL(/\/standorte/);
  });

  test('should display about us section', async ({ page }) => {
    // Find the "Über uns" section
    const aboutSection = page.locator('#uber-uns');
    
    // Check that the section exists
    await expect(aboutSection).toBeVisible();
  });

  test('should display testimonials section', async ({ page }) => {
    // Check for testimonial content
    const testimonials = page.locator('text=Anna');
    await expect(testimonials).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Hero section should still be visible
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Homepage - English', () => {
  test('should display English content when locale is en', async ({ page }) => {
    await page.goto('/en/home');
    
    // Should have English content
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for English hero button
    const viewLocationsButton = page.getByRole('link', { name: 'View Locations' });
    await expect(viewLocationsButton).toBeVisible();
  });
});
