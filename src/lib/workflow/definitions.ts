import type { OvertimeForm, ProcessDefinition, WorkflowFormData } from '$lib/types';

const applicantFields = [
  { key: 'applicant', label: '申请人', type: 'text', required: true, placeholder: '请输入姓名', defaultValue: '陈经理' },
  { key: 'department', label: '所属部门', type: 'text', required: true, placeholder: '请输入部门', defaultValue: '数字化产品部' }
] as const;

export const overtimeProcessDefinition: ProcessDefinition<OvertimeForm> = {
  key: 'overtime',
  idPrefix: 'OT',
  name: '加班申请',
  description: '记录加班安排并提交直属经理审批',
  icon: '时',
  accentClass: 'bg-rose-50 text-signal',
  fields: [
    ...applicantFields,
    { key: 'date', label: '加班日期', type: 'date', required: true },
    { key: 'start', label: '开始时间', type: 'time', required: true, defaultValue: '18:30' },
    { key: 'end', label: '结束时间', type: 'time', required: true, defaultValue: '21:30' },
    {
      key: 'reason',
      label: '加班原因',
      type: 'textarea',
      required: true,
      placeholder: '例如：完成版本发布、处理线上问题……',
      fullWidth: true
    }
  ],
  approvalSteps: [
    { key: 'manager', name: '直属经理审批', role: 'manager', roleName: '直属经理', assignee: '陈经理' }
  ],
  list: { dateField: 'date', summaryField: 'reason', metricField: 'hours', metricLabel: '加班时长', metricUnit: '小时' }
};

export const leaveProcessDefinition: ProcessDefinition<WorkflowFormData> = {
  key: 'leave',
  idPrefix: 'LV',
  name: '请假申请',
  description: '提交请假安排，由直属经理和人事依次审批',
  icon: '假',
  accentClass: 'bg-sky-50 text-sky-700',
  fields: [
    ...applicantFields,
    {
      key: 'leaveType',
      label: '请假类型',
      type: 'select',
      required: true,
      defaultValue: 'annual',
      options: [
        { label: '年假', value: 'annual' },
        { label: '病假', value: 'sick' },
        { label: '事假', value: 'personal' }
      ]
    },
    { key: 'startDate', label: '开始日期', type: 'date', required: true },
    { key: 'endDate', label: '结束日期', type: 'date', required: true },
    { key: 'reason', label: '请假事由', type: 'textarea', required: true, placeholder: '请简要说明请假原因', fullWidth: true }
  ],
  approvalSteps: [
    { key: 'manager', name: '直属经理审批', role: 'manager', roleName: '直属经理', assignee: '陈经理' },
    { key: 'hr', name: '人事审批', role: 'hr', roleName: '人事专员', assignee: '林专员' }
  ],
  list: { dateField: 'startDate', summaryField: 'reason', metricField: 'days', metricLabel: '请假天数', metricUnit: '天' }
};

export const reimbursementProcessDefinition: ProcessDefinition<WorkflowFormData> = {
  key: 'reimbursement',
  idPrefix: 'RE',
  name: '报销申请',
  description: '登记费用明细，由直属经理和财务依次审批',
  icon: '¥',
  accentClass: 'bg-emerald-50 text-emerald-700',
  fields: [
    ...applicantFields,
    { key: 'expenseDate', label: '费用日期', type: 'date', required: true },
    {
      key: 'category',
      label: '费用类型',
      type: 'select',
      required: true,
      defaultValue: 'transport',
      options: [
        { label: '交通费', value: 'transport' },
        { label: '餐饮费', value: 'meal' },
        { label: '住宿费', value: 'hotel' },
        { label: '办公费', value: 'office' },
        { label: '其他', value: 'other' }
      ]
    },
    { key: 'amount', label: '报销金额', type: 'number', required: true, min: 0.01, step: 0.01, placeholder: '0.00' },
    { key: 'description', label: '费用说明', type: 'textarea', required: true, placeholder: '请说明费用用途和相关事项', fullWidth: true }
  ],
  approvalSteps: [
    { key: 'manager', name: '直属经理审批', role: 'manager', roleName: '直属经理', assignee: '陈经理' },
    { key: 'finance', name: '财务审批', role: 'finance', roleName: '财务专员', assignee: '周会计' }
  ],
  list: { dateField: 'expenseDate', summaryField: 'description', metricField: 'amount', metricLabel: '报销金额', metricUnit: '元' }
};

export const processDefinitions: ProcessDefinition<WorkflowFormData>[] = [
  overtimeProcessDefinition as ProcessDefinition<WorkflowFormData>,
  leaveProcessDefinition,
  reimbursementProcessDefinition
];

const processDefinitionMap = Object.fromEntries(
  processDefinitions.map((definition) => [definition.key, definition])
);

export function getProcessDefinition(processKey: string): ProcessDefinition<WorkflowFormData> | undefined {
  return processDefinitionMap[processKey];
}
