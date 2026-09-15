import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

async function chooseProcess(page: Page, processName: '加班申请' | '请假申请' | '报销申请') {
  await page.getByRole('button', { name: new RegExp(processName) }).click();
}

test.describe('workflow application', () => {
  test('filters the dashboard, renders the chart, and opens a detail page', async ({ page }) => {
    await openApp(page, '/');

    await expect(page.getByRole('heading', { name: /申请总览/ })).toBeVisible();
    await expect(page.getByText('共 6 条记录')).toBeVisible();
    const statusChart = page.getByRole('img', { name: '申请状态分布图' });
    await expect(statusChart).toBeVisible();
    await expect(statusChart.locator('canvas')).toBeVisible();

    const statusFilter = page.getByRole('combobox', { name: '申请状态' });
    const processFilter = page.getByRole('combobox', { name: '流程类型' });
    await statusFilter.selectOption('approved');
    await processFilter.selectOption('reimbursement');
    await expect(page.getByText('共 1 条记录')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: '赵明远' })).toContainText('报销申请');

    await page.getByRole('button', { name: /全部申请/ }).click();
    await expect(page.getByText('共 6 条记录')).toBeVisible();
    await expect(statusFilter).toHaveValue('all');
    await expect(processFilter).toHaveValue('all');

    const applicationRow = page.getByRole('row').filter({ hasText: '林晓雨' });
    await applicationRow.getByRole('link', { name: '详情' }).click();
    await expect(page).toHaveURL(/\/applications\/OT-260912-01$/);
    await expect(page.getByRole('heading', { name: 'OT-260912-01' })).toBeVisible();
  });

  test('always starts with process selection and cancel returns there', async ({ page }) => {
    await openApp(page, '/applications/new');

    await expect(page.getByRole('heading', { name: /选择申请流程/ })).toBeVisible();
    await chooseProcess(page, '加班申请');
    await expect(page.getByRole('heading', { name: /发起加班申请/ })).toBeVisible();
    await page.getByLabel(/加班原因/).fill('取消后不应保留的 E2E 内容');

    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('heading', { name: /选择申请流程/ })).toBeVisible();
    await expect(page.getByLabel(/加班原因/)).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('workflow-form-autosave'))).toBeNull();

    await openApp(page, '/');
    await page.locator('main').getByRole('link', { name: /发起流程申请/ }).click();
    await expect(page).toHaveURL(/\/applications\/new$/);
    await expect(page.getByRole('heading', { name: /选择申请流程/ })).toBeVisible();
  });

  test('saves a draft, persists it, and continues editing after reload', async ({ page }) => {
    const draftReason = 'E2E 家庭安排草稿';
    await openApp(page, '/applications/new');
    await chooseProcess(page, '请假申请');
    await page.getByLabel(/请假事由/).fill(draftReason);

    await page.getByRole('button', { name: '保存草稿' }).click();
    await expect(page.getByRole('status')).toContainText('草稿已保存');
    await expect(page.getByRole('heading', { name: /选择申请流程/ })).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /选择申请流程/ })).toBeVisible();
    await openApp(page, '/');

    const draftRow = page.getByRole('row').filter({ hasText: draftReason });
    await expect(draftRow).toContainText('草稿');
    await draftRow.getByRole('link', { name: /继续编辑/ }).click();
    await expect(page).toHaveURL(/\/applications\/new\?draft=LV-/);
    await expect(page.getByRole('heading', { name: /编辑请假申请草稿/ })).toBeVisible();
    await expect(page.getByLabel(/请假事由/)).toHaveValue(draftReason);
  });

  test('submits a leave request and completes both approval steps', async ({ page }) => {
    const requestReason = 'E2E 两级审批验证';
    await openApp(page, '/applications/new');
    await chooseProcess(page, '请假申请');
    await page.getByLabel(/请假事由/).fill(requestReason);

    await page.getByRole('button', { name: /预览申请/ }).click();
    await expect(page.getByRole('heading', { name: /请确认请假申请信息/ })).toBeVisible();
    await expect(page.getByText(requestReason)).toBeVisible();
    await page.getByRole('button', { name: '确认并提交' }).click();

    await expect(page).toHaveURL(/\/applications\/LV-/);
    await expect(page.getByText('当前：直属经理审批')).toBeVisible();
    await expect(page.getByText(/下一处理人：林专员/)).toBeVisible();

    await page.getByRole('button', { name: '通过当前节点' }).click();
    await expect(page.getByText('当前：人事审批')).toBeVisible();
    await expect(page.getByText(/当前由.*林专员.*人事专员/)).toBeVisible();

    await page.getByRole('button', { name: '通过当前节点' }).click();
    await expect(page.locator('header').getByText('已通过', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '通过当前节点' })).toHaveCount(0);
    await expect(page.getByText('审批通过', { exact: true })).toHaveCount(2);
  });

  test('submits a reimbursement and shows it in the shared detail page', async ({ page }) => {
    const expenseDescription = 'E2E 客户现场设备运输费用';
    await openApp(page, '/applications/new');
    await chooseProcess(page, '报销申请');
    await page.getByLabel(/报销金额/).fill('486.50');
    await page.getByLabel(/费用说明/).fill(expenseDescription);

    await page.getByRole('button', { name: /预览申请/ }).click();
    await expect(page.getByRole('heading', { name: /请确认报销申请信息/ })).toBeVisible();
    await expect(page.getByText(expenseDescription)).toBeVisible();
    await page.getByRole('button', { name: '确认并提交' }).click();

    await expect(page).toHaveURL(/\/applications\/RE-/);
    await expect(page.locator('header').getByText('待审批', { exact: true })).toBeVisible();
    await expect(page.getByText(expenseDescription)).toBeVisible();
    await expect(page.getByText('486.5', { exact: true })).toBeVisible();
    await expect(page.getByText('当前：直属经理审批')).toBeVisible();
  });

  test('withdraws a pending request and records the result', async ({ page }) => {
    await openApp(page, '/applications/OT-260912-01');

    await page.getByRole('button', { name: '撤回' }).click();
    await expect(page.locator('header').getByText('已撤回', { exact: true })).toBeVisible();
    await expect(page.getByText('撤回申请', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '通过当前节点' })).toHaveCount(0);
  });

  test('submits an existing draft directly from its detail page', async ({ page }) => {
    await openApp(page, '/applications/OT-260908-04');

    await expect(page.locator('header').getByText('草稿', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '继续编辑' })).toBeVisible();
    await page.getByRole('button', { name: '提交申请' }).click();

    await expect(page.locator('header').getByText('待审批', { exact: true })).toBeVisible();
    await expect(page.getByText('当前：直属经理审批')).toBeVisible();
    await expect(page.getByText('提交申请', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '继续编辑' })).toHaveCount(0);
  });

  test('shows required validation errors without leaving the form', async ({ page }) => {
    await openApp(page, '/applications/new');
    await chooseProcess(page, '加班申请');
    await page.getByLabel(/申请人/).fill('');
    await page.getByLabel(/所属部门/).fill('');
    await page.getByLabel(/加班日期/).fill('');

    await page.getByRole('button', { name: /预览申请/ }).click();

    await expect(page.getByText('请填写申请人')).toBeVisible();
    await expect(page.getByText('请填写所属部门')).toBeVisible();
    await expect(page.getByText('请填写加班日期')).toBeVisible();
    await expect(page.getByText('请填写加班原因')).toBeVisible();
    await expect(page.getByRole('heading', { name: /发起加班申请/ })).toBeVisible();
  });

  test('shows an empty state for an unknown application', async ({ page }) => {
    await openApp(page, '/applications/UNKNOWN-ID');

    await expect(page.getByRole('heading', { name: '申请不存在' })).toBeVisible();
    await expect(page.getByText('这条申请可能已被移除，或者链接已失效。')).toBeVisible();
    await expect(page.getByRole('link', { name: '返回申请总览', exact: true })).toHaveAttribute('href', '/');
  });

  test('rejects a pending request and records the result', async ({ page }) => {
    await openApp(page, '/applications/OT-260912-01');

    await expect(page.getByText('当前：直属经理审批')).toBeVisible();
    await page.getByRole('button', { name: '驳回' }).click();
    await expect(page.locator('header').getByText('已驳回', { exact: true })).toBeVisible();
    await expect(page.getByText('审批驳回', { exact: true })).toBeVisible();
  });

  test('keeps desktop page scrolling locked to the application list', async ({ page }) => {
    await openApp(page, '/');

    const overflow = await page.evaluate(() => ({
      html: getComputedStyle(document.documentElement).overflowY,
      body: getComputedStyle(document.body).overflowY,
      main: getComputedStyle(document.querySelector('main')!).overflowY,
      list: getComputedStyle(document.querySelector('.scrollbar-thin')!).overflowY
    }));

    expect(overflow).toEqual({ html: 'hidden', body: 'hidden', main: 'hidden', list: 'auto' });
  });
});
