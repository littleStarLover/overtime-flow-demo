import type {
  ProcessDefinition,
  WorkflowAction,
  WorkflowFormData,
  WorkflowInstance,
  WorkflowStatus
} from '$lib/types';

export interface WorkflowState {
  status: WorkflowStatus;
  currentStep: number;
}

interface CreateWorkflowOptions {
  status?: WorkflowStatus;
  timestamp?: string;
  idSuffix?: number;
  actor: string;
}

export function createWorkflowInstance<TData extends WorkflowFormData>(
  definition: Pick<ProcessDefinition, 'key' | 'idPrefix'>,
  formData: TData,
  options: CreateWorkflowOptions
): WorkflowInstance<TData> {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const status = options.status ?? 'pending';
  const idSuffix = options.idSuffix ?? Math.floor(Math.random() * 90 + 10);

  return {
    id: `${definition.idPrefix}-${timestamp.slice(2, 10).replaceAll('-', '')}-${idSuffix}`,
    processKey: definition.key,
    formData,
    status,
    currentStep: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    history: status === 'pending' ? [{ action: '提交申请', actor: options.actor, time: timestamp }] : []
  };
}

export function transitionWorkflow(
  state: WorkflowState,
  action: WorkflowAction,
  approvalStepCount: number
): WorkflowState {
  if (state.status === 'draft' && action === 'submit') {
    return { status: approvalStepCount > 0 ? 'pending' : 'approved', currentStep: 0 };
  }

  if (state.status !== 'pending') return state;
  if (action === 'reject') return { ...state, status: 'rejected' };
  if (action === 'withdraw') return { ...state, status: 'withdrawn' };

  if (action === 'approve') {
    const nextStep = state.currentStep + 1;
    return nextStep < approvalStepCount
      ? { status: 'pending', currentStep: nextStep }
      : { status: 'approved', currentStep: state.currentStep };
  }

  return state;
}
