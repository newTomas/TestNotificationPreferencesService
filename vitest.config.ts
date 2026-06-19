import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC компилирует декораторы и emitDecoratorMetadata — нужно для e2e с NestJS DI.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    passWithNoTests: true,
  },
  plugins: [swc.vite()],
});
