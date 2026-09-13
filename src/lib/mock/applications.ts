import type { OvertimeApplication } from '$lib/types';

export const seedApplications: OvertimeApplication[] = [
  {
    id: 'OT-260912-01',
    applicant: '林晓雨',
    department: '数字化产品部',
    date: '2026-09-12',
    start: '18:30',
    end: '21:30',
    hours: 3,
    reason: '支付网关版本发布与回归验证',
    status: 'pending',
    createdAt: '2026-09-12T16:18:00',
    updatedAt: '2026-09-12T16:18:00',
    history: [
      { action: '提交申请', actor: '林晓雨', time: '2026-09-12T16:18:00' }
    ]
  },
  {
    id: 'OT-260910-02',
    applicant: '周子昂',
    department: '客户体验部',
    date: '2026-09-10',
    start: '19:00',
    end: '22:00',
    hours: 3,
    reason: '客户调研报告紧急交付',
    status: 'approved',
    createdAt: '2026-09-10T15:42:00',
    updatedAt: '2026-09-11T09:14:00',
    history: [
      { action: '提交申请', actor: '周子昂', time: '2026-09-10T15:42:00' },
      { action: '审批通过', actor: '陈经理', time: '2026-09-11T09:14:00', note: '已确认交付节点' }
    ]
  },
  {
    id: 'OT-260909-03',
    applicant: '唐可欣',
    department: '风险管理部',
    date: '2026-09-09',
    start: '18:00',
    end: '20:00',
    hours: 2,
    reason: '季度风险数据盘点',
    status: 'rejected',
    createdAt: '2026-09-09T11:26:00',
    updatedAt: '2026-09-09T17:08:00',
    history: [
      { action: '提交申请', actor: '唐可欣', time: '2026-09-09T11:26:00' },
      { action: '审批驳回', actor: '陈经理', time: '2026-09-09T17:08:00', note: '请补充盘点范围' }
    ]
  },
  {
    id: 'OT-260908-04',
    applicant: '王浩然',
    department: '信息科技部',
    date: '2026-09-08',
    start: '18:30',
    end: '19:30',
    hours: 1,
    reason: '服务器例行维护',
    status: 'draft',
    createdAt: '2026-09-08T18:03:00',
    updatedAt: '2026-09-08T18:03:00',
    history: []
  }
];
