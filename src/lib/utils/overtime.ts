import type { OvertimeForm, OvertimeStatus } from '$lib/types';

export const statusMeta: Record<OvertimeStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-slate-100 text-slate-600' },
  pending: { label: '待审批', className: 'bg-amber-50 text-amber-700' },
  approved: { label: '已通过', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: '已驳回', className: 'bg-rose-50 text-rose-700' },
  withdrawn: { label: '已撤回', className: 'bg-slate-100 text-slate-500' }
};

export function calculateHours(start: string, end: string): number {
  if (!start || !end) return 0;

  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  if (endTotal <= startTotal) return 0;
  return Number(((endTotal - startTotal) / 60).toFixed(2));
}

export function validateOvertime(form: OvertimeForm): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.applicant.trim()) errors.applicant = '请输入申请人姓名';
  if (!form.department.trim()) errors.department = '请输入所属部门';
  if (!form.date) errors.date = '请选择加班日期';
  if (!form.start || !form.end) errors.time = '请选择加班起止时间';
  if (form.start && form.end && calculateHours(form.start, form.end) <= 0) {
    errors.time = '结束时间必须晚于开始时间';
  }
  if (!form.reason.trim()) errors.reason = '请填写加班原因';

  return errors;
}

export function nextStatus(
  status: OvertimeStatus,
  action: 'submit' | 'approve' | 'reject' | 'withdraw'
): OvertimeStatus {
  if (status === 'draft' && action === 'submit') return 'pending';
  if (status === 'pending' && action === 'approve') return 'approved';
  if (status === 'pending' && action === 'reject') return 'rejected';
  if (status === 'pending' && action === 'withdraw') return 'withdrawn';
  return status;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(
    new Date(`${date}T00:00:00`)
  );
}
