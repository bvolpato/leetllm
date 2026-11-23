#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readLesson } from './lib/lesson.mjs';
import { validateCollection, assertInside } from './lib/batch.mjs';
import { withStagedDelivery } from './lib/delivery.mjs';
import { checkCandidate } from './visual-teaching-gallery.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function orderSelection(collection, selection) {
  validateCollection(collection);
  if (!Array.isArray(selection.lessons)) throw Error('Selection must provide a lessons array');
  const canonical = new Set(collection.lessons.map((row) => row.id));
  const rows = new Map();
  for (const row of selection.lessons) {
    if (!canonical.has(row.id)) throw Error(`Unknown selected lesson: ${row.id}`);
    if (rows.has(row.id)) throw Error(`Duplicate selected lesson: ${row.id}`);
    if (typeof row.sourceDirectory !== 'string' || !row.sourceDirectory)
      throw Error(`${row.id}: sourceDirectory is required`);
    if (!/^[a-f0-9]{64}$/.test(row.movieSha256 ?? ''))
      throw Error(`${row.id}: exact movieSha256 is required`);
    rows.set(row.id, row);
  }
  const missing = collection.lessons.filter((row) => !rows.has(row.id)).map((row) => row.id);
  if (missing.length) throw Error(`Incomplete delivery selection: ${missing.join(', ')}`);
  return collection.lessons.map((row) => rows.get(row.id));
}

export async function assembleDelivery({ collectionFile, selectionFile, output }) {
  const collectionBytes = await fs.readFile(collectionFile),
    selectionBytes = await fs.readFile(selectionFile);
  const collection = JSON.parse(collectionBytes),
    ordered = orderSelection(collection, JSON.parse(selectionBytes));
  const build = await fs.realpath(path.join(root, 'build'));
  output = path.resolve(output);
  if (!assertInside(build, output))
    throw Error('Delivery output must be inside this repository build/');
  const outputParent = await fs.realpath(path.dirname(output));
  if (outputParent !== build && !assertInside(build, outputParent))
    throw Error('Delivery parent resolves outside build/');
  const rows = [],
    receipts = [];
  for (const [index, selected] of ordered.entries()) {
    const entry = collection.lessons[index];
    const directory = await fs.realpath(path.resolve(root, selected.sourceDirectory));
    if (!assertInside(build, directory) || path.basename(directory) !== entry.id)
      throw Error(`${entry.id}: source directory must be a lesson inside build/`);
    if (assertInside(directory, output) || assertInside(output, directory) || output === directory)
      throw Error(`${entry.id}: output overlaps its source delivery`);
    const lesson = await readLesson(
      path.join(root, 'videos/lessons', `${entry.id}.lesson.yaml`),
      root,
    );
    if (lesson.id !== entry.id || lesson.source !== entry.source || lesson.title !== entry.title)
      throw Error(`${entry.id}: collection and authored lesson differ`);
    const candidate = await checkCandidate(path.dirname(directory), entry.id, { lesson });
    if (!candidate?.passed)
      throw Error(`${entry.id}: ${candidate?.errors.join('; ') ?? 'delivery missing'}`);
    if (candidate.receipt.sha256 !== selected.movieSha256)
      throw Error(`${entry.id}: selected movie changed`);
    const receiptBytes = await fs.readFile(path.join(directory, 'verification.json'));
    if (JSON.stringify(JSON.parse(receiptBytes)) !== JSON.stringify(candidate.receipt))
      throw Error(`${entry.id}: receipt changed during verification`);
    receipts.push(candidate.receipt);
    rows.push({
      id: entry.id,
      title: entry.title,
      canonicalIndex: index,
      sourceDirectory: path.relative(root, directory),
      relativeDirectoryTarget: path.relative(output, directory),
      movieSha256: candidate.receipt.sha256,
      sourceFingerprint: candidate.receipt.fingerprint,
      receiptSha256: digest(receiptBytes),
      timelineSha256: digest(await fs.readFile(path.join(directory, 'timeline.json'))),
      authoredSourceSha256: {
        animation: digest(
          await fs.readFile(path.join(root, 'videos/animations', `${entry.id}.mjs`)),
        ),
        markup: digest(
          await fs.readFile(path.join(root, 'videos/lessons', `${entry.id}.lesson.yaml`)),
        ),
      },
      frames: candidate.receipt.frameAudit.frames,
      durationSeconds: candidate.timeline.duration,
      gates: candidate.gates,
      inspection: candidate.inspection,
    });
    console.log(
      `${entry.id}: current source and all production gates verified (${index + 1}/${ordered.length})`,
    );
  }
  if (
    digest(await fs.readFile(collectionFile)) !== digest(collectionBytes) ||
    digest(await fs.readFile(selectionFile)) !== digest(selectionBytes)
  )
    throw Error('Assembly inputs changed during verification');
  const manifestBytes = Buffer.from(JSON.stringify(receipts, null, 2) + '\n');
  const status = {
    version: 1,
    generatedAt: new Date().toISOString(),
    status: 'technically-verified-editorial-and-audio-separate',
    complete: true,
    expectedCanonicalLessons: collection.lessons.length,
    packagedExports: rows.length,
    scope:
      'Exact selected exports, current sources, complete registered production checks and unchanged original receipt objects. This local assembly records no new editorial score, audible listening, upload or publication.',
    collection: { path: path.relative(root, collectionFile), sha256: digest(collectionBytes) },
    selectionInput: { path: path.relative(root, selectionFile), sha256: digest(selectionBytes) },
    manifest: {
      path: path.relative(root, path.join(output, 'manifest.json')),
      sha256: digest(manifestBytes),
    },
    duration: {
      seconds: rows.reduce((sum, row) => sum + row.durationSeconds, 0),
      encodedFrames: rows.reduce((sum, row) => sum + row.frames, 0),
      basis: 'Exact measured export timelines and verified encoded frame counts',
    },
    lessons: rows,
  };
  status.duration.hours = status.duration.seconds / 3600;
  await withStagedDelivery(output, async (stage) => {
    for (const row of rows)
      await fs.symlink(row.relativeDirectoryTarget, path.join(stage, row.id), 'dir');
    await fs.writeFile(path.join(stage, 'manifest.json'), manifestBytes);
    await fs.writeFile(path.join(stage, 'selection.json'), JSON.stringify(status, null, 2) + '\n');
    await fs.writeFile(
      path.join(stage, 'delivery-status.json'),
      JSON.stringify(status, null, 2) + '\n',
    );
  });
  return status;
}

async function main(args) {
  if (args.includes('--help')) {
    console.log(
      'node videos/assemble-delivery.mjs --selection FILE --output DIR [--collection videos/collections/complete-curriculum.json]',
    );
    return;
  }
  const opts = { collectionFile: path.join(root, 'videos/collections/complete-curriculum.json') };
  for (let i = 0; i < args.length; i += 2) {
    const key = {
      '--selection': 'selectionFile',
      '--collection': 'collectionFile',
      '--output': 'output',
    }[args[i]];
    if (!key || !args[i + 1] || args[i + 1].startsWith('--'))
      throw Error(`Invalid assembly option: ${args[i]}`);
    opts[key] = path.resolve(root, args[i + 1]);
  }
  if (!opts.selectionFile || !opts.output) throw Error('--selection and --output are required');
  const status = await assembleDelivery(opts);
  console.log(
    JSON.stringify({
      output: opts.output,
      lessons: status.packagedExports,
      duration: status.duration,
    }),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}
