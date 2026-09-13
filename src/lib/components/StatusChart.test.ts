import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

const chartMocks = vi.hoisted(() => {
  const chart = {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn()
  };

  return {
    chart,
    init: vi.fn(() => chart)
  };
});

vi.mock('echarts/dist/echarts.esm.min', () => ({
  init: chartMocks.init
}));

import StatusChart from './StatusChart.svelte';

describe('status chart', () => {
  it('renders an accessible chart and initializes ECharts', () => {
    render(StatusChart, { props: { values: [1, 2, 3, 4] } });

    expect(screen.getByRole('img', { name: '申请状态分布图' })).toBeInTheDocument();
    expect(chartMocks.init).toHaveBeenCalledTimes(1);
    expect(chartMocks.chart.setOption).toHaveBeenCalledWith(expect.objectContaining({
      series: expect.any(Array)
    }));
  });

  it('updates chart data when values change and disposes on unmount', async () => {
    const view = render(StatusChart, { props: { values: [1, 0, 0, 0] } });
    chartMocks.chart.setOption.mockClear();

    await view.rerender({ values: [0, 1, 2, 0] });
    expect(chartMocks.chart.setOption).toHaveBeenCalledWith({
      series: [{ data: expect.any(Array) }]
    });

    view.unmount();
    expect(chartMocks.chart.dispose).toHaveBeenCalledTimes(1);
  });
});
