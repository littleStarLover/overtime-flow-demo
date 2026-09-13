import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { applications } from '$lib/stores/applications';
import { seedApplications } from '$lib/mock/applications';

vi.mock('echarts/dist/echarts.esm.min', () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn()
  }))
}));

import DashboardPage from './+page.svelte';

function resetApplications() {
  applications.set(structuredClone(seedApplications));
}

describe('dashboard page', () => {
  beforeEach(() => {
    resetApplications();
  });

  it('renders the application list, statistics, chart, and detail links', () => {
    render(DashboardPage);

    expect(screen.getByText('申请总览')).toBeInTheDocument();
    expect(screen.getByText(`共 ${seedApplications.length} 条记录`)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '申请状态分布图' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /全部申请/ })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '详情' })).toHaveLength(seedApplications.length);
  });

  it('filters applications by search text', async () => {
    render(DashboardPage);
    const search = screen.getByPlaceholderText('搜索申请人或原因');

    await fireEvent.input(search, { target: { value: '林晓雨' } });

    expect(screen.getByText('林晓雨')).toBeInTheDocument();
    expect(screen.queryByText('周子昂')).not.toBeInTheDocument();
    expect(screen.getByText('共 1 条记录')).toBeInTheDocument();
  });

  it('filters applications by status', async () => {
    render(DashboardPage);
    const statusSelect = screen.getByRole('combobox');

    await fireEvent.change(statusSelect, { target: { value: 'rejected' } });

    expect(screen.getByText('唐可欣')).toBeInTheDocument();
    expect(screen.queryByText('林晓雨')).not.toBeInTheDocument();
    expect(screen.getByText('共 1 条记录')).toBeInTheDocument();
  });

  it('shows drafts and restores all applications from the total card', async () => {
    render(DashboardPage);
    const statButtons = screen.getAllByRole('button');
    const draftCard = statButtons.find((button) => button.textContent?.includes('草稿箱') && button.textContent?.includes('查看并继续编辑'));
    const allCard = statButtons.find((button) => button.textContent?.includes('全部申请') && button.textContent?.includes('当前共记录'));

    expect(draftCard).toBeDefined();
    expect(allCard).toBeDefined();
    await fireEvent.click(draftCard!);
    expect(screen.getByText('王浩然')).toBeInTheDocument();
    expect(screen.getByText('共 1 条记录')).toBeInTheDocument();

    await fireEvent.click(allCard!);
    expect(screen.getByText(`共 ${get(applications).length} 条记录`)).toBeInTheDocument();
  });
});
