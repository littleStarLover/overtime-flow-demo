<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import {
    applications,
    createApplication,
    updateApplicationStatus,
    updateDraft
  } from '$lib/stores/applications';
  import { calculateHours, validateOvertime } from '$lib/utils/overtime';
  import type { OvertimeForm } from '$lib/types';

  const autosaveKey = 'overtime-flow-form-autosave';
  let step = 1;
  let errors: Record<string, string> = {};
  let currentDraftId: string | null = null;
  let formReady = false;
  let toastMessage = '';
  let toastTimer: ReturnType<typeof setTimeout>;
  let form: OvertimeForm = {
    applicant: '陈经理',
    department: '数字化产品部',
    date: new Date().toISOString().slice(0, 10),
    start: '18:30',
    end: '21:30',
    reason: ''
  };

  $: hours = calculateHours(form.start, form.end);
  $: if (browser && formReady) {
    try {
      localStorage.setItem(
        autosaveKey,
        JSON.stringify({ draftId: currentDraftId, form, savedAt: new Date().toISOString() })
      );
    } catch {
      console.warn('Unable to autosave overtime form');
    }
  }

  function initializeForm(rootElement: HTMLDivElement) {
    const draftId = get(page).url.searchParams.get('draft');
    let autosave: { draftId?: string; form?: OvertimeForm } | null = null;

    try {
      const stored = localStorage.getItem(autosaveKey);
      autosave = stored ? JSON.parse(stored) : null;
    } catch {
      console.warn('Unable to restore overtime form');
    }

    if (draftId) {
      const draft = get(applications).find((item) => item.id === draftId && item.status === 'draft');
      if (draft) {
        currentDraftId = draft.id;
        if (autosave?.draftId === draftId && autosave.form) {
          form = autosave.form;
          showToast('已恢复这份草稿的未保存修改');
        } else {
          form = {
            applicant: draft.applicant,
            department: draft.department,
            date: draft.date,
            start: draft.start,
            end: draft.end,
            reason: draft.reason
          };
          showToast('草稿已载入，可以继续编辑');
        }
      }
    } else if (autosave?.form) {
      currentDraftId = autosave.draftId || null;
      form = autosave.form;
      showToast('已恢复上次未完成的内容');
    }

    formReady = true;
    return {};
  }

  function showToast(message: string) {
    toastMessage = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMessage = ''), 2600);
  }

  function clearAutosave() {
    if (!browser) return;
    try {
      localStorage.removeItem(autosaveKey);
    } catch {
      console.warn('Unable to clear overtime autosave');
    }
  }

  function preview() {
    errors = validateOvertime(form);
    if (!Object.keys(errors).length) step = 2;
  }

  function submit() {
    let id = currentDraftId;
    if (id) {
      updateDraft(id, form);
      updateApplicationStatus(id, 'submit');
    } else {
      id = createApplication(form);
    }
    clearAutosave();
    goto(`/applications/${id}`);
  }

  function saveDraft() {
    if (currentDraftId) {
      updateDraft(currentDraftId, form);
    } else {
      currentDraftId = createApplication(form, 'draft');
    }
    showToast(`草稿已保存 · ${currentDraftId}`);
  }
</script>

<svelte:head><title>发起申请 · Overtime Desk</title></svelte:head>

