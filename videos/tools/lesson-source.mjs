#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { productionSourceManifest, verifyProductionSources } from '../lib/lesson-production.mjs';
import { snapshotLessonSource } from '../lib/lesson-snapshot.mjs';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log(
      'node videos/tools/lesson-source.mjs --lesson ID [--stage] [--snapshot NEW_DIRECTORY]',
    );
    console.log('node videos/tools/lesson-source.mjs --verify-stdin [--root REPOSITORY]');
    console.log(
      'Declares local inputs in videos/films/ID/sources.json: {files, assets, dynamicImports}.',
    );
    console.log(
      'Snapshots copy the selected import closure, declared assets, provenance and pinned Vizmatic runtime.',
    );
    return;
  }
  const values = new Set(['--root', '--lesson', '--tts-script', '--snapshot']);
  const flags = new Set(['--stage', '--verify-stdin']);
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (values.has(flag)) {
      if (!args[index + 1] || args[index + 1].startsWith('--'))
        throw new Error(`${flag} requires a value`);
      index++;
    } else if (!flags.has(flag)) throw new Error(`Unknown option: ${flag}`);
  }
  if (args.includes('--verify-stdin') && args.includes('--lesson'))
    throw new Error('Choose --lesson or --verify-stdin');
  if (!args.includes('--verify-stdin') && !args.includes('--lesson'))
    throw new Error('Use --lesson ID or --verify-stdin');
  const value = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback);
  const root = path.resolve(value('--root', fileURLToPath(new URL('../../', import.meta.url))));
  let manifest;
  if (args.includes('--verify-stdin')) {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    manifest = await verifyProductionSources(root, JSON.parse(input));
  } else {
    manifest = await productionSourceManifest({
      root,
      id: value('--lesson'),
      mode: args.includes('--stage') ? 'stage' : 'canvas',
      ttsScript: value('--tts-script'),
    });
  }
  const destination = value('--snapshot');
  const output = destination
    ? await snapshotLessonSource({ root, destination: path.resolve(destination), manifest })
    : manifest;
  process.stdout.write(JSON.stringify(output) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
