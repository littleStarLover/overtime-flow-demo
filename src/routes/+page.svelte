<script lang="ts">
  import StatusChart from '$lib/components/StatusChart.svelte';
  import { applications } from '$lib/stores/applications';
  import type { OvertimeStatus } from '$lib/types';
  import { formatDate } from '$lib/utils/overtime';
  import { getProcessDefinition, processDefinitions } from '$lib/workflow/definitions';
  import { getApplicationDate, getApplicationMetric, getApplicationSummary } from '$lib/workflow/forms';
  import { statusMeta } from '$lib/workflow/metadata';

  let search = '';
  let statusFilter: 'all' | OvertimeStatus = 'all';
  let processFilter = 'all';

  $: stats = {
    total: $applications.length,
    draft: $applications.filter((item) => item.status === 'draft').length,
    pending: $applications.filter((item) => item.status === 'pending').length,
    approved: $applications.filter((item) => item.status === 'approved').length,
    processCount: processDefinitions.length
  };

  $: filteredApplications = $applications.filter((item) => {
    const definition = getProcessDefinition(item.processKey);
    const keyword = search.trim().toLowerCase();
    const searchableText = `${item.id}${definition?.name ?? ''}${Object.values(item.formData).join('')}`.toLowerCase();
    const matchesSearch = !keyword || searchableText.includes(keyword);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesProcess = processFilter === 'all' || item.processKey === processFilter;
    return matchesSearch && matchesStatus && matchesProcess;
  });

  $: chartValues = [
    $applications.filter((item) => item.status === 'draft').length,
    $applications.filter((item) => item.status === 'pending').length,
    $applications.filter((item) => item.status === 'approved').length,
    $applications.filter((item) => item.status === 'rejected').length
  ];

  function showAll() {
    search = '';
    statusFilter = 'all';
    processFilter = 'all';
  }
</script>

<svelte:head><title>申请总览 · Flow Desk</title></svelte:head>

