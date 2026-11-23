import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import {
  collectCandidateInspectionRun,
  selectInspectionJobs,
} from '../private-gallery/candidate-inspection-run.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'candidate-inspection-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const save = (file, value) => fs.writeFile(file, JSON.stringify(value) + '\n');
  const bind = async (file) => {
    const bytes = await fs.readFile(file);
    return { path: file, sha256: hash(bytes), bytes: bytes.length };
  };
  const read = async (file, { preserveRaw = false } = {}) => {
    const bytes = await fs.readFile(file);
    return {
      value: JSON.parse(bytes),
      binding: await bind(file),
      rawBytes: preserveRaw ? bytes : undefined,
    };
  };
  const source = path.join(directory, 'source.mjs');
  await fs.writeFile(source, 'export const value = 42;\n');
  const dependencyFile = path.join(directory, 'dependencies.json');
  await save(dependencyFile, ['Synthetic dependency integrity fixture']);
  const runtime = {
    version: '0.8.1',
    provenance: { name: 'vizmatic', version: '0.8.1', runtimeSha256: hash('runtime') },
    dependencies: await bind(dependencyFile),
  };
  const entries = Array.from({ length: 199 }, (_, index) => ({
    id: index === 0 ? 'softmax' : `topic-${index}`,
    mode: 'canvas',
    fps: 30,
    width: 1920,
    output: path.join(directory, 'outputs', index === 0 ? 'softmax' : `topic-${index}`),
    sourceManifest: {
      fingerprint: hash(`source-${index}`),
      lessonFile: 'lesson.yaml',
      moduleFile: source,
      closure: { files: [] },
    },
  }));
  entries[0].sourceManifest.closure.files.push(await bind(source));
  const plan = {
    version: 1,
    kind: 'leetllm.inspection-collection',
    createdAt: '2026-11-08T12:00:00Z',
    runtime,
    sourceFreeze: {},
    lessons: entries,
  };
  const primaryPath = path.join(directory, 'primary.json');
  await save(primaryPath, { ...plan, createdAt: '2026-11-08T10:00:00Z' });
  const primary = { record: { plan: await bind(primaryPath), runtime } };
  const output = path.join(entries[0].output, 'softmax');
  await fs.mkdir(output, { recursive: true });
  const artifacts = {};
  for (const name of [
    'softmax.mp4',
    '01-intro.png',
    'softmax.srt',
    'softmax.vtt',
    'softmax.chapters.txt',
    'diagnostics.json',
  ]) {
    await fs.writeFile(path.join(output, name), `Synthetic integrity fixture ${name}`);
    if (!name.endsWith('.mp4')) artifacts[name] = (await bind(path.join(output, name))).sha256;
  }
  const movie = await bind(path.join(output, 'softmax.mp4'));
  const receiptPath = path.join(output, 'verification.json');
  const receipt = {
    id: 'softmax',
    sha256: movie.sha256,
    bytes: movie.bytes,
    fingerprint: entries[0].sourceManifest.fingerprint,
    fullDecode: 'passed',
    renderEngine: runtime.provenance,
    artifactSha256: artifacts,
  };
  await save(receiptPath, receipt);
  const progress = {
    version: 1,
    kind: 'leetllm.inspection-progress',
    lessons: entries.map((entry, index) => ({
      id: entry.id,
      status: index === 0 ? 'complete' : 'pending',
      directionReview: 'unrevisited',
      ...(index === 0
        ? {
            delivery: {
              receipt: null,
              movie,
              fullDecode: 'passed',
              runtime: runtime.provenance,
              sourceFingerprint: entry.sourceManifest.fingerprint,
            },
          }
        : {}),
    })),
  };
  const flush = async () => {
    await save(path.join(directory, 'inspection.json'), plan);
    await save(receiptPath, receipt);
    progress.lessons[0].delivery.receipt = await bind(receiptPath);
    await save(path.join(directory, 'progress.json'), progress);
  };
  await flush();
  const run = async (options = {}) =>
    collectCandidateInspectionRun({
      directory,
      expectedPlanSha256: (await bind(path.join(directory, 'inspection.json'))).sha256,
      ids: ['softmax'],
      primary,
      read,
      bind,
      progressSnapshotPath: 'captured-candidate-progress.json',
      ...options,
    });
  return { directory, output, source, plan, progress, receipt, primary, flush, run, bind, save };
}

