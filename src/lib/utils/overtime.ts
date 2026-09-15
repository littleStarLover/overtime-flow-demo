import type { OvertimeForm } from '$lib/types';

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

export function formatDate(date: string) {
  if (!date) return '未填写';
  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return date;
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(
    parsedDate
  );
}
