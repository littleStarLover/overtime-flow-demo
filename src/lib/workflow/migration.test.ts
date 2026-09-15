import { describe, expect, it } from 'vitest';
import { migrateStoredWorkflows } from './migration';

const legacyApplication = {
  id: 'OT-260915-01',
  applicant: '旧用户',
  department: '测试部门',
  date: '2026-09-15',
  start: '18:00',
  end: '20:00',
  hours: 2,
  reason: '旧数据迁移',
  status: 'pending',
  createdAt: '2026-09-15T09:00:00.000Z',
  updatedAt: '2026-09-15T09:00:00.000Z',
  history: []
};

describe('workflow storage migration', () => {
  it('converts a legacy flat overtime record', () => {
    const [migrated] = migrateStoredWorkflows([legacyApplication]);

    expect(migrated).toMatchObject({
      id: legacyApplication.id,
      processKey: 'overtime',
      currentStep: 0,
      formData: {
        applicant: '旧用户',
        hours: 2,
        reason: '旧数据迁移'
      }
    });
  });

  it('keeps an instance already using the workflow shape', () => {
    const workflow = {
      id: legacyApplication.id,
      processKey: 'overtime',
      formData: {
        applicant: legacyApplication.applicant,
        department: legacyApplication.department,
        date: legacyApplication.date,
        start: legacyApplication.start,
        end: legacyApplication.end,
        hours: legacyApplication.hours,
        reason: legacyApplication.reason
      },
      status: 'pending',
      currentStep: 0,
      createdAt: legacyApplication.createdAt,
      updatedAt: legacyApplication.updatedAt,
      history: []
    };

    expect(migrateStoredWorkflows([workflow])).toEqual([workflow]);
  });

  it('ignores malformed stored values', () => {
    expect(migrateStoredWorkflows(null)).toEqual([]);
    expect(migrateStoredWorkflows([{ id: 'broken' }])).toEqual([]);
  });
});