test('an explicit corrected run preserves primary provenance and verifies all current delivery bytes', async (t) => {
  const f = await fixture(t),
    before = structuredClone(f.primary);
  const result = await f.run();
  assert.equal(result.jobs.length, 1);
  assert.equal(result.jobs[0].candidateInspectionRun, true);
  assert.equal(result.jobs[0].directionReview, 'unrevisited');
  assert.equal(result.jobs[0].artifactChecks.artifactHashes, 5);
  assert.equal(result.jobs[0].changedSinceFreeze.length, 0);
  assert.equal(result.record.primaryPlan.sha256, before.record.plan.sha256);
  assert.deepEqual(f.primary, before);
  assert(!('recommendation' in result.jobs[0]));
});

test('a foreign explicit candidate plan hash cannot supply a movie', async (t) => {
  const f = await fixture(t);
  await assert.rejects(f.run({ expectedPlanSha256: 'f'.repeat(64) }), /Foreign candidate plan/);
});

test('unknown IDs and unselected completions cannot enter the primary collection', async (t) => {
  const f = await fixture(t);
  await assert.rejects(f.run({ ids: ['foreign'] }), /Foreign candidate ID/);
  await assert.rejects(f.run({ ids: ['topic-1'] }), /Unselected candidate completion/);
});

test('matching version text cannot hide a foreign runtime or dependency digest', async (t) => {
  const f = await fixture(t);
  f.plan.runtime = {
    ...f.plan.runtime,
    provenance: { ...f.plan.runtime.provenance, runtimeSha256: hash('foreign runtime') },
  };
  await f.flush();
  await assert.rejects(f.run(), /Foreign candidate runtime/);
  f.plan.runtime = {
    ...f.primary.record.runtime,
    dependencies: {
      ...f.primary.record.runtime.dependencies,
      sha256: hash('foreign dependencies'),
    },
  };
  await f.flush();
  await assert.rejects(f.run(), /Foreign candidate dependencies/);
});

test('a completed candidate with source drift or a borrowed fingerprint is rejected', async (t) => {
  const f = await fixture(t);
  await fs.appendFile(f.source, '// later primary edit\n');
  await assert.rejects(f.run(), /Candidate source is not current/);
  f.progress.lessons[0].delivery.sourceFingerprint = hash('foreign source');
  await f.flush();
  await assert.rejects(f.run(), { code: 'ERR_ASSERTION' });
});

test('foreign receipt IDs, runtime, hashes and missing non-player artifacts are rejected', async (t) => {
  const f = await fixture(t);
  f.receipt.id = 'foreign';
  await f.flush();
  await assert.rejects(f.run(), /Foreign candidate receipt ID/);
  f.receipt.id = 'softmax';
  f.receipt.renderEngine = { ...f.receipt.renderEngine, runtimeSha256: hash('foreign') };
  await f.flush();
  await assert.rejects(f.run(), /Foreign receipt runtime/);
  f.receipt.renderEngine = f.primary.record.runtime.provenance;
  await f.flush();
  f.progress.lessons[0].delivery.receipt.sha256 = hash('foreign receipt');
  await f.save(path.join(f.directory, 'progress.json'), f.progress);
  await assert.rejects(f.run(), { code: 'ERR_ASSERTION' });
  await f.flush();
  await fs.unlink(path.join(f.output, 'diagnostics.json'));
  await assert.rejects(f.run(), { code: 'ENOENT' });
});

test('a pending correction stays pending and cannot create a manual revisit', async (t) => {
  const f = await fixture(t);
  f.progress.lessons[0].status = 'rendering';
  await f.flush();
  const result = await f.run();
  assert.equal(result.jobs[0].media, null);
  assert.equal(result.jobs[0].state, 'rendering');
  f.progress.lessons[0].status = 'complete';
  f.progress.lessons[0].directionReview = 'reviewed';
  await f.flush();
  await assert.rejects(f.run(), /cannot grant manual review/);
});

test('a pending correction cannot displace playable primary bytes or its all199 status', () => {
  const primary = { inspectionRun: true, state: 'complete', media: { video: 'original' } };
  const correction = {
    inspectionRun: true,
    candidateInspectionRun: true,
    state: 'rendering',
    media: null,
  };
  assert.deepEqual(selectInspectionJobs([correction, primary]), {
    candidate: primary,
    primary,
    correction,
  });
  correction.state = 'complete';
  correction.media = { video: 'corrected' };
  assert.deepEqual(selectInspectionJobs([correction, primary]), {
    candidate: correction,
    primary,
    correction,
  });
});
