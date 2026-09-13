<script lang="ts">
  import { applications } from '$lib/stores/applications';
  import { statusMeta, formatDate } from '$lib/utils/overtime';
  import StatusChart from '$lib/components/StatusChart.svelte';
  import type { OvertimeStatus } from '$lib/types';

  let search = '';
  let statusFilter: 'all' | OvertimeStatus = 'all';

  $: stats = {
    total: $applications.length,
    draft: $applications.filter((item) => item.status === 'draft').length,
    pending: $applications.filter((item) => item.status === 'pending').length,
    approved: $applications.filter((item) => item.status === 'approved').length,
    hours: $applications.reduce((total, item) => total + item.hours, 0)
  };

  $: filteredApplications = $applications.filter((item) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch = !keyword || `${item.applicant}${item.department}${item.reason}`.toLowerCase().includes(keyword);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  $: chartValues = [
    $applications.filter((item) => item.status === 'draft').length,
    $applications.filter((item) => item.status === 'pending').length,
    $applications.filter((item) => item.status === 'approved').length,
    $applications.filter((item) => item.status === 'rejected').length
  ];
</script>

<svelte:head><title>申请总览 · Overtime Desk</title></svelte:head>

<div class="dashboard-page mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col overflow-hidden px-5 py-4 sm:px-8 sm:py-8 lg:px-10">
  <header class="mb-4 shrink-0 flex flex-wrap items-end justify-between gap-4 sm:mb-7">
    <div>
      <p class="text-xs font-bold uppercase tracking-[0.22em] text-signal">Monday · 13 September 2026</p>
      <h1 class="mt-1 text-2xl font-black tracking-[-0.04em] text-ink sm:mt-2 sm:text-4xl">申请总览<span class="text-signal">.</span></h1>
      <p class="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">把每一次额外投入，记录成清晰可追踪的流程。</p>
    </div>
    <a href="/applications/new" class="lift inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/10 transition hover:bg-[#b9151b]">
      <span class="text-lg leading-none">＋</span> 发起加班申请
    </a>
  </header>

  <section class="dashboard-hero mesh relative hidden shrink-0 overflow-hidden rounded-[24px] bg-ink px-4 py-5 text-white shadow-soft sm:px-9 sm:py-8 lg:block">
    <div class="relative z-10 max-w-xl">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#eaa6a7]">Overtime flow / 01</p>
      <h2 class="mt-2 text-xl font-extrabold leading-tight tracking-[-0.03em] sm:mt-3 sm:text-3xl">从申请到审批，<br />每一步都在掌握之中。</h2>
      <p class="mt-3 max-w-md text-xs leading-5 text-slate-300 sm:mt-4 sm:text-sm sm:leading-6">今天的加班安排也值得被认真记录。提交申请，系统会自动计算时长并同步审批进度。</p>
    </div>
    <div class="absolute -right-10 -top-16 hidden h-64 w-64 rounded-full border-[34px] border-white/5 sm:block"></div>
    <div class="relative z-10 mt-5 flex max-w-2xl items-center gap-0 sm:mt-10">
      {#each ['填写申请', '预览确认', '等待审批'] as step, index}
        <div class="flex items-center {index < 2 ? 'flex-1' : ''}">
          <div class="flex shrink-0 items-center gap-2">
            <span class="grid h-8 w-8 place-items-center rounded-full {index === 0 ? 'bg-signal text-white' : 'bg-white/10 text-slate-300'} text-xs font-bold">0{index + 1}</span>
            <span class="hidden text-xs font-semibold text-slate-300 sm:block">{step}</span>
          </div>
          {#if index < 2}<span class="mx-3 h-px flex-1 bg-white/15"></span>{/if}
        </div>
      {/each}
    </div>
  </section>

    <section class="dashboard-stats mt-4 shrink-0 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-5">
    <button type="button" class="lift rounded-2xl border border-line bg-white p-3 text-left shadow-sm sm:p-5" on:click={() => { statusFilter = 'all'; search = ''; }}><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">全部申请</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] sm:mt-3 sm:text-3xl">{stats.total}</p><p class="mt-1 hidden text-[11px] text-slate-400 sm:mt-2 sm:block sm:text-xs">当前共记录 · 点击查看全部</p></button>
    <button class="lift rounded-2xl border border-line bg-white p-3 text-left shadow-sm sm:p-5" on:click={() => (statusFilter = 'draft')}><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">草稿箱</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-600 sm:mt-3 sm:text-3xl">{stats.draft}</p><p class="mt-1 hidden text-[11px] font-semibold text-signal sm:mt-2 sm:block sm:text-xs">查看并继续编辑 →</p></button>
    <div class="lift rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-5"><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">待审批</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] text-amber-600 sm:mt-3 sm:text-3xl">{stats.pending}</p><p class="mt-1 hidden text-[11px] text-slate-400 sm:mt-2 sm:block sm:text-xs">需要你的关注</p></div>
    <div class="lift rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-5"><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">已通过</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] text-emerald-600 sm:mt-3 sm:text-3xl">{stats.approved}</p><p class="mt-1 hidden text-[11px] text-slate-400 sm:mt-2 sm:block sm:text-xs">本期累计通过</p></div>
    <div class="lift rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-5"><p class="text-[11px] font-semibold text-slate-500 sm:text-xs">累计时长</p><p class="mt-2 text-2xl font-black tracking-[-0.05em] sm:mt-3 sm:text-3xl">{stats.hours}<span class="ml-1 text-sm font-bold text-slate-400 sm:text-base">小时</span></p><p class="mt-1 hidden text-[11px] text-slate-400 sm:mt-2 sm:block sm:text-xs">所有申请合计</p></div>
  </section>

    <section class="dashboard-workspace mt-4 min-h-0 flex-1 grid grid-rows-[minmax(0,1fr)_184px] gap-4 overflow-hidden sm:mt-6 sm:grid-rows-[minmax(0,1fr)_220px] sm:gap-6 xl:grid-cols-[minmax(0,1fr)_330px] xl:grid-rows-1">
    <div class="min-h-0 min-w-0 flex flex-col rounded-2xl border border-line bg-white shadow-sm">
      <div class="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
        <div><h2 class="font-extrabold tracking-tight">最近申请</h2><p class="mt-1 text-xs text-slate-400">共 {filteredApplications.length} 条记录</p></div>
        <div class="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          <button class={`h-9 rounded-lg border px-3 text-xs font-bold transition ${statusFilter === 'draft' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate-600 hover:border-slate-300'}`} on:click={() => (statusFilter = statusFilter === 'draft' ? 'all' : 'draft')}>草稿箱 · {stats.draft}</button>
          <label class="relative flex-1 sm:w-44"><span class="sr-only">搜索申请</span><span class="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span><input bind:value={search} class="h-9 w-full rounded-lg border border-line bg-mist pl-8 pr-3 text-xs outline-none transition focus:border-signal" placeholder="搜索申请人或原因" /></label>
          <select bind:value={statusFilter} class="h-9 rounded-lg border border-line bg-mist px-2 text-xs font-semibold text-slate-600 outline-none focus:border-signal"><option value="all">全部状态</option><option value="pending">待审批</option><option value="approved">已通过</option><option value="rejected">已驳回</option><option value="draft">草稿</option></select>
        </div>
      </div>
      <div class="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain">
        <table class="w-full min-w-[800px] text-left text-sm">
          <thead class="sticky top-0 z-10 bg-[#fafbfd] text-[11px] uppercase tracking-wider text-slate-400"><tr><th class="px-6 py-3 font-bold">申请信息</th><th class="px-4 py-3 font-bold">日期</th><th class="px-4 py-3 font-bold">时长</th><th class="px-4 py-3 font-bold">状态</th><th class="px-6 py-3 text-right font-bold">操作</th></tr></thead>
          <tbody class="divide-y divide-line">
            {#each filteredApplications as item}
              <tr class="transition hover:bg-mist/70">
                <td class="px-6 py-4"><div class="flex items-center gap-3"><span class="grid h-9 w-9 place-items-center rounded-full bg-[#e7eef7] text-xs font-bold text-ink">{item.applicant.slice(0, 1)}</span><div><p class="font-bold text-ink">{item.applicant}</p><p class="mt-0.5 max-w-[280px] truncate text-xs text-slate-400">{item.department} · {item.reason || '尚未填写加班原因'}</p><p class="mt-1 font-mono text-[10px] text-slate-300">{item.id} · 更新于 {new Date(item.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div></div></td>
                <td class="px-4 py-4 text-xs font-semibold text-slate-600">{formatDate(item.date)}</td>
                <td class="px-4 py-4 text-xs font-bold text-ink">{item.hours} 小时</td>
                <td class="px-4 py-4"><span class={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta[item.status].className}`}>{statusMeta[item.status].label}</span></td>
                <td class="px-6 py-4 text-right"><div class="flex items-center justify-end gap-3"><a class="text-xs font-bold text-slate-400 hover:text-ink" href={`/applications/${item.id}`}>详情</a>{#if item.status === 'draft'}<a class="text-xs font-bold text-signal hover:underline" href={`/applications/new?draft=${item.id}`}>继续编辑 →</a>{/if}</div></td>
              </tr>
            {:else}
              <tr><td colspan="5" class="px-6 py-14 text-center text-sm text-slate-400">没有找到匹配的申请</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="dashboard-chart min-h-0 overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6"><div class="flex shrink-0 items-start justify-between"><div><h2 class="font-extrabold tracking-tight">状态分布</h2><p class="mt-1 text-xs text-slate-400">全部申请的当前状态</p></div><span class="grid h-8 w-8 place-items-center rounded-lg bg-[#fff1f1] text-signal">◔</span></div><StatusChart values={chartValues} compact /><div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">{#each [['草稿','b9c5d2', chartValues[0]], ['待审批','e4a11b', chartValues[1]], ['已通过','2fa87a', chartValues[2]], ['已驳回','d71920', chartValues[3]]] as row}<div class="flex items-center gap-2"><span class="h-2 w-2 shrink-0 rounded-full" style={`background:#${row[1]}`}></span><span class="text-slate-500">{row[0]}</span><strong class="ml-auto text-ink">{row[2]}</strong></div>{/each}</div></div>
  </section>
</div>
