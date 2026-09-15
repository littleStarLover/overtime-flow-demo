import { expect, test } from '@playwright/test';

test('uses document scrolling on mobile while keeping the chart visible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: /申请总览/ })).toBeVisible();
  await expect(page.getByRole('img', { name: '申请状态分布图' })).toBeVisible();

  const layout = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).overflowY,
    body: getComputedStyle(document.body).overflowY,
    main: getComputedStyle(document.querySelector('main')!).overflowY,
    dashboard: getComputedStyle(document.querySelector('.dashboard-page')!).overflowY,
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight
  }));

  expect(layout.html).toBe('auto');
  expect(layout.body).toBe('auto');
  expect(layout.main).toBe('visible');
  expect(layout.dashboard).toBe('visible');
  expect(layout.scrollHeight).toBeGreaterThan(layout.viewportHeight);

  await page.evaluate(() => window.scrollTo(0, 500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});
