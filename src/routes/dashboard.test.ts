import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { applications } from '$lib/stores/applications';
import { seedApplications } from '$lib/mock/applications';

vi.mock('echarts/dist/echarts.esm.min', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }))
}));

import DashboardPage from './+page.svelte';

function resetApplications() {
  applications.set(structuredClone(seedApplications));
}

describe('dashboard page', () => {
  beforeEach(resetApplications);

  it('renders all process types, statistics, chart, and detail links', () => {
    render(DashboardPage);

    expect(screen.getByText('申请总览')).toBeInTheDocument();
    expect(screen.getByText(`共 ${seedApplications.length} 条记录`)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '申请状态分布图' })).toBeInTheDocument();
    expect(screen.getAllByText('加班申请').length).toBeGreaterThan(0);
    expect(screen.getAllByText('请假申请').length).toBeGreaterThan(0);
    expect(screen.getAllByText('报销申请').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: '详情' })).toHaveLength(seedApplications.length);
  });

  it('filters applications by applicant or content', async () => {
    render(DashboardPage);
    await fireEvent.input(screen.getByPlaceholderText('搜索申请人或内容'), { target: { value: '家庭出行' } });

    expect(screen.getByText('许嘉宁')).toBeInTheDocument();
    expect(screen.queryByText('林晓雨')).not.toBeInTheDocument();
    expect(screen.getByText('共 1 条记录')).toBeInTheDocument();
  });

  it('filters applications by status and process type', async () => {
    render(DashboardPage);
    await fireEvent.change(screen.getByRole('combobox', { name: '申请状态' }), { target: { value: 'approved' } });
    await fireEvent.change(screen.getByRole('combobox', { name: '流程类型' }), { target: { value: 'reimbursement' } });

    expect(screen.getByText('赵明远')).toBeInTheDocument();
    expect(screen.queryByText('周子昂')).not.toBeInTheDocument();
    expect(screen.getByText('共 1 条记录')).toBeInTheDocument();
  });

  it('shows drafts and clears every filter from the total card', async () => {
    render(DashboardPage);
    const draftCard = screen.getAllByRole('button').find((button) => button.textContent?.includes('查看并继续编辑'))!;
    const allCard = screen.getByRole('button', { name: /全部申请/ });

    await fireEvent.click(draftCard);
    await fireEvent.input(screen.getByPlaceholderText('搜索申请人或内容'), { target: { value: '王浩然' } });
    expect(screen.getByText('共 1 条记录')).toBeInTheDocument();

    await fireEvent.click(allCard);
    expect(screen.getByText(`共 ${get(applications).length} 条记录`)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索申请人或内容')).toHaveValue('');
  });
});
