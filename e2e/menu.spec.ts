import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/de/products');
  });

  test('should display products page with heading', async ({ page }) => {
    // Check page heading - "Unsere Produkte" in German
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Produkte');
  });

  test('should display product cards', async ({ page }) => {
    // Check that products are displayed
    const productCards = page.locator('.rounded-2xl');
    await expect(productCards.first()).toBeVisible();
    
    // Should have multiple products
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display category filter buttons', async ({ page }) => {
    // Find the "Alle" (All) filter button
    const allButton = page.getByRole('button', { name: 'Alle' });
    await expect(allButton).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    // Get initial product count
    const productCards = page.locator('[class*="grid"] > div');
    const initialCount = await productCards.count();
    
    // Click on a specific category filter (e.g., Salate)
    const categoryButton = page.getByRole('button', { name: /Salat/i });
    
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      
      // Products should be filtered
      const filteredCount = await productCards.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('should show vegan badge on vegan products', async ({ page }) => {
    // Check for vegan badges
    const veganBadge = page.locator('text=🌱');
    await expect(veganBadge.first()).toBeVisible();
  });

  test('should have weight input fields for products', async ({ page }) => {
    // Check for weight input
    const weightInput = page.locator('input[inputmode="numeric"]').first();
    await expect(weightInput).toBeVisible();
  });

  test('should calculate price when weight is entered', async ({ page }) => {
    // Find first weight input
    const weightInput = page.locator('input[inputmode="numeric"]').first();
    
    // Enter weight
    await weightInput.fill('500');
    
    // Price should be calculated and displayed (look for € symbol with numbers)
    const priceText = page.locator('text=€').first();
    await expect(priceText).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    // Enter weight for a product
    const weightInput = page.locator('input[inputmode="numeric"]').first();
    await weightInput.fill('250');
    
    // Click add to cart button - "In den Warenkorb" in German
    const addToCartButton = page.getByRole('button', { name: /Warenkorb/i }).first();
    await addToCartButton.click();
    
    // Wait for cart to update
    await page.waitForTimeout(500);
    
    // Cart count should update - look for badge with count "1"
    const cartBadge = page.locator('.bg-red-500').first();
    await expect(cartBadge).toHaveText('1');
  });

  test('should disable add to cart button when no weight entered', async ({ page }) => {
    // The button should be disabled when no weight is entered
    const addToCartButton = page.getByRole('button', { name: /Warenkorb/i }).first();
    await expect(addToCartButton).toBeDisabled();
  });

  test('should display product ingredients', async ({ page }) => {
    // Check for ingredients section - "Zutaten" in German
    const ingredientsLabel = page.locator('text=Zutaten').first();
    await expect(ingredientsLabel).toBeVisible();
  });

  test('should show price per kg for products', async ({ page }) => {
    // Check for price per kg display - "Preis pro kg" in German
    const pricePerKgLabel = page.locator('text=/pro kg/i').first();
    await expect(pricePerKgLabel).toBeVisible();
  });
});

test.describe('Products Page - Responsive', () => {
  test('should show mobile cart button on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/de/products');
    
    // Mobile cart button should be visible (hidden on md and up)
    const mobileCartButton = page.locator('.md\\:hidden').filter({ has: page.locator('svg') });
    await expect(mobileCartButton.first()).toBeVisible();
  });

  test('should have scrollable category filters on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/de/products');
    
    // Category filter container should exist
    const filterContainer = page.locator('.overflow-x-auto');
    await expect(filterContainer).toBeVisible();
  });
});

test.describe('Products Page - English', () => {
  test('should display English products page', async ({ page }) => {
    await page.goto('/en/products');
    
    // Check page heading - "Our Products" in English
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Products');
  });
});
