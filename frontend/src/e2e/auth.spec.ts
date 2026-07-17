import { test, expect } from '@playwright/test';

test.describe('SkillTrack Authentication E2E tests', () => {
  test('should redirect unauthenticated root users to the login page', async ({ page }) => {
    // Navigate to root
    await page.goto('/');
    
    // Expect redirection to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should display login page form elements correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Verify title and description
    await expect(page.locator('h5')).toContainText('SkillTrack Login');
    await expect(page.getByText('Sign in to track skills and learning hours')).toBeVisible();

    // Verify form fields
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should show validation warnings for invalid input formats', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Submit blank form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Check validation errors
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });
});
