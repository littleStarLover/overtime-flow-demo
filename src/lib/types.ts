export type WorkflowStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type WorkflowAction = 'submit' | 'approve' | 'reject' | 'withdraw';
export type WorkflowFieldType = 'text' | 'date' | 'time' | 'number' | 'textarea' | 'select';
export type WorkflowFormValue = string | number | boolean | null;
export type WorkflowFormData = Record<string, WorkflowFormValue>;

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDefinition<TForm extends WorkflowFormData = WorkflowFormData> {
  key: Extract<keyof TForm, string>;
  label: string;
  type: WorkflowFieldType;
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  min?: number;
  step?: number;
  defaultValue?: WorkflowFormValue;
  fullWidth?: boolean;
}

export interface ApprovalStep {
  key: string;
  name: string;
  role: string;
  roleName: string;
  assignee: string;
}

export interface ProcessListDisplay {
  dateField: string;
  summaryField: string;
  metricField?: string;
  metricLabel?: string;
  metricUnit?: string;
}

export interface ProcessDefinition<TForm extends WorkflowFormData = WorkflowFormData> {
  key: string;
  idPrefix: string;
  name: string;
  description: string;
  icon: string;
  accentClass: string;
  fields: FieldDefinition<TForm>[];
  approvalSteps: ApprovalStep[];
  list: ProcessListDisplay;
}

export interface WorkflowRecord {
  action: string;
  actor: string;
  time: string;
  stepKey?: string;
  stepName?: string;
  note?: string;
}

export interface WorkflowInstance<TData extends WorkflowFormData = WorkflowFormData> {
  id: string;
  processKey: string;
  formData: TData;
  status: WorkflowStatus;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  history: WorkflowRecord[];
}

export interface OvertimeForm extends WorkflowFormData {
  applicant: string;
  department: string;
  date: string;
  start: string;
  end: string;
  reason: string;
}

export interface OvertimeData extends OvertimeForm {
  hours: number;
}

export type OvertimeApplication = WorkflowInstance<OvertimeData>;
export type WorkflowApplication = WorkflowInstance<WorkflowFormData>;
export type OvertimeStatus = WorkflowStatus;
