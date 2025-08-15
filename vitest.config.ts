import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/_test/setup/vitest.setup.ts'],
    include: [
      'src/_test/unit/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/_test/integration/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'src/_test/e2e/',
      'src/_test/fixtures/',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/_test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/dist/',
        'src/types.ts',
        'src/constants.tsx',
        'vite.config.ts',
        'tailwind.config.js',
        'postcss.config.cjs',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
