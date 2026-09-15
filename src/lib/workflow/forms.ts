import type {
  FieldDefinition,
  ProcessDefinition,
  WorkflowApplication,
  WorkflowFormData,
  WorkflowFormValue
} from '$lib/types';
import { calculateHours } from '$lib/utils/overtime';

function isEmpty(value: WorkflowFormValue | undefined) {
  return value === undefined || value === null || (typeof value === 'string' && !value.trim());
}

export function createInitialForm(definition: ProcessDefinition, today = new Date().toISOString().slice(0, 10)) {
  return Object.fromEntries(
    definition.fields.map((field) => {
      const value = field.defaultValue ?? (field.type === 'date' ? today : field.type === 'number' ? '' : '');
      return [field.key, value];
    })
  ) as WorkflowFormData;
}

export function validateWorkflowForm(definition: ProcessDefinition, form: WorkflowFormData) {
  const errors: Record<string, string> = {};

  for (const field of definition.fields) {
    const value = form[field.key];
    if (field.required && isEmpty(value)) errors[field.key] = `请填写${field.label}`;
    if (field.type === 'number' && !isEmpty(value) && Number(value) < (field.min ?? 0)) {
      errors[field.key] = `${field.label}不能小于 ${field.min ?? 0}`;
    }
  }

  if (definition.key === 'overtime' && form.start && form.end && calculateHours(String(form.start), String(form.end)) <= 0) {
    errors.end = '结束时间必须晚于开始时间';
  }

  if (definition.key === 'leave' && form.startDate && form.endDate && String(form.endDate) < String(form.startDate)) {
    errors.endDate = '结束日期不能早于开始日期';
  }

  return errors;
}

function calculateLeaveDays(startDate: WorkflowFormValue | undefined, endDate: WorkflowFormValue | undefined) {
  if (!startDate || !endDate || String(endDate) < String(startDate)) return 0;
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  return Math.round((end - start) / 86_400_000) + 1;
}

export function prepareWorkflowForm(processKey: string, form: WorkflowFormData): WorkflowFormData {
  if (processKey === 'overtime') {
    return { ...form, hours: calculateHours(String(form.start ?? ''), String(form.end ?? '')) };
  }
  if (processKey === 'leave') {
    return { ...form, days: calculateLeaveDays(form.startDate, form.endDate) };
  }
  if (processKey === 'reimbursement') {
    return { ...form, amount: Number(form.amount) || 0 };
  }
  return { ...form };
}

export function getFieldDisplayValue(field: FieldDefinition, value: WorkflowFormValue | undefined) {
  if (isEmpty(value)) return '未填写';
  const option = field.options?.find((item) => item.value === value);
  if (option) return option.label;
  if (field.type === 'number') return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  return String(value);
}

export function getApplicationSummary(application: WorkflowApplication, definition: ProcessDefinition) {
  return String(application.formData[definition.list.summaryField] ?? '暂无说明');
}

export function getApplicationDate(application: WorkflowApplication, definition: ProcessDefinition) {
  return String(application.formData[definition.list.dateField] ?? '');
}

export function getApplicationMetric(application: WorkflowApplication, definition: ProcessDefinition) {
  const key = definition.list.metricField;
  if (!key) return '';
  const value = application.formData[key];
  if (value === undefined || value === null || value === '') return '';
  const formatted = typeof value === 'number'
    ? value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    : String(value);
  return `${formatted} ${definition.list.metricUnit ?? ''}`.trim();
}
