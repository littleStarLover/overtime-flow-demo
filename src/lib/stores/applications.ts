import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { seedApplications } from '$lib/mock/applications';
import { calculateHours, nextStatus } from '$lib/utils/overtime';
import type { OvertimeApplication, OvertimeForm } from '$lib/types';

const storageKey = 'overtime-flow-applications';

function loadApplications(): OvertimeApplication[] {
  if (!browser) return seedApplications;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return seedApplications;

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : seedApplications;
  } catch {
    return seedApplications;
  }
}

export const applications = writable<OvertimeApplication[]>(loadApplications());

if (browser) {
  applications.subscribe((value) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      console.warn('Unable to persist overtime applications');
    }
  });
}

function now() {
  return new Date().toISOString();
}

export function createApplication(form: OvertimeForm, status: OvertimeApplication['status'] = 'pending') {
  const timestamp = now();
  const id = `OT-${timestamp.slice(2, 10).replaceAll('-', '')}-${Math.floor(Math.random() * 90 + 10)}`;
  const application: OvertimeApplication = {
    id,
    ...form,
    hours: calculateHours(form.start, form.end),
    status,
    createdAt: timestamp,
    updatedAt: timestamp,
    history: status === 'pending' ? [{ action: '提交申请', actor: form.applicant, time: timestamp }] : []
  };

  applications.update((items) => [application, ...items]);
  return id;
}

export function updateDraft(id: string, form: OvertimeForm) {
  const timestamp = now();

  applications.update((items) =>
    items.map((item) =>
      item.id === id && item.status === 'draft'
        ? {
            ...item,
            ...form,
            hours: calculateHours(form.start, form.end),
            updatedAt: timestamp
          }
        : item
    )
  );
}

export function updateApplicationStatus(id: string, action: 'submit' | 'approve' | 'reject' | 'withdraw') {
  applications.update((items) =>
    items.map((item) => {
      const status = nextStatus(item.status, action);
      if (status === item.status) return item;

      const actionLabel =
        action === 'submit'
          ? '提交申请'
          : action === 'approve'
            ? '审批通过'
            : action === 'reject'
              ? '审批驳回'
              : '撤回申请';
      return {
        ...item,
        status,
        updatedAt: now(),
        history: [
          ...item.history,
          { action: actionLabel, actor: action === 'submit' || action === 'withdraw' ? item.applicant : '陈经理', time: now() }
        ]
      };
    })
  );
}
