import { describe, expect, it } from 'vitest';
import { createWorkflowInstance, transitionWorkflow } from './engine';
import type { ProcessDefinition, WorkflowFormData } from '$lib/types';

const twoStepDefinition: ProcessDefinition = {
  key: 'leave',
  idPrefix: 'LV',
  name: '请假申请',
  description: '用于验证通用多节点流转',
  icon: '假',
  accentClass: '',
  fields: [],
  approvalSteps: [
    { key: 'manager', name: '直属经理审批', role: 'manager', roleName: '直属经理', assignee: '陈经理' },
    { key: 'hr', name: '人事审批', role: 'hr', roleName: '人事专员', assignee: '林专员' }
  ],
  list: { dateField: 'date', summaryField: 'reason' }
};

describe('workflow engine', () => {
  it('creates an instance from a process definition', () => {
    const formData: WorkflowFormData = { applicant: '测试用户', reason: '年假' };
    const instance = createWorkflowInstance(twoStepDefinition, formData, {
      actor: '测试用户',
      timestamp: '2026-09-15T09:00:00.000Z',
      idSuffix: 12
    });

    expect(instance).toMatchObject({
      id: 'LV-260915-12',
      processKey: 'leave',
      formData,
      status: 'pending',
      currentStep: 0
    });
    expect(instance.history[0].action).toBe('提交申请');
  });

  it('moves through every approval step before completing', () => {
    const managerApproved = transitionWorkflow({ status: 'pending', currentStep: 0 }, 'approve', 2);
    expect(managerApproved).toEqual({ status: 'pending', currentStep: 1 });

    const hrApproved = transitionWorkflow(managerApproved, 'approve', 2);
    expect(hrApproved).toEqual({ status: 'approved', currentStep: 1 });
  });

  it.each([
    ['submit', 'draft', 'pending'],
    ['reject', 'pending', 'rejected'],
    ['withdraw', 'pending', 'withdrawn']
  ] as const)('handles %s from %s', (action, status, expected) => {
    expect(transitionWorkflow({ status, currentStep: 0 }, action, 2).status).toBe(expected);
  });

  it('keeps the same state for an unsupported transition', () => {
    const state = { status: 'approved', currentStep: 1 } as const;
    expect(transitionWorkflow(state, 'approve', 2)).toBe(state);
  });
});
