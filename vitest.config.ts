import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));


export default defineConfig({
  root: __dirname,
  test: {
    name: 'tinyland-color-utils',
    root: __dirname,
    include: ['tests/**/*.test.ts'],
    globals: true,
    pool: 'threads',
    deps: {
      interopDefault: true,
    },
    server: {
      deps: {
        inline: ['@fast-check/vitest'],
      },
    },
  },
});
