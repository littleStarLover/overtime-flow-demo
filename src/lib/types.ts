export type OvertimeStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface WorkflowRecord {
  action: string;
  actor: string;
  time: string;
  note?: string;
}

export interface OvertimeApplication {
  id: string;
  applicant: string;
  department: string;
  date: string;
  start: string;
  end: string;
  hours: number;
  reason: string;
  status: OvertimeStatus;
  createdAt: string;
  updatedAt: string;
  history: WorkflowRecord[];
}

export interface OvertimeForm {
  applicant: string;
  department: string;
  date: string;
  start: string;
  end: string;
  reason: string;
}
