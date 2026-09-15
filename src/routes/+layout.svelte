<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';

  $: currentPath = $page.url.pathname;
</script>

<svelte:head>
  <title>Flow Desk · 流程申请</title>
  <meta
    name="description"
    content="一个轻量、清晰的通用申请与审批工作台。"
  />
</svelte:head>

<div class="app-shell flex h-dvh flex-col overflow-hidden bg-mist text-ink lg:flex-row">
  <aside class="flex w-full shrink-0 flex-col bg-ink px-5 py-5 text-white lg:h-full lg:w-[248px] lg:px-6 lg:py-7">
    <a href="/" class="flex items-center gap-3" aria-label="返回申请工作台">
      <span class="grid h-10 w-10 place-items-center rounded-xl bg-signal text-lg font-black tracking-tight">F</span>
      <span>
        <span class="block text-[15px] font-bold tracking-wide">Flow Desk</span>
        <span class="mt-0.5 block text-[10px] uppercase tracking-[0.22em] text-slate-400">申请工作台</span>
      </span>
    </a>

    <nav class="mt-8 flex gap-2 overflow-x-auto lg:block lg:space-y-2" aria-label="主导航">
      <a
        href="/"
        class:active={currentPath === '/'}
        class="flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
      >
        <span class="text-base">⌂</span><span>申请总览</span>
      </a>
      <a
        href="/applications/new"
        class:active={currentPath.startsWith('/applications/new')}
        class="flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
      >
        <span class="text-base">＋</span><span>发起流程申请</span>
      </a>
    </nav>

    <div class="mt-auto hidden rounded-2xl border border-white/10 bg-white/5 p-4 lg:block">
      <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400">当前登录</p>
      <div class="mt-3 flex items-center gap-3">
        <span class="grid h-9 w-9 place-items-center rounded-full bg-[#efd7cf] text-sm font-bold text-[#70362c]">陈</span>
        <div>
          <p class="text-sm font-semibold">陈经理</p>
          <p class="text-xs text-slate-400">数字化产品部</p>
        </div>
      </div>
    </div>
  </aside>

  <main
    class:min-h-0={currentPath === '/'}
    class:overflow-hidden={currentPath === '/'}
    class:overflow-y-auto={currentPath !== '/'}
    class="app-main min-w-0 flex-1"
  >
    <slot />
  </main>
</div>
