#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cloudflareToken,
  cloudflareClient,
  configureVideoBucket,
  DEFAULT_CLOUDFLARE_TIMEOUT_MS,
  MAX_CLOUDFLARE_TIMEOUT_MS,
} from './lib/cloudflare-r2.mjs';
import {
  publicationPlan,
  assertCompletePublication,
  assertCompleteWebManifest,
  uploadAsset,
  verifyPublicAsset,
  webVideoManifest,
  mergeWebVideoManifest,
  sha256,
} from './lib/r2-publication.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function boundedInteger(value, minimum, maximum, option) {
  const number = /^\d+$/.test(String(value)) ? Number(value) : NaN;
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum)
    throw Error(`${option} must be an integer between ${minimum} and ${maximum}`);
  return number;
}

export function parsePublicationOptions(args) {
  const options = {
    config: 'videos/r2.config.json',
    collection: 'videos/collections/complete-curriculum.json',
    concurrency: 4,
    uploadTimeoutMs: DEFAULT_CLOUDFLARE_TIMEOUT_MS,
  };
  for (let i = 0; i < args.length; i += 2) {
    const key = {
      '--config': 'config',
      '--collection': 'collection',
      '--selection': 'selection',
      '--output': 'output',
      '--env-file': 'envFile',
      '--web-manifest': 'webManifest',
      '--merge-existing-manifest': 'mergeExistingManifest',
      '--concurrency': 'concurrency',
      '--upload-timeout-ms': 'uploadTimeoutMs',
    }[args[i]];
    if (!key || !args[i + 1] || args[i + 1].startsWith('--'))
      throw Error(`Invalid publication option: ${args[i]}`);
    options[key] = args[i + 1];
  }
  options.concurrency = boundedInteger(options.concurrency, 1, 8, '--concurrency');
  options.uploadTimeoutMs = boundedInteger(
    options.uploadTimeoutMs,
    1_000,
    MAX_CLOUDFLARE_TIMEOUT_MS,
    '--upload-timeout-ms',
  );
  return options;
}

async function main(args) {
  if (!args.length || args.includes('--help')) {
    console.log(
      'node videos/publish-r2.mjs setup|plan|publish|verify --selection FILE --output DIR [--env-file FILE] [--web-manifest FILE] [--merge-existing-manifest FILE] [--concurrency 1-8] [--upload-timeout-ms 1000-900000]',
    );
    return;
  }
  const mode = args.shift();
  if (!['setup', 'plan', 'publish', 'verify'].includes(mode))
    throw Error(`Unknown command: ${mode}`);
  const options = parsePublicationOptions(args);
  const config = JSON.parse(await fs.readFile(path.resolve(root, options.config), 'utf8'));
  let request;
  if (['setup', 'publish'].includes(mode))
    request = cloudflareClient(
      await cloudflareToken(options.envFile && path.resolve(root, options.envFile)),
    );
  if (mode === 'setup') {
    console.log(JSON.stringify(await configureVideoBucket(request, config), null, 2));
    return;
  }
  if (!options.selection || !options.output) throw Error('--selection and --output are required');
  const output = path.resolve(root, options.output);
  await fs.mkdir(output, { recursive: true });
  const plan = await publicationPlan({
    root,
    domain: config.domain,
    selectionFile: path.resolve(root, options.selection),
    collectionFile: path.resolve(root, options.collection),
  });
  let existingBytes, existing;
  const existingPath =
    options.mergeExistingManifest && path.resolve(root, options.mergeExistingManifest);
  if (existingPath) {
    if (options.webManifest && path.resolve(root, options.webManifest) !== existingPath)
      throw Error('--merge-existing-manifest and --web-manifest must name the same file');
    existingBytes = await fs.readFile(existingPath);
    existing = JSON.parse(existingBytes);
    assertCompleteWebManifest(existing, plan);
    const snapshot = path.join(output, `manifest-base-${sha256(existingBytes)}.json`);
    try {
      await fs.writeFile(snapshot, existingBytes, { flag: 'wx' });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (!(await fs.readFile(snapshot)).equals(existingBytes))
        throw Error('Manifest base snapshot changed');
    }
    plan.mergeBase = {
      path: existingPath,
      sha256: sha256(existingBytes),
      bytes: existingBytes.length,
      snapshot,
    };
  } else if (options.webManifest) assertCompletePublication(plan);
  await fs.writeFile(path.join(output, 'plan.json'), JSON.stringify(plan, null, 2) + '\n');
  if (mode === 'plan') {
    console.log(
      JSON.stringify({
        videos: plan.videos.length,
        assets: plan.videos.flatMap((row) => row.assets).length,
        bytes: plan.videos.flatMap((row) => row.assets).reduce((sum, row) => sum + row.bytes, 0),
      }),
    );
    return;
  }
  const verifiedKeys = new Set(),
    verified = [],
    assets = plan.videos.flatMap((row) => row.assets);
  let next = 0;
  const workers = await Promise.allSettled(
    Array.from({ length: options.concurrency }, async () => {
      while (next < assets.length) {
        const asset = assets[next++];
        const proofFile = path.join(output, `${asset.key.replaceAll('/', '-')}.verified.json`);
        let previous;
        try {
          previous = JSON.parse(await fs.readFile(proofFile, 'utf8'));
        } catch (error) {
          if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
        }
        const uploaded =
          previous?.key === asset.key &&
          previous.sha256 === asset.sha256 &&
          previous.bytes === asset.bytes;
        if (mode === 'publish' && !uploaded)
          await uploadAsset(request, config, asset, { timeoutMs: options.uploadTimeoutMs });
        const proof = await verifyPublicAsset(asset);
        verifiedKeys.add(asset.key);
        verified.push(proof);
        await fs.writeFile(proofFile, JSON.stringify(proof, null, 2) + '\n');
        console.log(
          `${verified.length}/${assets.length}: ${asset.key} SHA-256/headers/ranges verified (${proof.cacheStatus})`,
        );
      }
    }),
  );
  const failures = workers.filter((row) => row.status === 'rejected');
  if (failures.length)
    throw new AggregateError(
      failures.map((row) => row.reason),
      failures.map((row) => row.reason.message).join('\n'),
    );
  const manifest = existing
    ? mergeWebVideoManifest(plan, verifiedKeys, existing)
    : webVideoManifest(plan, verifiedKeys);
  await fs.writeFile(
    path.join(output, 'verification.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        videos: plan.videos.length,
        assets: verified.length,
        verified,
      },
      null,
      2,
    ) + '\n',
  );
  await fs.writeFile(
    path.join(output, 'lesson-videos.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  if (options.webManifest) {
    if (existingPath && !(await fs.readFile(existingPath)).equals(existingBytes))
      throw Error(
        'Existing web manifest changed during publication; public manifest was not replaced',
      );
    const target = path.resolve(root, options.webManifest);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(manifest, null, 2) + '\n');
    await fs.rename(temporary, target);
  }
  console.log(`Verified ${plan.videos.length} videos at https://${config.domain}; manifest ready.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