<div class="dashboard-page mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col overflow-hidden px-5 py-4 sm:px-8 sm:py-8 lg:px-10">
  <header class="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-4 sm:mb-7">
    <div><p class="text-xs font-bold uppercase tracking-[0.22em] text-signal">Monday · 13 September 2026</p><h1 class="mt-1 text-2xl font-black tracking-[-0.04em] text-ink sm:mt-2 sm:text-4xl">申请总览<span class="text-signal">.</span></h1><p class="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">三类常用申请，共用一套清晰可追踪的审批流程。</p></div>
    <a href="/applications/new" class="lift inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/10 transition hover:bg-[#b9151b]"><span class="text-lg leading-none">＋</span> 发起流程申请</a>
  </header>

  <section class="dashboard-hero mesh relative hidden shrink-0 overflow-hidden rounded-[24px] bg-ink px-4 py-5 text-white shadow-soft sm:px-9 sm:py-8 lg:block">
    <div class="relative z-10 max-w-xl"><p class="text-xs font-bold uppercase tracking-[0.2em] text-[#eaa6a7]">Workflow center / 01</p><h2 class="mt-2 text-xl font-extrabold leading-tight tracking-[-0.03em] sm:mt-3 sm:text-3xl">一套工作台，<br />承接每一种日常申请。</h2><p class="mt-3 max-w-md text-xs leading-5 text-slate-300 sm:mt-4 sm:text-sm sm:leading-6">选择流程、填写信息并跟踪节点；加班、请假与报销使用统一体验。</p></div>
    <div class="absolute -right-10 -top-16 hidden h-64 w-64 rounded-full border-[34px] border-white/5 sm:block"></div>
    <div class="relative z-10 mt-5 flex max-w-3xl items-center gap-0 sm:mt-10">
      {#each ['选择流程', '填写申请', '节点审批'] as step, index}<div class="flex items-center {index < 2 ? 'flex-1' : ''}"><div class="flex shrink-0 items-center gap-2"><span class="grid h-8 w-8 place-items-center rounded-full {index === 0 ? 'bg-signal text-white' : 'bg-white/10 text-slate-300'} text-xs font-bold">0{index + 1}</span><span class="hidden text-xs font-semibold text-slate-300 sm:block">{step}</span></div>{#if index < 2}<span class="mx-3 h-px flex-1 bg-white/15"></span>{/if}</div>{/each}
    </div>
  </section>

  <section class="dashboard-stats mt-4 grid shrink-0 grid-cols-2 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-5">
    <button type="button" class="lift rounded-2xl border border-line bg-white p-3 text-left shadow-sm sm:p-5" on:click={showAll}><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">全部申请</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] sm:mt-3 sm:text-3xl">{stats.total}</p><p class="mt-1 hidden text-[11px] text-slate-400 sm:mt-2 sm:block sm:text-xs">点击清空全部筛选</p></button>
    <button type="button" class="lift rounded-2xl border border-line bg-white p-3 text-left shadow-sm sm:p-5" on:click={() => (statusFilter = 'draft')}><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">草稿箱</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-600 sm:mt-3 sm:text-3xl">{stats.draft}</p><p class="mt-1 hidden text-[11px] font-semibold text-signal sm:mt-2 sm:block sm:text-xs">查看并继续编辑 →</p></button>
    <div class="lift rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-5"><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">待审批</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] text-amber-600 sm:mt-3 sm:text-3xl">{stats.pending}</p><p class="mt-1 hidden text-[11px] text-slate-400 sm:mt-2 sm:block sm:text-xs">当前流转中的申请</p></div>
    <div class="lift rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-5"><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">已通过</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] text-emerald-600 sm:mt-3 sm:text-3xl">{stats.approved}</p><p class="mt-1 hidden text-[11px] text-slate-400 sm:mt-2 sm:block sm:text-xs">全部流程累计</p></div>
    <div class="lift rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-5"><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">流程类型</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] sm:mt-3 sm:text-3xl">{stats.processCount}<span class="ml-1 text-sm font-bold text-slate-400 sm:text-base">种</span></p><p class="mt-1 hidden text-[11px] text-slate-400 sm:mt-2 sm:block sm:text-xs">加班 · 请假 · 报销</p></div>
  </section>

  <section class="dashboard-workspace mt-4 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_184px] gap-4 overflow-hidden sm:mt-6 sm:grid-rows-[minmax(0,1fr)_220px] sm:gap-6 xl:grid-cols-[minmax(0,1fr)_330px] xl:grid-rows-1">
    <div class="flex min-h-0 min-w-0 flex-col rounded-2xl border border-line bg-white shadow-sm">
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
        <div><h2 class="font-extrabold tracking-tight">最近申请</h2><p class="mt-1 text-xs text-slate-400">共 {filteredApplications.length} 条记录</p></div>
        <div class="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          <button type="button" class={`h-9 rounded-lg border px-3 text-xs font-bold transition ${statusFilter === 'draft' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate-600 hover:border-slate-300'}`} on:click={() => (statusFilter = statusFilter === 'draft' ? 'all' : 'draft')}>草稿箱 · {stats.draft}</button>
          <label class="relative flex-1 sm:w-44"><span class="sr-only">搜索申请</span><span class="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span><input bind:value={search} class="h-9 w-full rounded-lg border border-line bg-mist pl-8 pr-3 text-xs outline-none transition focus:border-signal" placeholder="搜索申请人或内容" /></label>
          <label><span class="sr-only">流程类型</span><select bind:value={processFilter} class="h-9 rounded-lg border border-line bg-mist px-2 text-xs font-semibold text-slate-600 outline-none focus:border-signal"><option value="all">全部流程</option>{#each processDefinitions as definition}<option value={definition.key}>{definition.name}</option>{/each}</select></label>
          <label><span class="sr-only">申请状态</span><select bind:value={statusFilter} class="h-9 rounded-lg border border-line bg-mist px-2 text-xs font-semibold text-slate-600 outline-none focus:border-signal"><option value="all">全部状态</option><option value="pending">待审批</option><option value="approved">已通过</option><option value="rejected">已驳回</option><option value="draft">草稿</option></select></label>
        </div>
      </div>
      <div class="scrollbar-thin min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="sticky top-0 z-10 bg-[#fafbfd] text-[11px] uppercase tracking-wider text-slate-400"><tr><th class="px-6 py-3 font-bold">申请信息</th><th class="px-4 py-3 font-bold">申请日期</th><th class="px-4 py-3 font-bold">当前节点</th><th class="px-4 py-3 font-bold">状态</th><th class="px-6 py-3 text-right font-bold">操作</th></tr></thead>
          <tbody class="divide-y divide-line">
            {#each filteredApplications as item}
              {@const definition = getProcessDefinition(item.processKey)}
              {#if definition}
                <tr class="transition hover:bg-mist/70">
                  <td class="px-6 py-4"><div class="flex items-center gap-3"><span class={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${definition.accentClass}`}>{String(item.formData.applicant ?? '?').slice(0, 1)}</span><div><div class="flex items-center gap-2"><p class="font-bold text-ink">{item.formData.applicant}</p><span class={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${definition.accentClass}`}>{definition.name}</span></div><p class="mt-0.5 max-w-[250px] truncate text-xs text-slate-400">{item.formData.department} · {getApplicationSummary(item, definition)}</p><p class="mt-1 font-mono text-[10px] text-slate-300">{item.id} · {getApplicationMetric(item, definition)}</p></div></div></td>
                  <td class="px-4 py-4 text-xs font-semibold text-slate-600">{formatDate(getApplicationDate(item, definition))}</td>
                  <td class="px-4 py-4 text-xs font-semibold text-slate-600">{item.status === 'pending' ? definition.approvalSteps[item.currentStep]?.name ?? '流程完成' : '—'}</td>
                  <td class="px-4 py-4"><span class={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta[item.status].className}`}>{statusMeta[item.status].label}</span></td>
                  <td class="px-6 py-4 text-right"><div class="flex items-center justify-end gap-3"><a class="text-xs font-bold text-slate-400 hover:text-ink" href={`/applications/${item.id}`}>详情</a>{#if item.status === 'draft'}<a class="text-xs font-bold text-signal hover:underline" href={`/applications/new?draft=${item.id}`}>继续编辑 →</a>{/if}</div></td>
                </tr>
              {/if}
            {:else}<tr><td colspan="5" class="px-6 py-14 text-center text-sm text-slate-400">没有找到匹配的申请</td></tr>{/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="dashboard-chart min-h-0 overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6"><div class="flex shrink-0 items-start justify-between"><div><h2 class="font-extrabold tracking-tight">状态分布</h2><p class="mt-1 text-xs text-slate-400">三类申请的当前状态</p></div><span class="grid h-8 w-8 place-items-center rounded-lg bg-[#fff1f1] text-signal">◔</span></div><StatusChart values={chartValues} compact /><div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">{#each [['草稿','b9c5d2', chartValues[0]], ['待审批','e4a11b', chartValues[1]], ['已通过','2fa87a', chartValues[2]], ['已驳回','d71920', chartValues[3]]] as row}<div class="flex items-center gap-2"><span class="h-2 w-2 shrink-0 rounded-full" style={`background:#${row[1]}`}></span><span class="text-slate-500">{row[0]}</span><strong class="ml-auto text-ink">{row[2]}</strong></div>{/each}</div></div>
  </section>
</div>
