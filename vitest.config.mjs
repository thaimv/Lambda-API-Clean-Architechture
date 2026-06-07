import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const testReportsPath = './__test_reports__/unit-test';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    reporters: ['default', 'junit'],
    outputFile: `${testReportsPath}/junit.xml`,
    coverage: {
      include: ['src/*'],
      exclude: [
        'tests/**',
        'src/presenter/graphql/resolvers/*',
        'src/**/*.module.ts',
        'src/presenter/lambdas/*',
        'src/modules/*/dtos/responses/*',
        'src/common/types/*',
        'src/common/decorators/*',
        'src/common/datasources/*/*.datasource.ts',
        'src/common/repos/*/*.repo.ts*',
        'src/modules/*/usecases/*.uc.ts',
        'src/modules/*/repos/*.repo.ts',
        'src/modules/*/dtos/responses/*',
        'src/modules/*/models/*',
        'src/modules/*/module.ts',
        'src/modules/*/consts.ts',
        'src/config/*',
        'src/common/constants/*',
        'src/common/models/*',
      ],
      reporter: ['cobertura', 'text', 'json', 'html'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
      reportsDirectory: `${testReportsPath}/coverage`,
    },
  },
});
