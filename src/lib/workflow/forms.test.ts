import { describe, expect, it } from 'vitest';
import { getProcessDefinition } from './definitions';
import { createInitialForm, prepareWorkflowForm, validateWorkflowForm } from './forms';

describe('workflow form configuration', () => {
  it('creates defaults and calculates overtime hours', () => {
    const definition = getProcessDefinition('overtime')!;
    const form = createInitialForm(definition, '2026-09-15');

    expect(form).toMatchObject({ applicant: '陈经理', date: '2026-09-15', start: '18:30', end: '21:30' });
    expect(prepareWorkflowForm('overtime', form)).toMatchObject({ hours: 3 });
  });

  it('calculates inclusive leave days and validates the date range', () => {
    const definition = getProcessDefinition('leave')!;
    const form = {
      ...createInitialForm(definition, '2026-09-15'),
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      reason: '家庭安排'
    };

    expect(validateWorkflowForm(definition, form)).toEqual({});
    expect(prepareWorkflowForm('leave', form)).toMatchObject({ days: 3 });
    expect(validateWorkflowForm(definition, { ...form, endDate: '2026-09-14' })).toMatchObject({
      endDate: '结束日期不能早于开始日期'
    });
  });

  it('normalizes and validates reimbursement amounts', () => {
    const definition = getProcessDefinition('reimbursement')!;
    const form = {
      ...createInitialForm(definition, '2026-09-15'),
      amount: '288.60',
      description: '客户拜访交通费'
    };

    expect(validateWorkflowForm(definition, form)).toEqual({});
    expect(prepareWorkflowForm('reimbursement', form)).toMatchObject({ amount: 288.6 });
    expect(validateWorkflowForm(definition, { ...form, amount: 0 })).toMatchObject({
      amount: '报销金额不能小于 0.01'
    });
  });
});
