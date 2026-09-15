import type { WorkflowApplication, WorkflowFormData, WorkflowStatus } from '$lib/types';

const workflowStatuses: WorkflowStatus[] = ['draft', 'pending', 'approved', 'rejected', 'withdrawn'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStatus(value: unknown): value is WorkflowStatus {
  return typeof value === 'string' && workflowStatuses.includes(value as WorkflowStatus);
}

function readFormData(value: Record<string, unknown>): WorkflowFormData | null {
  const source = isRecord(value.formData) ? value.formData : value;
  if (typeof source.applicant !== 'string' || typeof source.department !== 'string') return null;

  const entries = Object.entries(source).filter(([, fieldValue]) =>
    ['string', 'number', 'boolean'].includes(typeof fieldValue) || fieldValue === null
  );
  return Object.fromEntries(entries) as WorkflowFormData;
}

export function migrateStoredWorkflows(value: unknown): WorkflowApplication[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || !isStatus(item.status)) return [];
    if (typeof item.createdAt !== 'string' || typeof item.updatedAt !== 'string' || !Array.isArray(item.history)) {
      return [];
    }

    const formData = readFormData(item);
    if (!formData) return [];

    return [{
      id: item.id,
      processKey: typeof item.processKey === 'string' ? item.processKey : 'overtime',
      formData,
      status: item.status,
      currentStep: typeof item.currentStep === 'number' ? item.currentStep : 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      history: item.history as WorkflowApplication['history']
    }];
  });
}
