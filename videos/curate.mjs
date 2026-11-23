#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCuration } from './lib/curation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function main(args) {
  if (args.includes('--help')) {
    console.log(
      'node videos/curate.mjs [--assignment FILE] [--reviews DIR] [--output FILE] [--require-complete] [--require-current-render]',
    );
    return;
  }
  const opts = {
    assignment: 'build/video-curation-20261027/assignment.json',
    reviews: 'build/video-curation-20261027/shards',
    output: 'videos/reviews/curation.json',
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--require-complete') {
      opts.complete = true;
      continue;
    }
    if (args[i] === '--require-current-render') {
      opts.requireCurrentRender = true;
      continue;
    }
    const key = { '--assignment': 'assignment', '--reviews': 'reviews', '--output': 'output' }[
      args[i]
    ];
    if (!key || !args[i + 1] || args[i + 1].startsWith('--'))
      throw Error(
        'Usage: node videos/curate.mjs [--assignment FILE] [--reviews DIR] [--output FILE] [--require-complete]',
      );
    opts[key] = args[++i];
  }
  const assignment = JSON.parse(await fs.readFile(path.resolve(root, opts.assignment))),
    rubric = JSON.parse(await fs.readFile(path.join(root, 'videos/curation-rubric.json'))),
    reviewFiles = (await fs.readdir(path.resolve(root, opts.reviews)))
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => path.join(opts.reviews, f)),
    result = await buildCuration({
      root,
      assignment,
      rubric,
      reviewFiles,
      requireCurrentRender: opts.requireCurrentRender,
      requireComplete: opts.complete,
    }),
    output = path.resolve(root, opts.output);
  if (opts.complete && (result.summary.pending || result.summary.needsVerification))
    throw Error('Curation remains incomplete: ' + JSON.stringify(result.summary));
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ output: opts.output, ...result.summary }, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main(process.argv.slice(2)).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
