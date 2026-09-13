import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { applications } from '$lib/stores/applications';
import { seedApplications } from '$lib/mock/applications';

const mocks = vi.hoisted(() => ({
  goto: vi.fn(),
  pageValue: {
    url: new URL('http://localhost/applications/new'),
    params: {}
  }
}));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ goto: mocks.goto }));
vi.mock('$app/stores', () => ({
  page: {
    subscribe(run: (value: typeof mocks.pageValue) => void) {
      run(mocks.pageValue);
      return () => undefined;
    }
  }
}));

import NewApplicationPage from './+page.svelte';

function resetApplications() {
  applications.set(structuredClone(seedApplications));
  mocks.goto.mockReset();
  mocks.pageValue.url = new URL('http://localhost/applications/new');
  mocks.pageValue.params = {};
}

describe('new application page', () => {
  beforeEach(() => {
    resetApplications();
  });

  it('renders the application fields and actions', () => {
    render(NewApplicationPage);

    expect(screen.getByLabelText(/申请人/)).toHaveValue('陈经理');
    expect(screen.getByLabelText(/所属部门/)).toHaveValue('数字化产品部');
    const dateInput = screen.getByLabelText(/加班日期/) as HTMLInputElement;
    expect(dateInput).not.toHaveValue('');
    expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getAllByLabelText(/时间/)).toHaveLength(2);
    expect(screen.getByLabelText(/加班原因/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存草稿/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /预览申请/ })).toBeInTheDocument();
  });

  it('shows required-field errors when previewing an incomplete form', async () => {
    render(NewApplicationPage);

    await fireEvent.input(screen.getByLabelText(/申请人/), { target: { value: ' ' } });
    await fireEvent.input(screen.getByLabelText(/所属部门/), { target: { value: '' } });
    await fireEvent.input(screen.getByLabelText(/加班原因/), { target: { value: '' } });
    await fireEvent.click(screen.getByRole('button', { name: /预览申请/ }));

    expect(screen.getByText('请输入申请人姓名')).toBeInTheDocument();
    expect(screen.getByText('请输入所属部门')).toBeInTheDocument();
    expect(screen.getByText('请填写加班原因')).toBeInTheDocument();
    expect(screen.queryByText('请确认申请信息')).not.toBeInTheDocument();
  });

  it('previews valid information and returns to editing', async () => {
    render(NewApplicationPage);

    await fireEvent.input(screen.getByLabelText(/加班原因/), { target: { value: '完成版本发布' } });
    await fireEvent.click(screen.getByRole('button', { name: /预览申请/ }));

    expect(screen.getByText('请确认申请信息')).toBeInTheDocument();
    expect(screen.getByText('完成版本发布')).toBeInTheDocument();
    expect(screen.getByText('3 小时')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /返回修改/ }));
    expect(screen.getByRole('button', { name: /预览申请/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/加班原因/)).toHaveValue('完成版本发布');
  });

  it('saves a draft in the application store', async () => {
    render(NewApplicationPage);

    await fireEvent.input(screen.getByLabelText(/加班原因/), { target: { value: '暂存原因' } });
    await fireEvent.click(screen.getByRole('button', { name: /保存草稿/ }));

    const saved = get(applications).find((item) => item.reason === '暂存原因');
    expect(saved).toMatchObject({ status: 'draft', reason: '暂存原因', hours: 3 });
    expect(screen.getByRole('status')).toHaveTextContent('草稿已保存');
  });

  it('submits a valid application and navigates to its detail page', async () => {
    render(NewApplicationPage);

    await fireEvent.input(screen.getByLabelText(/加班原因/), { target: { value: '正式提交原因' } });
    await fireEvent.click(screen.getByRole('button', { name: /预览申请/ }));
    await fireEvent.click(screen.getByRole('button', { name: /确认并提交/ }));

    const submitted = get(applications).find((item) => item.reason === '正式提交原因');
    expect(submitted?.status).toBe('pending');
    expect(submitted?.history[0].action).toBe('提交申请');
    expect(mocks.goto).toHaveBeenCalledWith(`/applications/${submitted?.id}`);
  });
});
