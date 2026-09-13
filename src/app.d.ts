declare module 'echarts/dist/echarts.esm.min' {
  import type { ECharts } from 'echarts';

  export function init(
    element: HTMLElement,
    theme?: string | object | null,
    options?: { renderer?: 'canvas' | 'svg' }
  ): ECharts;
}
