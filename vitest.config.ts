import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    passWithNoTests: true,
  },
});
