import { config } from 'dotenv';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const testReportsPath = './__test_reports__/e2e';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.e2e-spec.ts'],
    reporters: ['default', 'junit'],
    outputFile: `${testReportsPath}/junit.xml`,
    coverage: {
      include: ['src/*'],
      exclude: [
        'src/**/test/*',
        'src/presenter/graphql/resolvers/*',
        'src/**/*.module.ts',
        'src/presenter/lambdas/app.ts',
        'src/presenter/lambdas/appsync-api.ts',
      ],
      reporter: ['cobertura', 'text', 'json', 'html'],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 80,
        lines: 85,
      },
      reportsDirectory: `${testReportsPath}/coverage`,
    },
    env: {
      ...config({ path: './envs/.env' }).parsed,
    },
  },
});
