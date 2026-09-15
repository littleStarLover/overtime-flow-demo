import type { WorkflowApplication } from '$lib/types';

export const seedApplications: WorkflowApplication[] = [
  {
    id: 'OT-260912-01',
    processKey: 'overtime',
    formData: {
      applicant: '林晓雨',
      department: '数字化产品部',
      date: '2026-09-12',
      start: '18:30',
      end: '21:30',
      hours: 3,
      reason: '支付网关版本发布与回归验证'
    },
    status: 'pending',
    currentStep: 0,
    createdAt: '2026-09-12T16:18:00',
    updatedAt: '2026-09-12T16:18:00',
    history: [
      { action: '提交申请', actor: '林晓雨', time: '2026-09-12T16:18:00' }
    ]
  },
  {
    id: 'OT-260910-02',
    processKey: 'overtime',
    formData: {
      applicant: '周子昂',
      department: '客户体验部',
      date: '2026-09-10',
      start: '19:00',
      end: '22:00',
      hours: 3,
      reason: '客户调研报告紧急交付'
    },
    status: 'approved',
    currentStep: 0,
    createdAt: '2026-09-10T15:42:00',
    updatedAt: '2026-09-11T09:14:00',
    history: [
      { action: '提交申请', actor: '周子昂', time: '2026-09-10T15:42:00' },
      { action: '审批通过', actor: '陈经理', time: '2026-09-11T09:14:00', note: '已确认交付节点' }
    ]
  },
  {
    id: 'OT-260909-03',
    processKey: 'overtime',
    formData: {
      applicant: '唐可欣',
      department: '风险管理部',
      date: '2026-09-09',
      start: '18:00',
      end: '20:00',
      hours: 2,
      reason: '季度风险数据盘点'
    },
    status: 'rejected',
    currentStep: 0,
    createdAt: '2026-09-09T11:26:00',
    updatedAt: '2026-09-09T17:08:00',
    history: [
      { action: '提交申请', actor: '唐可欣', time: '2026-09-09T11:26:00' },
      { action: '审批驳回', actor: '陈经理', time: '2026-09-09T17:08:00', note: '请补充盘点范围' }
    ]
  },
  {
    id: 'OT-260908-04',
    processKey: 'overtime',
    formData: {
      applicant: '王浩然',
      department: '信息科技部',
      date: '2026-09-08',
      start: '18:30',
      end: '19:30',
      hours: 1,
      reason: '服务器例行维护'
    },
    status: 'draft',
    currentStep: 0,
    createdAt: '2026-09-08T18:03:00',
    updatedAt: '2026-09-08T18:03:00',
    history: []
  },
  {
    id: 'LV-260907-05',
    processKey: 'leave',
    formData: {
      applicant: '许嘉宁',
      department: '运营管理部',
      leaveType: 'annual',
      startDate: '2026-09-15',
      endDate: '2026-09-17',
      days: 3,
      reason: '家庭出行安排'
    },
    status: 'pending',
    currentStep: 1,
    createdAt: '2026-09-07T10:20:00',
    updatedAt: '2026-09-08T09:30:00',
    history: [
      { action: '提交申请', actor: '许嘉宁', time: '2026-09-07T10:20:00' },
      { action: '审批通过', actor: '陈经理', time: '2026-09-08T09:30:00', stepKey: 'manager', stepName: '直属经理审批' }
    ]
  },
  {
    id: 'RE-260906-06',
    processKey: 'reimbursement',
    formData: {
      applicant: '赵明远',
      department: '销售管理部',
      expenseDate: '2026-09-05',
      category: 'transport',
      amount: 286.5,
      description: '客户现场往返交通费用'
    },
    status: 'approved',
    currentStep: 1,
    createdAt: '2026-09-06T09:15:00',
    updatedAt: '2026-09-07T14:12:00',
    history: [
      { action: '提交申请', actor: '赵明远', time: '2026-09-06T09:15:00' },
      { action: '审批通过', actor: '陈经理', time: '2026-09-06T16:20:00', stepKey: 'manager', stepName: '直属经理审批' },
      { action: '审批通过', actor: '周会计', time: '2026-09-07T14:12:00', stepKey: 'finance', stepName: '财务审批' }
    ]
  }
];
