<script lang="ts">
  import * as echarts from 'echarts/dist/echarts.esm.min';
  import type { EChartsOption } from 'echarts';

  export let values: number[] = [];
  export let compact = false;
  let errorMessage = '';

  function chartData(source: number[]) {
    return [
      { value: source[0] || 0, name: '草稿', itemStyle: { color: '#b9c5d2' } },
      { value: source[1] || 0, name: '待审批', itemStyle: { color: '#e4a11b' } },
      { value: source[2] || 0, name: '已通过', itemStyle: { color: '#2fa87a' } },
      { value: source[3] || 0, name: '已驳回', itemStyle: { color: '#d71920' } }
    ];
  }

  function mountChart(element: HTMLDivElement, initialValues: number[]) {
    try {
      const chart = echarts.init(element, undefined, { renderer: 'canvas' });

      const option: EChartsOption = {
        animationDuration: 500,
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'pie',
            radius: ['62%', '82%'],
            center: ['50%', '48%'],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: '#ffffff', borderWidth: 4, borderRadius: 8 },
            label: { show: false },
            data: chartData(initialValues)
          }
        ]
      };

      chart.setOption(option);
      const observer = new ResizeObserver(() => chart.resize());
      observer.observe(element);

      return {
        update(nextValues: number[]) {
          chart.setOption({ series: [{ data: chartData(nextValues) }] });
        },
        destroy() {
          observer.disconnect();
          chart.dispose();
        }
      };
    } catch (error) {
      errorMessage = '图表加载失败，请刷新页面重试';
      console.error('Failed to initialize status chart', error);
      return {};
    }
  }
</script>

<div class:compact class={`relative w-full ${compact ? 'h-20 sm:h-52' : 'h-52'}`}>
  <div use:mountChart={values} class="h-full w-full" aria-label="申请状态分布图" role="img"></div>
  {#if errorMessage}
    <div class="absolute inset-0 grid place-items-center rounded-xl bg-mist px-5 text-center text-xs font-semibold text-slate-500">
      {errorMessage}
    </div>
  {/if}
</div>
