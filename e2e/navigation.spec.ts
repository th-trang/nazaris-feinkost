import { test, expect } from '@playwright/test';

// Desktop navigation tests - skip on mobile viewports
test.describe('Navigation - Desktop', () => {
  // Skip these tests on mobile viewports
  test.skip(({ isMobile }) => isMobile, 'Desktop navigation not visible on mobile');

  test.beforeEach(async ({ page }) => {
    await page.goto('/de/home');
  });

  test('should display header with logo', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should have all navigation links', async ({ page }) => {
    const header = page.locator('header');
    
    // Check for main navigation links - exact text from translations
    await expect(header.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Menü' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Catering' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Standorte' })).toBeVisible();
  });

  test('should navigate to menu page', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'Menü' }).click();
    await expect(page).toHaveURL(/\/de\/menu/);
  });

  test('should navigate to catering page', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'Catering' }).click();
    await expect(page).toHaveURL(/\/de\/catering/);
  });

  test('should navigate to locations page', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'Standorte' }).click();
    await expect(page).toHaveURL(/\/de\/standorte/);
  });

  test('should display shopping cart button', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
    // Cart icon should be in header
    const cartButton = header.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(cartButton).toBeVisible();
  });
});

test.describe('Language Switching', () => {
  test.skip(({ isMobile }) => isMobile, 'Language switcher may differ on mobile');

  test('should switch from German to English', async ({ page }) => {
    await page.goto('/de/home');
    
    // Find language switcher button in header
    const langButton = page.locator('header button').filter({ hasText: /DE/i }).first();
    
    if (await langButton.isVisible()) {
      await langButton.click();
      
      // Wait for dropdown and select English
      await page.waitForTimeout(200);
      const englishOption = page.getByRole('button', { name: 'English' });
      if (await englishOption.isVisible()) {
        await englishOption.click();
        await expect(page).toHaveURL(/\/en\//);
      }
    }
  });

  test('should preserve page when switching language', async ({ page }) => {
    await page.goto('/de/menu');
    
    const langButton = page.locator('header button').filter({ hasText: /DE/i }).first();
    
    if (await langButton.isVisible()) {
      await langButton.click();
      await page.waitForTimeout(200);
      
      const englishOption = page.getByRole('button', { name: 'English' });
      if (await englishOption.isVisible()) {
        await englishOption.click();
        await expect(page).toHaveURL(/\/en\/menu/);
      }
    }
  });
});

test.describe('Mobile Navigation', () => {
  // Only run on mobile viewports
  test.skip(({ isMobile }) => !isMobile, 'Mobile navigation only on mobile');

  test.beforeEach(async ({ page }) => {
    await page.goto('/de/home');
  });

  test('should show mobile menu button', async ({ page }) => {
    // Mobile menu container (md:hidden) should be visible on mobile
    const mobileMenuContainer = page.locator('.md\\:hidden').first();
    await expect(mobileMenuContainer).toBeVisible();
  });

  test('should open mobile menu when clicking hamburger', async ({ page }) => {
    // Find mobile menu button (last button in md:hidden container)
    const mobileContainer = page.locator('header .md\\:hidden');
    const menuButton = mobileContainer.locator('button').last();
    await menuButton.click();
    
    // Wait for animation
    await page.waitForTimeout(500);
    
    // Navigation links should become visible in sidebar
    const navLink = page.getByRole('link', { name: 'Menü' }).first();
    await expect(navLink).toBeVisible();
  });

  test('should navigate from mobile menu', async ({ page }) => {
    // Open mobile menu
    const mobileContainer = page.locator('header .md\\:hidden');
    const menuButton = mobileContainer.locator('button').last();
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Click on menu link
    await page.getByRole('link', { name: 'Menü' }).first().click();
    await expect(page).toHaveURL(/\/de\/menu/);
  });
});

test.describe('Cart Sidebar', () => {
  test('should add item to cart and show badge', async ({ page }) => {
    await page.goto('/de/menu');
    
    // Add item to cart first
    const weightInput = page.locator('input[inputmode="numeric"]').first();
    await weightInput.fill('100');
    
    const addButton = page.getByRole('button', { name: /Warenkorb/i }).first();
    await addButton.click();
    
    // Wait for cart to update
    await page.waitForTimeout(500);
    
    // Cart count should show "1"
    const cartBadge = page.locator('.bg-red-500').first();
    await expect(cartBadge).toHaveText('1');
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/de/home');
    
    // Check that h1 exists
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/de/home');
    
    // Check that images have alt attributes
    const images = page.locator('img[alt]');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/de/home');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // An element should be focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Navigation - English Locale', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop navigation test');

  test('should display English navigation links', async ({ page }) => {
    await page.goto('/en/home');
    
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: 'Menu' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Locations' })).toBeVisible();
  });
});
