<script lang="ts">
  import { page } from '$app/stores';
  import { applications, updateApplicationStatus } from '$lib/stores/applications';
  import type { ApprovalStep, WorkflowApplication } from '$lib/types';
  import { getProcessDefinition } from '$lib/workflow/definitions';
  import { getFieldDisplayValue } from '$lib/workflow/forms';
  import { statusMeta } from '$lib/workflow/metadata';

  $: application = $applications.find((item) => item.id === $page.params.id);
  $: definition = application ? getProcessDefinition(application.processKey) : undefined;
  $: activeStep = application?.status === 'pending' && definition
    ? definition.approvalSteps[application.currentStep]
    : undefined;
  $: nextStep = application?.status === 'pending' && definition
    ? definition.approvalSteps[application.currentStep + 1]
    : undefined;

  function isStepCompleted(applicationItem: WorkflowApplication, approvalStep: ApprovalStep) {
    return applicationItem.status === 'approved'
      || applicationItem.history.some((record) => record.stepKey === approvalStep.key && record.action === '审批通过');
  }

  function stepClass(applicationItem: WorkflowApplication, approvalStep: ApprovalStep, index: number) {
    if (isStepCompleted(applicationItem, approvalStep)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (applicationItem.status === 'pending' && applicationItem.currentStep === index) return 'border-amber-200 bg-amber-50 text-amber-700';
    if (applicationItem.status === 'rejected' && applicationItem.currentStep === index) return 'border-rose-200 bg-rose-50 text-rose-700';
    return 'border-line bg-mist text-slate-400';
  }

  function stepLabel(applicationItem: WorkflowApplication, approvalStep: ApprovalStep, index: number) {
    if (isStepCompleted(applicationItem, approvalStep)) return '已通过';
    if (applicationItem.status === 'pending' && applicationItem.currentStep === index) return '处理中';
    if (applicationItem.status === 'rejected' && applicationItem.currentStep === index) return '已驳回';
    return '未开始';
  }
</script>

<svelte:head><title>{application ? `${application.id} · Flow Desk` : '申请不存在 · Flow Desk'}</title></svelte:head>

<div class="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-10">
  <a href="/" class="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-signal">← 返回申请总览</a>
  {#if application && definition}
    <header class="mt-7 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-signal">Request detail / 03</p>
        <div class="mt-2 flex flex-wrap items-center gap-3"><h1 class="text-3xl font-black tracking-[-0.04em]">{application.id}</h1><span class={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${definition.accentClass}`}>{definition.name}</span><span class={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusMeta[application.status].className}`}>{statusMeta[application.status].label}</span></div>
        <p class="mt-2 text-sm text-slate-500">创建于 {new Date(application.createdAt).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })} · 更新于 {new Date(application.updatedAt).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
      {#if application.status === 'draft'}
        <div class="flex gap-2"><a href={`/applications/new?draft=${application.id}`} class="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-ink transition hover:border-slate-300">继续编辑</a><button class="rounded-xl bg-signal px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#b9151b]" on:click={() => updateApplicationStatus(application.id, 'submit')}>提交申请</button></div>
      {:else if application.status === 'pending' && activeStep}
        <div class="flex flex-col items-end gap-2"><p class="text-xs text-slate-400">当前由 <strong class="text-ink">{activeStep.assignee} · {activeStep.roleName}</strong> 处理</p><div class="flex flex-wrap gap-2"><button class="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50" on:click={() => updateApplicationStatus(application.id, 'withdraw')}>撤回</button><button class="rounded-xl border border-rose-100 bg-white px-4 py-2.5 text-xs font-bold text-signal transition hover:bg-rose-50" on:click={() => updateApplicationStatus(application.id, 'reject')}>驳回</button><button class="rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a3659]" on:click={() => updateApplicationStatus(application.id, 'approve')}>通过当前节点</button></div></div>
      {/if}
    </header>

    <section class="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="font-extrabold">审批进度</h2><p class="mt-1 text-xs text-slate-400">当前节点、处理角色与后续流向</p></div>{#if activeStep}<div class="text-right text-xs"><p class="font-bold text-amber-700">当前：{activeStep.name}</p><p class="mt-1 text-slate-400">{nextStep ? `下一处理人：${nextStep.assignee}` : '通过后流程完成'}</p></div>{/if}</div>
      <div class="mt-5 grid gap-3" style={`grid-template-columns: repeat(${definition.approvalSteps.length}, minmax(0, 1fr));`}>
        {#each definition.approvalSteps as approvalStep, index}
          <div class={`relative rounded-xl border px-4 py-4 ${stepClass(application, approvalStep, index)}`}>
            <div class="flex items-center justify-between gap-2"><span class="grid h-6 w-6 place-items-center rounded-full bg-white/80 text-[10px] font-black">0{index + 1}</span><span class="text-[10px] font-bold">{stepLabel(application, approvalStep, index)}</span></div>
            <p class="mt-3 text-xs font-black">{approvalStep.name}</p><p class="mt-1 text-[11px] opacity-75">{approvalStep.assignee} · {approvalStep.roleName}</p>
          </div>
        {/each}
      </div>
    </section>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section class="rounded-2xl border border-line bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-line px-6 py-5"><h2 class="font-extrabold">{definition.name.replace('申请', '')}信息</h2><span class={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${definition.accentClass}`}>{definition.name}</span></div>
        <div class="grid gap-x-8 gap-y-6 px-6 py-6 sm:grid-cols-2">
          {#each definition.fields as field}
            <div class:sm:col-span-2={field.fullWidth}><p class="text-xs text-slate-400">{field.label}</p><p class={`mt-2 text-sm font-bold leading-7 ${application.formData[field.key] ? 'text-ink' : 'text-slate-400'}`}>{getFieldDisplayValue(field, application.formData[field.key])}</p></div>
          {/each}
          {#if definition.list.metricField && !definition.fields.some((field) => field.key === definition?.list.metricField)}
            <div><p class="text-xs text-slate-400">{definition.list.metricLabel}</p><p class="mt-2 text-xl font-black text-signal">{application.formData[definition.list.metricField]}<span class="ml-1 text-xs text-slate-400">{definition.list.metricUnit}</span></p></div>
          {/if}
        </div>
      </section>

      <section class="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between"><h2 class="font-extrabold">完整流程记录</h2><span class="text-xs font-bold text-slate-300">{application.history.length} 条</span></div>
        <div class="relative mt-6 space-y-6 before:absolute before:bottom-1 before:left-[5px] before:top-1 before:w-px before:bg-line">
          {#each application.history as record, index}<div class="relative pl-6"><span class={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white ring-1 ${index === application.history.length - 1 ? 'bg-signal ring-signal/30' : 'bg-slate-300 ring-slate-200'}`}></span><p class="text-xs font-bold text-ink">{record.action}</p>{#if record.stepName}<p class="mt-1 text-[11px] font-semibold text-slate-500">{record.stepName}</p>{/if}<p class="mt-1 text-xs text-slate-500">{record.actor}</p><p class="mt-1 text-[11px] text-slate-400">{new Date(record.time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>{#if record.note}<p class="mt-2 rounded-lg bg-mist px-3 py-2 text-xs leading-5 text-slate-600">{record.note}</p>{/if}</div>{/each}
          {#if !application.history.length}<p class="pl-6 text-xs text-slate-400">暂未提交，暂无流程记录</p>{/if}
        </div>
      </section>
    </div>
  {:else}
    <div class="mt-20 rounded-2xl border border-line bg-white p-12 text-center shadow-sm"><p class="text-4xl">⌁</p><h1 class="mt-4 text-xl font-black">申请不存在</h1><p class="mt-2 text-sm text-slate-500">这条申请可能已被移除，或者链接已失效。</p><a href="/" class="mt-6 inline-flex rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white">返回申请总览</a></div>
  {/if}
</div>
