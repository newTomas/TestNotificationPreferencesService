import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: [...configDefaults.exclude, '**/*.e2e.spec.ts'],
    passWithNoTests: true,
  },
});
