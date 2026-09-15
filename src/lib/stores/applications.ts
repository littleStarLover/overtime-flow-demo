import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { seedApplications } from '$lib/mock/applications';
import { getProcessDefinition } from '$lib/workflow/definitions';
import { createWorkflowInstance, transitionWorkflow } from '$lib/workflow/engine';
import { prepareWorkflowForm } from '$lib/workflow/forms';
import { migrateStoredWorkflows } from '$lib/workflow/migration';
import type { WorkflowAction, WorkflowApplication, WorkflowFormData, WorkflowStatus } from '$lib/types';

export const workflowStorageKey = 'workflow-instances';
const legacyStorageKey = 'overtime-flow-applications';

function readStoredApplications(key: string): WorkflowApplication[] | null {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  const parsed = JSON.parse(stored);
  if (Array.isArray(parsed) && parsed.length === 0) return [];

  const migrated = migrateStoredWorkflows(parsed);
  return migrated.length ? migrated : null;
}

function loadApplications(): WorkflowApplication[] {
  if (!browser) return seedApplications;

  try {
    return readStoredApplications(workflowStorageKey)
      ?? readStoredApplications(legacyStorageKey)
      ?? seedApplications;
  } catch {
    return seedApplications;
  }
}

export const workflowInstances = writable<WorkflowApplication[]>(loadApplications());
export const applications = workflowInstances;

if (browser) {
  workflowInstances.subscribe((value) => {
    try {
      localStorage.setItem(workflowStorageKey, JSON.stringify(value));
    } catch {
      console.warn('Unable to persist workflow instances');
    }
  });
}

function now() {
  return new Date().toISOString();
}

export function createApplication(processKey: string, form: WorkflowFormData, status: WorkflowStatus = 'pending') {
  const definition = getProcessDefinition(processKey);
  if (!definition) throw new Error(`Unknown process definition: ${processKey}`);

  const application = createWorkflowInstance(definition, prepareWorkflowForm(processKey, form), {
    actor: String(form.applicant || '申请人'),
    status
  });

  workflowInstances.update((items) => [application, ...items]);
  return application.id;
}

export function updateDraft(id: string, form: WorkflowFormData) {
  const timestamp = now();

  workflowInstances.update((items) =>
    items.map((item) =>
      item.id === id && item.status === 'draft'
        ? { ...item, formData: prepareWorkflowForm(item.processKey, form), updatedAt: timestamp }
        : item
    )
  );
}

export function updateApplicationStatus(id: string, action: WorkflowAction) {
  workflowInstances.update((items) =>
    items.map((item) => {
      if (item.id !== id) return item;

      const definition = getProcessDefinition(item.processKey);
      if (!definition) return item;

      const previousState = { status: item.status, currentStep: item.currentStep };
      const nextState = transitionWorkflow(previousState, action, definition.approvalSteps.length);
      if (nextState === previousState) return item;

      const timestamp = now();
      const activeStep = definition.approvalSteps[item.currentStep];
      const actionLabel =
        action === 'submit'
          ? '提交申请'
          : action === 'approve'
            ? '审批通过'
            : action === 'reject'
              ? '审批驳回'
              : '撤回申请';
      const actor = action === 'submit' || action === 'withdraw'
        ? String(item.formData.applicant || '申请人')
        : activeStep?.assignee ?? activeStep?.roleName ?? '审批人';

      return {
        ...item,
        ...nextState,
        updatedAt: timestamp,
        history: [
          ...item.history,
          {
            action: actionLabel,
            actor,
            time: timestamp,
            stepKey: action === 'approve' || action === 'reject' ? activeStep?.key : undefined,
            stepName: action === 'approve' || action === 'reject' ? activeStep?.name : undefined
          }
        ]
      };
    })
  );
}
