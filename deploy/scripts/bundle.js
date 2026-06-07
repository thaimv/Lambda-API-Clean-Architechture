const esbuild = require('esbuild');
const esBuildPluginTsc = require('esbuild-plugin-tsc');

const entryFileName = process.argv[2];

if (!entryFileName) {
  console.error('Usage: node deploy/scripts/bundle.js <appsync-api|public-rest-api>');
  console.error('  Or run: npm run build (builds both APIs)');
  process.exit(1);
}

esbuild
  .build({
    entryPoints: [`src/presenter/lambdas/${entryFileName}.ts`],
    bundle: true,
    outfile: `build/${entryFileName}/app.js`,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    sourcemap: true,
    minify: true,
    plugins: [
      esBuildPluginTsc({
        force: true,
      }),
    ],
    external: ['@prisma/client', 'prisma', '@valkey/valkey-glide'],
  })
  .then(() => {
    console.log('Esbuild succeeded ' + new Date().toISOString());
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
