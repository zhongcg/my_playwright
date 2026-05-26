import { test, expect } from '@playwright/test';

// 定义一个测试用例，名称为 'has title'
// async ({ page }) 表示这是一个异步函数，并且使用了 Playwright 的 page 核心对象（Fixture）
test('检查页面标题', async ({ page }) => {
  // 访问 Playwright 官网
  await page.goto('https://playwright.dev/');

  // 验证页面标题是否包含 "Playwright" 关键字
  // expect(page).toHaveTitle 是 Playwright 的断言方式，支持正则表达式
  await expect(page).toHaveTitle(/Playwright/);
});

// 定义第二个测试用例：模拟用户点击并跳转
test('检查开始使用链接', async ({ page }) => {
  // 1. 访问官网
  await page.goto('https://playwright.dev/');

  // 2. 找到并点击 "Get started" 链接
  // getByRole 是 Playwright 推荐的定位方式，它基于 HTML 语义（无障碍属性）
  // 这种方式比 ID 或 XPath 更健壮，因为即便代码变了，只要按钮文字没变，脚本就不会挂
  await page.getByRole('link', { name: 'Get started' }).click();

  // 3. 验证跳转后的页面是否出现名为 "Installation" 的标题
  // toBeVisible() 会自动等待元素出现，不需要手动写 sleep，这就是“自动等待”特性
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});




