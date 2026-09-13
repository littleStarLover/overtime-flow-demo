import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { applications } from '$lib/stores/applications';
import { seedApplications } from '$lib/mock/applications';

const mocks = vi.hoisted(() => ({
  pageValue: {
    url: new URL('http://localhost/applications/OT-260912-01'),
    params: { id: 'OT-260912-01' }
  }
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe(run: (value: typeof mocks.pageValue) => void) {
      run(mocks.pageValue);
      return () => undefined;
    }
  }
}));

import ApplicationDetailPage from './+page.svelte';

function resetApplications() {
  applications.set(structuredClone(seedApplications));
  mocks.pageValue.url = new URL('http://localhost/applications/OT-260912-01');
  mocks.pageValue.params = { id: 'OT-260912-01' };
}

describe('application detail page', () => {
  beforeEach(() => {
    resetApplications();
  });

  it('renders application details, workflow history, and pending actions', () => {
    render(ApplicationDetailPage);

    expect(screen.getByText('加班信息')).toBeInTheDocument();
    expect(screen.getByText('流程记录')).toBeInTheDocument();
    expect(screen.getAllByText('林晓雨')).toHaveLength(2);
    expect(screen.getByText('提交申请')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '撤回' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '驳回' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '通过申请' })).toBeInTheDocument();
  });

  it('approves a pending application and records the workflow action', async () => {
    render(ApplicationDetailPage);

    await fireEvent.click(screen.getByRole('button', { name: '通过申请' }));
    const updated = get(applications).find((item) => item.id === 'OT-260912-01')!;

    expect(updated.status).toBe('approved');
    expect(updated.history.at(-1)?.action).toBe('审批通过');
    expect(screen.getByText('已通过')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '通过申请' })).not.toBeInTheDocument();
  });

  it('rejects a pending application and records the workflow action', async () => {
    render(ApplicationDetailPage);

    await fireEvent.click(screen.getByRole('button', { name: '驳回' }));
    const updated = get(applications).find((item) => item.id === 'OT-260912-01')!;

    expect(updated.status).toBe('rejected');
    expect(updated.history.at(-1)?.action).toBe('审批驳回');
    expect(screen.getByText('已驳回')).toBeInTheDocument();
  });

  it('shows draft actions for a draft application', () => {
    mocks.pageValue.params = { id: 'OT-260908-04' };
    mocks.pageValue.url = new URL('http://localhost/applications/OT-260908-04');
    render(ApplicationDetailPage);

    expect(screen.getByText('王浩然')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '继续编辑' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提交申请' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '通过申请' })).not.toBeInTheDocument();
  });

  it('shows an empty state when the application does not exist', () => {
    mocks.pageValue.params = { id: 'OT-NOT-FOUND' };
    mocks.pageValue.url = new URL('http://localhost/applications/OT-NOT-FOUND');
    render(ApplicationDetailPage);

    expect(screen.getByText('申请不存在')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '返回申请总览' })).toBeInTheDocument();
  });
});
