import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 60000, // 60 seconds for slow Ollama calls
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/app/(auth)/**',
        'src/app/blog/**',
        'src/app/terms/**',
        'src/app/privacy/**',
        'src/app/about/**',
        'src/app/sitemap.ts',
        'src/app/robots.ts',
        'src/lib/db/schema/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
