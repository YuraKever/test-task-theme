import { context, build } from 'esbuild';
import { readdirSync } from 'fs';
import { resolve, basename } from 'path';

const isWatch = process.argv.includes('--watch');
const scriptsDir = resolve('src/scripts');

function getEntryPoints() {
  try {
    return readdirSync(scriptsDir)
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
      .map((f) => resolve(scriptsDir, f));
  } catch {
    console.warn('No src/scripts directory found. Create it and add .ts files.');
    return [];
  }
}

const entryPoints = getEntryPoints();

if (entryPoints.length === 0) {
  console.log('No TypeScript entry points found in src/scripts/');
  process.exit(0);
}

const config = {
  entryPoints,
  outdir: 'assets',
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  target: 'es2020',
  format: 'iife',
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await context(config);
  await ctx.watch();
  console.log('Watching for changes in src/scripts/...');
} else {
  await build(config);
}
