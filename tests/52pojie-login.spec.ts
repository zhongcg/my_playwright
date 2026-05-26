import { test, expect } from '@playwright/test';

test('吾爱破解登录', async ({ page }) => {
  await page.goto('https://www.52pojie.cn/', { waitUntil: 'domcontentloaded' });

  const beforeLoginUrl = page.url();
  const beforeLoginTitle = await page.title();

  const usernameInput = page
    .locator('input[name="username"]')
    .first();
  const passwordInput = page
    .locator('input#ls_password')
    .first();
  const loginButton = page
    .locator('button[name="loginsubmit"], button:has-text("登录"), input[value="登录"]')
    .first();

  await expect(usernameInput).toBeVisible();
  await usernameInput.fill('292739873@qq.com');
  await passwordInput.fill('125822321');
  await loginButton.click();

  await page.waitForLoadState('domcontentloaded').catch(() => { });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'test-results/52pojie-login-after-click.png', fullPage: true });

  if (page.url() != beforeLoginUrl) {
    await page.click('text=登录')
  }

  await expect(page).toHaveURL(/52pojie\.cn/);
});
