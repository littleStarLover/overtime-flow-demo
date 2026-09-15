import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { applications } from '$lib/stores/applications';
import { seedApplications } from '$lib/mock/applications';

const mocks = vi.hoisted(() => ({
  goto: vi.fn(),
  pageValue: { url: new URL('http://localhost/applications/new'), params: {} }
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

async function chooseProcess(name: '加班申请' | '请假申请' | '报销申请') {
  await fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));
}

describe('new application page', () => {
  beforeEach(resetApplications);

  it('starts with three process choices and renders the selected fields', async () => {
    render(NewApplicationPage);

    expect(screen.getByRole('heading', { name: /选择申请流程/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    await chooseProcess('加班申请');

    expect(screen.getByLabelText(/申请人/)).toHaveValue('陈经理');
    expect(screen.getByLabelText(/所属部门/)).toHaveValue('数字化产品部');
    expect((screen.getByLabelText(/加班日期/) as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getByLabelText(/加班原因/)).toBeInTheDocument();
  });

  it('stays on process selection when autosaved content exists until the user restores it', async () => {
    localStorage.setItem('workflow-form-autosave', JSON.stringify({
      processKey: 'overtime',
      form: {
        applicant: '陈经理', department: '数字化产品部', date: '2026-09-15',
        start: '18:30', end: '21:30', reason: '上次未完成内容'
      }
    }));

    render(NewApplicationPage);

    expect(screen.getByRole('heading', { name: /选择申请流程/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/加班原因/)).not.toBeInTheDocument();
    expect(screen.getByText(/检测到未完成的加班申请/)).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: '继续上次填写' }));
    expect(screen.getByLabelText(/加班原因/)).toHaveValue('上次未完成内容');
  });

  it('switches field definitions for leave and reimbursement', async () => {
    render(NewApplicationPage);
    await chooseProcess('请假申请');

    expect(screen.getByLabelText(/请假类型/)).toHaveValue('annual');
    expect(screen.getByLabelText(/开始日期/)).toBeInTheDocument();
    expect(screen.getByLabelText(/结束日期/)).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: '更换流程' }));
    await chooseProcess('报销申请');
    expect(screen.getByLabelText(/费用类型/)).toHaveValue('transport');
    expect(screen.getByLabelText(/报销金额/)).toBeInTheDocument();
    expect(screen.getByLabelText(/费用说明/)).toBeInTheDocument();
  });

  it('shows configuration-driven required errors', async () => {
    render(NewApplicationPage);
    await chooseProcess('加班申请');
    await fireEvent.input(screen.getByLabelText(/申请人/), { target: { value: ' ' } });
    await fireEvent.input(screen.getByLabelText(/所属部门/), { target: { value: '' } });
    await fireEvent.input(screen.getByLabelText(/加班日期/), { target: { value: '' } });
    await fireEvent.click(screen.getByRole('button', { name: /预览申请/ }));

    expect(screen.getByText('请填写申请人')).toBeInTheDocument();
    expect(screen.getByText('请填写所属部门')).toBeInTheDocument();
    expect(screen.getByText('请填写加班日期')).toBeInTheDocument();
    expect(screen.getByText('请填写加班原因')).toBeInTheDocument();
  });

  it('previews valid information and returns to editing', async () => {
    render(NewApplicationPage);
    await chooseProcess('加班申请');
    await fireEvent.input(screen.getByLabelText(/加班原因/), { target: { value: '完成版本发布' } });
    await fireEvent.click(screen.getByRole('button', { name: /预览申请/ }));

    expect(screen.getByText('请确认加班申请信息')).toBeInTheDocument();
    expect(screen.getByText('完成版本发布')).toBeInTheDocument();
    expect(screen.getByText(/3 小时/)).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /返回修改/ }));
    expect(screen.getByLabelText(/加班原因/)).toHaveValue('完成版本发布');
  });

  it('saves a typed draft in the shared application store', async () => {
    render(NewApplicationPage);
    await chooseProcess('请假申请');
    await fireEvent.input(screen.getByLabelText(/请假事由/), { target: { value: '家庭安排' } });
    await fireEvent.click(screen.getByRole('button', { name: /保存草稿/ }));

    const saved = get(applications).find((item) => item.processKey === 'leave' && item.formData.reason === '家庭安排');
    expect(saved).toMatchObject({ status: 'draft', formData: { days: 1 } });
    expect(screen.getByRole('status')).toHaveTextContent('草稿已保存');
    expect(screen.getByRole('heading', { name: /选择申请流程/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/请假事由/)).not.toBeInTheDocument();
    expect(localStorage.getItem('workflow-form-autosave')).toBeNull();
  });

  it('returns to process selection instead of the dashboard when cancelling', async () => {
    render(NewApplicationPage);
    await chooseProcess('加班申请');
    await fireEvent.input(screen.getByLabelText(/加班原因/), { target: { value: '不再继续填写' } });
    await fireEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(screen.getByRole('heading', { name: /选择申请流程/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/加班原因/)).not.toBeInTheDocument();
    expect(mocks.goto).not.toHaveBeenCalledWith('/');
    expect(localStorage.getItem('workflow-form-autosave')).toBeNull();
  });

  it('submits a reimbursement and navigates to the shared detail page', async () => {
    render(NewApplicationPage);
    await chooseProcess('报销申请');
    await fireEvent.input(screen.getByLabelText(/报销金额/), { target: { value: '168.50' } });
    await fireEvent.input(screen.getByLabelText(/费用说明/), { target: { value: '客户拜访交通费' } });
    await fireEvent.click(screen.getByRole('button', { name: /预览申请/ }));
    await fireEvent.click(screen.getByRole('button', { name: /确认并提交/ }));

    const submitted = get(applications).find((item) => item.formData.description === '客户拜访交通费');
    expect(submitted).toMatchObject({ processKey: 'reimbursement', status: 'pending', formData: { amount: 168.5 } });
    expect(mocks.goto).toHaveBeenCalledWith(`/applications/${submitted?.id}`);
  });
});
