import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  applications,
  createApplication,
  updateApplicationStatus,
  updateDraft,
  workflowStorageKey
} from './applications';
import { seedApplications } from '$lib/mock/applications';
import type { OvertimeForm } from '$lib/types';

vi.mock('$app/environment', () => ({ browser: true }));

const form: OvertimeForm = {
  applicant: '测试用户',
  department: '测试部门',
  date: '2026-09-13',
  start: '18:00',
  end: '21:30',
  reason: '测试加班申请'
};

function resetApplications() {
  applications.set(structuredClone(seedApplications));
}

describe('applications store', () => {
  beforeEach(() => {
    resetApplications();
  });

  it('creates a submitted application with calculated hours and history', () => {
    const id = createApplication('overtime', form);
    const created = get(applications)[0];

    expect(id).toMatch(/^OT-\d{6}-\d{2}$/);
    expect(created).toMatchObject({
      id,
      processKey: 'overtime',
      formData: { ...form, hours: 3.5 },
      currentStep: 0,
      status: 'pending'
    });
    expect(created.history).toHaveLength(1);
    expect(created.history[0].action).toBe('提交申请');
  });

  it('creates and updates a draft without submitting it', () => {
    const id = createApplication('overtime', form, 'draft');
    updateDraft(id, { ...form, reason: '更新后的原因' });
    const draft = get(applications).find((item) => item.id === id);

    expect(draft?.status).toBe('draft');
    expect(draft?.formData.reason).toBe('更新后的原因');
    expect(draft?.formData.hours).toBe(3.5);
    expect(draft?.history).toEqual([]);
  });

  it('creates leave and reimbursement instances from the shared store API', () => {
    const leaveId = createApplication('leave', {
      applicant: '测试用户', department: '测试部门', leaveType: 'annual',
      startDate: '2026-09-15', endDate: '2026-09-17', reason: '家庭安排'
    });
    const reimbursementId = createApplication('reimbursement', {
      applicant: '测试用户', department: '测试部门', expenseDate: '2026-09-15',
      category: 'transport', amount: '128.50', description: '交通费'
    });

    expect(leaveId).toMatch(/^LV-/);
    expect(reimbursementId).toMatch(/^RE-/);
    expect(get(applications).find((item) => item.id === leaveId)?.formData.days).toBe(3);
    expect(get(applications).find((item) => item.id === reimbursementId)?.formData.amount).toBe(128.5);
  });

  it('uses each active approval role across a two-step process', () => {
    const leaveId = createApplication('leave', {
      applicant: '测试用户', department: '测试部门', leaveType: 'annual',
      startDate: '2026-09-15', endDate: '2026-09-16', reason: '两级审批验证'
    });
    updateApplicationStatus(leaveId, 'approve');
    const managerApproved = get(applications).find((item) => item.id === leaveId)!;

    expect(managerApproved).toMatchObject({ status: 'pending', currentStep: 1 });
    expect(managerApproved.history.at(-1)).toMatchObject({ actor: '陈经理', stepKey: 'manager' });

    updateApplicationStatus(leaveId, 'approve');
    const approved = get(applications).find((item) => item.id === leaveId)!;

    expect(approved.status).toBe('approved');
    expect(approved.history.at(-1)).toMatchObject({ actor: '林专员', stepKey: 'hr', stepName: '人事审批' });
  });

  it('does not update a non-draft record through updateDraft', () => {
    const original = get(applications).find((item) => item.status === 'pending');
    updateDraft(original!.id, form);
    expect(get(applications).find((item) => item.id === original!.id)).toEqual(original);
  });

  it.each([
    ['approve', 'approved', '审批通过'],
    ['reject', 'rejected', '审批驳回'],
    ['withdraw', 'withdrawn', '撤回申请']
  ] as const)('records the %s workflow transition', (action, status, label) => {
    const pending = get(applications).find((item) => item.status === 'pending')!;
    const historyLength = pending.history.length;

    updateApplicationStatus(pending.id, action);
    const updated = get(applications).find((item) => item.id === pending.id)!;

    expect(updated.status).toBe(status);
    expect(updated.history).toHaveLength(historyLength + 1);
    expect(updated.history.at(-1)?.action).toBe(label);
  });

  it('does not change a record for an invalid transition', () => {
    const approved = get(applications).find((item) => item.status === 'approved')!;
    const before = structuredClone(approved);

    updateApplicationStatus(approved.id, 'approve');

    expect(get(applications).find((item) => item.id === approved.id)).toEqual(before);
  });

  it('persists store updates to localStorage', () => {
    createApplication('overtime', form, 'draft');
    const stored = JSON.parse(localStorage.getItem(workflowStorageKey) || '[]');

    expect(stored).toHaveLength(seedApplications.length + 1);
    expect(stored[0].status).toBe('draft');
    expect(stored[0].processKey).toBe('overtime');
  });
});
