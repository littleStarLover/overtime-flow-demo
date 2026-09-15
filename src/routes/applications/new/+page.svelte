<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import WorkflowField from '$lib/components/WorkflowField.svelte';
  import { applications, createApplication, updateApplicationStatus, updateDraft } from '$lib/stores/applications';
  import type { ProcessDefinition, WorkflowFormData, WorkflowFormValue } from '$lib/types';
  import { getProcessDefinition, processDefinitions } from '$lib/workflow/definitions';
  import { createInitialForm, getFieldDisplayValue, prepareWorkflowForm, validateWorkflowForm } from '$lib/workflow/forms';

  const autosaveKey = 'workflow-form-autosave';
  interface AutosaveData {
    processKey?: string;
    draftId?: string;
    form?: WorkflowFormData;
    savedAt?: string;
  }

  let step = 1;
  let selectedProcessKey = '';
  let definition: ProcessDefinition | undefined;
  let errors: Record<string, string> = {};
  let currentDraftId: string | null = null;
  let formReady = false;
  let toastMessage = '';
  let toastTimer: ReturnType<typeof setTimeout>;
  let form: WorkflowFormData = {};
  let restorableAutosave: AutosaveData | null = null;

  $: definition = getProcessDefinition(selectedProcessKey);
  $: preparedForm = definition ? prepareWorkflowForm(definition.key, form) : form;
  $: metricValue = definition?.list.metricField ? preparedForm[definition.list.metricField] : undefined;
  $: if (browser && formReady && definition) {
    try {
      localStorage.setItem(
        autosaveKey,
        JSON.stringify({ processKey: definition.key, draftId: currentDraftId, form, savedAt: new Date().toISOString() })
      );
    } catch {
      console.warn('Unable to autosave workflow form');
    }
  }

  function editableForm(processDefinition: ProcessDefinition, source: WorkflowFormData) {
    return Object.fromEntries(processDefinition.fields.map((field) => [field.key, source[field.key] ?? ''])) as WorkflowFormData;
  }

  function initializeForm(rootElement: HTMLDivElement) {
    const currentPage = get(page);
    const draftId = currentPage.url.searchParams.get('draft');
    let autosave: AutosaveData | null = null;

    try {
      const stored = localStorage.getItem(autosaveKey);
      autosave = stored ? JSON.parse(stored) : null;
    } catch {
      console.warn('Unable to restore workflow form');
    }

    if (draftId) {
      const draft = get(applications).find((item) => item.id === draftId && item.status === 'draft');
      const draftDefinition = draft && getProcessDefinition(draft.processKey);
      if (draft && draftDefinition) {
        selectedProcessKey = draft.processKey;
        currentDraftId = draft.id;
        form = autosave?.draftId === draftId && autosave.form
          ? autosave.form
          : editableForm(draftDefinition, draft.formData);
        showToast(autosave?.draftId === draftId ? '已恢复这份草稿的未保存修改' : '草稿已载入，可以继续编辑');
      }
    } else if (autosave?.processKey && autosave.form && getProcessDefinition(autosave.processKey)) {
      restorableAutosave = autosave;
    }

    formReady = true;
    return {};
  }

  function selectProcess(processKey: string) {
    const nextDefinition = getProcessDefinition(processKey);
    if (!nextDefinition) return;
    selectedProcessKey = processKey;
    currentDraftId = null;
    step = 1;
    errors = {};
    form = createInitialForm(nextDefinition);
    restorableAutosave = null;
  }

  function restoreAutosave() {
    const autosave = restorableAutosave;
    if (!autosave?.processKey || !autosave.form || !getProcessDefinition(autosave.processKey)) return;
    const storedDraft = autosave.draftId
      ? get(applications).find((item) => item.id === autosave.draftId && item.status === 'draft' && item.processKey === autosave.processKey)
      : undefined;

    selectedProcessKey = autosave.processKey;
    currentDraftId = storedDraft?.id ?? null;
    step = 1;
    errors = {};
    form = autosave.form;
    restorableAutosave = null;
    showToast('已恢复上次未完成的内容');
  }

  function returnToProcessSelection() {
    clearAutosave();
    selectedProcessKey = '';
    currentDraftId = null;
    step = 1;
    errors = {};
    form = {};
    restorableAutosave = null;

    if (get(page).url.search) {
      goto('/applications/new', { replaceState: true, noScroll: true, keepFocus: true });
    }
  }

  function updateField(key: string, value: WorkflowFormValue) {
    form = { ...form, [key]: value };
    if (errors[key]) errors = { ...errors, [key]: '' };
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
      console.warn('Unable to clear workflow autosave');
    }
  }

  function preview() {
    if (!definition) return;
    errors = validateWorkflowForm(definition, form);
    if (!Object.keys(errors).length) step = 2;
  }

  function submit() {
    if (!definition) return;
    let id = currentDraftId;
    if (id) {
      updateDraft(id, form);
      updateApplicationStatus(id, 'submit');
    } else {
      id = createApplication(definition.key, form);
    }
    clearAutosave();
    goto(`/applications/${id}`);
  }

  function saveDraft() {
    if (!definition) return;
    if (currentDraftId) updateDraft(currentDraftId, form);
    else currentDraftId = createApplication(definition.key, form, 'draft');
    const savedDraftId = currentDraftId;
    returnToProcessSelection();
    showToast(`草稿已保存 · ${savedDraftId}`);
  }
