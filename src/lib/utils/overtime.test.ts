import { describe, expect, it } from 'vitest';
import { calculateHours, formatDate, nextStatus, validateOvertime } from './overtime';
import type { OvertimeForm } from '$lib/types';

const validForm: OvertimeForm = {
  applicant: '陈经理',
  department: '数字化产品部',
  date: '2026-09-13',
  start: '18:30',
  end: '21:30',
  reason: '完成版本发布'
};

describe('calculateHours', () => {
  it('calculates whole and decimal hours', () => {
    expect(calculateHours('18:30', '21:30')).toBe(3);
    expect(calculateHours('18:15', '20:45')).toBe(2.5);
  });

  it('returns zero for missing or non-positive ranges', () => {
    expect(calculateHours('', '20:00')).toBe(0);
    expect(calculateHours('20:00', '')).toBe(0);
    expect(calculateHours('20:00', '20:00')).toBe(0);
    expect(calculateHours('21:00', '20:00')).toBe(0);
  });
});

describe('validateOvertime', () => {
  it('accepts a complete valid form', () => {
    expect(validateOvertime(validForm)).toEqual({});
  });

  it('reports each missing required field', () => {
    expect(validateOvertime({
      applicant: ' ',
      department: '',
      date: '',
      start: '',
      end: '',
      reason: ' '
    })).toEqual({
      applicant: '请输入申请人姓名',
      department: '请输入所属部门',
      date: '请选择加班日期',
      time: '请选择加班起止时间',
      reason: '请填写加班原因'
    });
  });

  it('rejects an end time that is not later than the start time', () => {
    expect(validateOvertime({ ...validForm, start: '21:30', end: '21:00' })).toEqual({
      time: '结束时间必须晚于开始时间'
    });
  });
});

describe('nextStatus', () => {
  it.each([
    ['draft', 'submit', 'pending'],
    ['pending', 'approve', 'approved'],
    ['pending', 'reject', 'rejected'],
    ['pending', 'withdraw', 'withdrawn']
  ] as const)('moves %s with %s to %s', (status, action, expected) => {
    expect(nextStatus(status, action)).toBe(expected);
  });

  it('keeps the status unchanged for unsupported actions', () => {
    expect(nextStatus('approved', 'approve')).toBe('approved');
    expect(nextStatus('draft', 'approve')).toBe('draft');
  });
});

describe('formatDate', () => {
  it('formats an ISO date for the Chinese interface', () => {
    expect(formatDate('2026-09-13')).toContain('9月13日');
  });
});
