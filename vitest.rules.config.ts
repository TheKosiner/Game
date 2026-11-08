import { defineConfig } from 'vitest/config';

// Firestore security-rules tests. They need the Firestore emulator running
// (FIRESTORE_EMULATOR_HOST, default 127.0.0.1:8080), so they are kept out of
// the default `npm test` run. Use `npm run test:rules`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
