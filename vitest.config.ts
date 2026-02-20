import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'tinyland-color-utils',
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
});
