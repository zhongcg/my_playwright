import { expect, test } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const inputImagePath = '/Users/zhongcg/Desktop/f32b86a425c98c399a716455644c7854.jpg';
const outputImagePath = path.resolve(
  'test-results',
  'pixelhance-processed-image.png',
);

test('Pixelhance 上传图片并下载去背景后的图片', async ({ page, request }) => {
  // 打开 Pixelhance 英文首页，等待 DOM 加载完成即可开始查找上传入口。
  await page.goto('https://pixelhance.com/en', {
    waitUntil: 'domcontentloaded',
  });

  const fileInput = page.locator('input[type="file"]').first();

  // 优先直接给隐藏的 file input 设置文件；如果页面没有现成 input，
  // 再点击 “choose an image” 并通过文件选择器上传。
  if (await fileInput.count()) {
    await fileInput.setInputFiles(inputImagePath);
  } else {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/choose an image/i).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(inputImagePath);
  }

  // 跳转到编辑页并且页面出现 “Background Removed” 才表示去背景任务已经完成。
  await expect(page).toHaveURL('https://pixelhance.com/en/ai-image-editor', {
    timeout: 180_000,
  });
  await expect(page.getByText(/Background Removed/i).first()).toBeVisible({
    timeout: 180_000,
  });

  // 结果图片的 alt 固定为 “Processed image”，拿到它的 src 后再保存到本地。
  const processedImage = page.locator('img[alt="Processed image"]').first();
  await expect(processedImage).toBeVisible({ timeout: 30_000 });

  const imageSource = await processedImage.getAttribute('src');
  expect(imageSource).toBeTruthy();

  // 确保 test-results 目录存在，避免写文件时报目录不存在。
  await fs.mkdir(path.dirname(outputImagePath), { recursive: true });

  // 兼容三种图片来源：
  // 1. data URL：直接解析 base64；
  // 2. blob URL：在浏览器页面内 fetch 后转成 base64；
  // 3. 普通 URL：通过 Playwright request 下载二进制内容。
  if (imageSource!.startsWith('data:')) {
    const base64 = imageSource!.split(',')[1];
    await fs.writeFile(outputImagePath, Buffer.from(base64, 'base64'));
  } else if (imageSource!.startsWith('blob:')) {
    const base64 = await processedImage.evaluate(async (image) => {
      const response = await fetch((image as HTMLImageElement).src);
      const blob = await response.blob();

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;

          if (typeof result !== 'string') {
            reject(new Error('读取 blob 图片失败'));
            return;
          }

          resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    });

    await fs.writeFile(outputImagePath, Buffer.from(base64, 'base64'));
  } else {
    console.log("图片拼接url", page.url());
    console.log("图片地址", new URL(imageSource!, page.url()).href);

    const response = await request.get(new URL(imageSource!, page.url()).href);
    expect(response.ok()).toBeTruthy();
    await fs.writeFile(outputImagePath, await response.body());
  }

  // 最后确认本地文件已经写入，并且大小大于 0，防止下载到空文件。
  await expect.poll(async () => {
    const stat = await fs.stat(outputImagePath);
    return stat.size;
  }).toBeGreaterThan(0);
});