<div use:initializeForm class="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-10">
  {#if toastMessage}
    <div class="fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl" role="status">
      <span class="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[11px]">✓</span>
      {toastMessage}
    </div>
  {/if}
  <a href="/" class="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-signal">← 返回申请总览</a>
  <div class="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p class="text-xs font-bold uppercase tracking-[0.22em] text-signal">{currentDraftId ? 'Edit draft' : 'New request'} / 02</p><h1 class="mt-2 text-3xl font-black tracking-[-0.04em]">{currentDraftId ? '编辑加班草稿' : '发起加班申请'}<span class="text-signal">.</span></h1><p class="mt-2 text-sm text-slate-500">填写内容会自动暂存在当前浏览器，提交前可以完整预览。</p></div><div class="flex items-center gap-2 text-xs font-bold text-slate-400"><span class={`grid h-7 w-7 place-items-center rounded-full ${step === 1 ? 'bg-signal text-white' : 'bg-ink text-white'}`}>1</span><span class={step === 1 ? 'text-ink' : ''}>填写</span><span class="mx-1 h-px w-8 bg-line"></span><span class={`grid h-7 w-7 place-items-center rounded-full ${step === 2 ? 'bg-signal text-white' : 'bg-slate-200'}`}>2</span><span class={step === 2 ? 'text-ink' : ''}>预览</span></div></div>

  {#if step === 1}
    <form class="mt-8 space-y-5" on:submit|preventDefault={preview}>
      <section class="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7"><div class="mb-6 flex items-start justify-between"><div><h2 class="font-extrabold">申请人信息</h2><p class="mt-1 text-xs text-slate-400">确认本次申请归属的人员与部门</p></div><span class="text-xs font-bold text-slate-300">01</span></div><div class="grid gap-5 sm:grid-cols-2"><label class="block"><span class="mb-2 block text-xs font-bold text-slate-600">申请人 <i class="text-signal">*</i></span><input bind:value={form.applicant} class="h-11 w-full rounded-lg border border-line bg-[#fbfcfe] px-3 text-sm outline-none transition focus:border-signal" placeholder="请输入姓名" />{#if errors.applicant}<span class="mt-1.5 block text-xs text-signal">{errors.applicant}</span>{/if}</label><label class="block"><span class="mb-2 block text-xs font-bold text-slate-600">所属部门 <i class="text-signal">*</i></span><input bind:value={form.department} class="h-11 w-full rounded-lg border border-line bg-[#fbfcfe] px-3 text-sm outline-none transition focus:border-signal" placeholder="请输入部门" />{#if errors.department}<span class="mt-1.5 block text-xs text-signal">{errors.department}</span>{/if}</label></div></section>
      <section class="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7"><div class="mb-6 flex items-start justify-between"><div><h2 class="font-extrabold">加班安排</h2><p class="mt-1 text-xs text-slate-400">系统会根据起止时间自动计算时长</p></div><span class="text-xs font-bold text-slate-300">02</span></div><div class="grid gap-5 sm:grid-cols-3"><label class="block sm:col-span-1"><span class="mb-2 block text-xs font-bold text-slate-600">加班日期 <i class="text-signal">*</i></span><input type="date" bind:value={form.date} class="h-11 w-full rounded-lg border border-line bg-[#fbfcfe] px-3 text-sm outline-none focus:border-signal" />{#if errors.date}<span class="mt-1.5 block text-xs text-signal">{errors.date}</span>{/if}</label><label class="block"><span class="mb-2 block text-xs font-bold text-slate-600">开始时间 <i class="text-signal">*</i></span><input type="time" bind:value={form.start} class="h-11 w-full rounded-lg border border-line bg-[#fbfcfe] px-3 text-sm outline-none focus:border-signal" /></label><label class="block"><span class="mb-2 block text-xs font-bold text-slate-600">结束时间 <i class="text-signal">*</i></span><input type="time" bind:value={form.end} class="h-11 w-full rounded-lg border border-line bg-[#fbfcfe] px-3 text-sm outline-none focus:border-signal" /></label></div>{#if errors.time}<span class="mt-2 block text-xs text-signal">{errors.time}</span>{/if}<div class="mt-5 flex items-center justify-between rounded-xl bg-[#f5f8fc] px-4 py-3"><span class="text-xs font-semibold text-slate-500">预计加班时长</span><span class="text-lg font-black text-ink">{hours}<small class="ml-1 text-xs font-bold text-slate-400">小时</small></span></div></section>
      <section class="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7"><div class="mb-6 flex items-start justify-between"><div><h2 class="font-extrabold">申请说明</h2><p class="mt-1 text-xs text-slate-400">说明本次加班的具体工作内容</p></div><span class="text-xs font-bold text-slate-300">03</span></div><label class="block"><span class="mb-2 block text-xs font-bold text-slate-600">加班原因 <i class="text-signal">*</i></span><textarea bind:value={form.reason} rows="4" class="w-full resize-none rounded-lg border border-line bg-[#fbfcfe] px-3 py-3 text-sm leading-6 outline-none transition focus:border-signal" placeholder="例如：完成版本发布、处理线上问题……"></textarea>{#if errors.reason}<span class="mt-1.5 block text-xs text-signal">{errors.reason}</span>{/if}</label></section>
      <div class="flex flex-wrap items-center justify-end gap-3 pb-4"><span class="mr-auto text-xs text-slate-400">内容已开启自动暂存</span><a href="/" class="rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300">取消</a><button type="button" class="rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-slate-300" on:click={saveDraft}>保存草稿</button><button type="submit" class="rounded-xl bg-signal px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/10 transition hover:bg-[#b9151b]">预览申请 →</button></div>
    </form>
  {:else}
    <section class="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-sm"><div class="bg-ink px-6 py-6 text-white sm:px-8"><p class="text-xs font-bold uppercase tracking-[0.2em] text-[#eaa6a7]">Review request</p><h2 class="mt-2 text-2xl font-black">请确认申请信息</h2><p class="mt-2 text-sm text-slate-300">确认无误后提交，申请将进入审批流程。</p></div><div class="divide-y divide-line px-6 sm:px-8"><div class="grid gap-5 py-6 sm:grid-cols-3"><div><p class="text-xs text-slate-400">申请人</p><p class="mt-2 text-sm font-bold">{form.applicant}</p></div><div><p class="text-xs text-slate-400">所属部门</p><p class="mt-2 text-sm font-bold">{form.department}</p></div><div><p class="text-xs text-slate-400">申请类型</p><p class="mt-2 text-sm font-bold">加班申请</p></div></div><div class="grid gap-5 py-6 sm:grid-cols-3"><div><p class="text-xs text-slate-400">加班日期</p><p class="mt-2 text-sm font-bold">{form.date}</p></div><div><p class="text-xs text-slate-400">起止时间</p><p class="mt-2 text-sm font-bold">{form.start} — {form.end}</p></div><div><p class="text-xs text-slate-400">预计时长</p><p class="mt-2 text-lg font-black text-signal">{hours} 小时</p></div></div><div class="py-6"><p class="text-xs text-slate-400">加班原因</p><p class="mt-2 text-sm font-semibold leading-7 text-ink">{form.reason}</p></div></div><div class="flex flex-wrap justify-end gap-3 bg-[#fafbfd] px-6 py-5 sm:px-8"><button class="rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300" on:click={() => (step = 1)}>← 返回修改</button><button class="rounded-xl bg-signal px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/10 transition hover:bg-[#b9151b]" on:click={submit}>确认并提交</button></div></section>
  {/if}
</div>