</script>

<svelte:head><title>发起申请 · Flow Desk</title></svelte:head>

<div use:initializeForm class="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
  {#if toastMessage}
    <div class="fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl" role="status">
      <span class="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[11px]">✓</span>{toastMessage}
    </div>
  {/if}

  <a href="/" class="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-signal">← 返回申请总览</a>

  {#if !definition}
    <header class="mt-7">
      <p class="text-xs font-bold uppercase tracking-[0.22em] text-signal">New workflow / 02</p>
      <h1 class="mt-2 text-3xl font-black tracking-[-0.04em]">选择申请流程<span class="text-signal">.</span></h1>
      <p class="mt-2 text-sm text-slate-500">不同类型会自动匹配表单字段和审批节点。</p>
    </header>
    {#if restorableAutosave}
      {@const savedDefinition = getProcessDefinition(restorableAutosave.processKey ?? '')}
      {#if savedDefinition}
        <section class="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4" aria-label="未完成申请">
          <div><p class="text-xs font-black text-amber-800">检测到未完成的{savedDefinition.name}</p><p class="mt-1 text-xs text-amber-700/70">需要时可以继续上次填写，也可以直接选择新的流程。</p></div>
          <button type="button" class="rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-800" on:click={restoreAutosave}>继续上次填写</button>
        </section>
      {/if}
    {/if}
    <section class="mt-8 grid gap-4 md:grid-cols-3" aria-label="流程类型">
      {#each processDefinitions as processDefinition}
        <button type="button" class="lift group rounded-2xl border border-line bg-white p-6 text-left shadow-sm transition hover:border-slate-300" on:click={() => selectProcess(processDefinition.key)}>
          <span class={`grid h-12 w-12 place-items-center rounded-2xl text-base font-black ${processDefinition.accentClass}`}>{processDefinition.icon}</span>
          <h2 class="mt-5 text-lg font-black text-ink">{processDefinition.name}</h2>
          <p class="mt-2 min-h-10 text-xs leading-5 text-slate-500">{processDefinition.description}</p>
          <div class="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[11px] font-bold text-slate-400">
            {#each processDefinition.approvalSteps as approvalStep, index}
              <span>{approvalStep.roleName}</span>{#if index < processDefinition.approvalSteps.length - 1}<span>→</span>{/if}
            {/each}
          </div>
        </button>
      {/each}
    </section>
  {:else}
    <div class="mt-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-signal">{currentDraftId ? 'Edit draft' : 'New request'} / 02</p>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-black tracking-[-0.04em]">{currentDraftId ? `编辑${definition.name}草稿` : `发起${definition.name}`}<span class="text-signal">.</span></h1>
          <span class={`rounded-lg px-2.5 py-1 text-xs font-bold ${definition.accentClass}`}>{definition.name}</span>
        </div>
        <p class="mt-2 text-sm text-slate-500">填写内容会自动暂存在当前浏览器，提交前可以完整预览。</p>
      </div>
      <div class="flex items-center gap-4">
        {#if !currentDraftId}<button type="button" class="text-xs font-bold text-slate-400 hover:text-ink" on:click={returnToProcessSelection}>更换流程</button>{/if}
        <div class="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span class={`grid h-7 w-7 place-items-center rounded-full ${step === 1 ? 'bg-signal text-white' : 'bg-ink text-white'}`}>1</span><span class={step === 1 ? 'text-ink' : ''}>填写</span>
          <span class="mx-1 h-px w-8 bg-line"></span>
          <span class={`grid h-7 w-7 place-items-center rounded-full ${step === 2 ? 'bg-signal text-white' : 'bg-slate-200'}`}>2</span><span class={step === 2 ? 'text-ink' : ''}>预览</span>
        </div>
      </div>
    </div>

    {#if step === 1}
      <form class="mt-8 space-y-5" on:submit|preventDefault={preview}>
        <section class="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
          <div class="mb-6 flex items-start justify-between"><div><h2 class="font-extrabold">申请人信息</h2><p class="mt-1 text-xs text-slate-400">确认申请归属的人员与部门</p></div><span class="text-xs font-bold text-slate-300">01</span></div>
          <div class="grid gap-5 sm:grid-cols-2">
            {#each definition.fields.slice(0, 2) as field}<WorkflowField {field} value={form[field.key]} error={errors[field.key]} onChange={updateField} />{/each}
          </div>
        </section>
        <section class="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
          <div class="mb-6 flex items-start justify-between"><div><h2 class="font-extrabold">{definition.name.replace('申请', '')}信息</h2><p class="mt-1 text-xs text-slate-400">填写后将按预设节点进入审批</p></div><span class="text-xs font-bold text-slate-300">02</span></div>
          <div class="grid gap-5 sm:grid-cols-2">
            {#each definition.fields.slice(2) as field}<WorkflowField {field} value={form[field.key]} error={errors[field.key]} onChange={updateField} />{/each}
          </div>
          {#if metricValue !== undefined && metricValue !== ''}
            <div class="mt-5 flex items-center justify-between rounded-xl bg-[#f5f8fc] px-4 py-3"><span class="text-xs font-semibold text-slate-500">{definition.list.metricLabel}</span><span class="text-lg font-black text-ink">{metricValue}<small class="ml-1 text-xs font-bold text-slate-400">{definition.list.metricUnit}</small></span></div>
          {/if}
        </section>
        <section class="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
          <div class="flex flex-wrap items-center gap-3"><span class="text-xs font-bold text-slate-400">审批流程</span>{#each definition.approvalSteps as approvalStep, index}<span class="rounded-lg bg-mist px-3 py-2 text-xs font-bold text-slate-600">{approvalStep.name} · {approvalStep.assignee}</span>{#if index < definition.approvalSteps.length - 1}<span class="text-slate-300">→</span>{/if}{/each}</div>
        </section>
        <div class="flex flex-wrap items-center justify-end gap-3 pb-4"><span class="mr-auto text-xs text-slate-400">内容已开启自动暂存</span><button type="button" class="rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-slate-600" on:click={returnToProcessSelection}>取消</button><button type="button" class="rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink" on:click={saveDraft}>保存草稿</button><button type="submit" class="rounded-xl bg-signal px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/10">预览申请 →</button></div>
      </form>
    {:else}
      <section class="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div class="bg-ink px-6 py-6 text-white sm:px-8"><p class="text-xs font-bold uppercase tracking-[0.2em] text-[#eaa6a7]">Review request</p><h2 class="mt-2 text-2xl font-black">请确认{definition.name}信息</h2><p class="mt-2 text-sm text-slate-300">确认无误后提交，申请将进入 {definition.approvalSteps.length} 个审批节点。</p></div>
        <div class="grid gap-x-8 gap-y-6 px-6 py-7 sm:grid-cols-2 sm:px-8">
          {#each definition.fields as field}<div class:sm:col-span-2={field.fullWidth}><p class="text-xs text-slate-400">{field.label}</p><p class="mt-2 text-sm font-bold leading-6">{getFieldDisplayValue(field, preparedForm[field.key])}</p></div>{/each}
          {#if definition.list.metricField && !definition.fields.some((field) => field.key === definition?.list.metricField)}<div><p class="text-xs text-slate-400">{definition.list.metricLabel}</p><p class="mt-2 text-lg font-black text-signal">{metricValue} {definition.list.metricUnit}</p></div>{/if}
        </div>
        <div class="flex flex-wrap justify-end gap-3 bg-[#fafbfd] px-6 py-5 sm:px-8"><button class="rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-slate-600" on:click={() => (step = 1)}>← 返回修改</button><button class="rounded-xl bg-signal px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/10" on:click={submit}>确认并提交</button></div>
      </section>
    {/if}
  {/if}
</div>
