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

function showApplication(id: string) {
  mocks.pageValue.params = { id };
  mocks.pageValue.url = new URL(`http://localhost/applications/${id}`);
}

describe('application detail page', () => {
  beforeEach(resetApplications);

  it('renders configured fields, progress, history, and current handler', () => {
    render(ApplicationDetailPage);

    expect(screen.getByText('加班信息')).toBeInTheDocument();
    expect(screen.getByText('审批进度')).toBeInTheDocument();
    expect(screen.getByText('完整流程记录')).toBeInTheDocument();
    expect(screen.getAllByText(/陈经理 · 直属经理/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '撤回' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '驳回' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '通过当前节点' })).toBeInTheDocument();
  });

  it('approves a one-step overtime process', async () => {
    render(ApplicationDetailPage);
    await fireEvent.click(screen.getByRole('button', { name: '通过当前节点' }));
    const updated = get(applications).find((item) => item.id === 'OT-260912-01')!;

    expect(updated.status).toBe('approved');
    expect(updated.history.at(-1)).toMatchObject({ action: '审批通过', actor: '陈经理', stepKey: 'manager' });
    expect(screen.getAllByText('已通过').length).toBeGreaterThan(0);
  });

  it('moves a two-step leave process to its next role', async () => {
    showApplication('LV-260907-05');
    render(ApplicationDetailPage);

    expect(screen.getByText(/当前由/)).toHaveTextContent('林专员 · 人事专员');
    expect(screen.getByText('人事审批')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: '通过当前节点' }));

    const updated = get(applications).find((item) => item.id === 'LV-260907-05')!;
    expect(updated.status).toBe('approved');
    expect(updated.history.at(-1)).toMatchObject({ actor: '林专员', stepKey: 'hr' });
  });

  it('rejects at the active process step', async () => {
    render(ApplicationDetailPage);
    await fireEvent.click(screen.getByRole('button', { name: '驳回' }));
    const updated = get(applications).find((item) => item.id === 'OT-260912-01')!;

    expect(updated.status).toBe('rejected');
    expect(updated.history.at(-1)?.action).toBe('审批驳回');
    expect(screen.getAllByText('已驳回').length).toBeGreaterThan(0);
  });

  it('shows draft actions for any process draft', () => {
    showApplication('OT-260908-04');
    render(ApplicationDetailPage);

    expect(screen.getByRole('link', { name: '继续编辑' })).toHaveAttribute('href', '/applications/new?draft=OT-260908-04');
    expect(screen.getByRole('button', { name: '提交申请' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '通过当前节点' })).not.toBeInTheDocument();
  });

  it('shows an empty state when the application does not exist', () => {
    showApplication('OT-NOT-FOUND');
    render(ApplicationDetailPage);

    expect(screen.getByText('申请不存在')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '返回申请总览' })).toBeInTheDocument();
  });
});
