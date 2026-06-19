import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'coverage/', 'reports/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { sourceType: 'module' },
    },
  },
  {
    // Граница чистой архитектуры: доменный слой не зависит от фреймворков и внешних слоёв.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@nestjs/*',
                '@prisma/client',
                'fastify',
                'nestjs-*',
                'pino',
                'pino-*',
                'prom-client',
              ],
              message: 'Доменный слой должен оставаться независимым от фреймворков и инфраструктуры.',
            },
            {
              group: ['**/application/**', '**/infrastructure/**', '**/interfaces/**'],
              message: 'Доменный слой не должен зависеть от внешних слоёв.',
            },
          ],
        },
      ],
    },
  },
);
