import type { WorkflowStatus } from '$lib/types';

export const statusMeta: Record<WorkflowStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-slate-100 text-slate-600' },
  pending: { label: '待审批', className: 'bg-amber-50 text-amber-700' },
  approved: { label: '已通过', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: '已驳回', className: 'bg-rose-50 text-rose-700' },
  withdrawn: { label: '已撤回', className: 'bg-slate-100 text-slate-500' }
};
