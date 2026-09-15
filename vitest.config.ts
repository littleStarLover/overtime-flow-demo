import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
    slowTestThreshold: 300,
    reporters: [
      'default',
      ['html', { outputDir: './reports/vitest' }],
      'json'
    ],
    outputFile: {
      json: './reports/vitest/results.json'
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './reports/coverage',
      reporter: ['text-summary', 'html', 'json-summary'],
      reportOnFailure: true,
      include: ['src/**/*.{ts,svelte}'],
      exclude: ['src/**/*.test.ts', 'src/test/**', 'src/app.d.ts']
    }
  }
});
