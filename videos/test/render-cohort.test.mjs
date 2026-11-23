import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import {
  COHORT_POLICY,
  assertDiskAdmission,
  validateCohortApproval,
  verifyCohortDelivery,
  runCohort,
} from '../lib/render-cohort.mjs';
import { dependencyInventory, fileRecord, writeJson } from '../lib/cohort-files.mjs';
import {
  validateReleaseSpec,
  extractReleasePackage,
  RELEASE_COMMIT,
  RELEASE_TAG,
  UPLOAD_SHA1,
} from '../lib/release-consumer.mjs';
const exec = promisify(execFile);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'render-cohort-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('disk admission preserves the entire floor and one attempt envelope', () => {
  const boundary = COHORT_POLICY.diskFloorBytes + COHORT_POLICY.attemptEnvelopeBytes;
  assertDiskAdmission(boundary);
  const four = COHORT_POLICY.diskFloorBytes + 4 * COHORT_POLICY.attemptEnvelopeBytes;
  assertDiskAdmission(four, COHORT_POLICY, 4);
  assert.throws(() => assertDiskAdmission(four - 1, COHORT_POLICY, 4), /Insufficient render space/);
  for (const value of [boundary - 1, 0, NaN, Infinity])
    assert.throws(() => assertDiskAdmission(value), /Insufficient render space/);
});

test('source approval binds the immutable plan and retains independent encoded review', () => {
  const plan = {
    id: 'attention',
    sourceManifest: { fingerprint: 'source' },
    manifest: { sha256: 'manifest' },
  };
  const approval = {
    version: 1,
    id: 'attention',
    decision: 'accepted',
    reviewer: 'independent reviewer',
    scope: 'source-runtime-renewal',
    planSha256: 'plan',
    fingerprint: 'source',
    sourceManifestSha256: 'manifest',
    movieApproved: false,
    evidence: [{ path: 'actual-native.json', sha256: '0'.repeat(64) }],
  };
  validateCohortApproval(plan, approval, 'plan');
  for (const delta of [
    { scope: 'historical-POST' },
    { movieApproved: true },
    { planSha256: 'other' },
    { fingerprint: 'old-runtime' },
    { sourceManifestSha256: 'old' },
    { reviewer: '' },
    { evidence: [] },
  ])
    assert.throws(() => validateCohortApproval(plan, { ...approval, ...delta }, 'plan'));
});

test('private dependencies bind executable bytes and reject external package links', async (t) => {
  const root = await fixture(t);
  for (const dir of ['vizmatic/node_modules/pkg', 'repository/videos/node_modules'])
    await fs.mkdir(path.join(root, dir), { recursive: true });
  const file = path.join(root, 'vizmatic/node_modules/pkg/index.js');
  await fs.writeFile(file, 'export const value=1;');
  await fs.symlink('../../../vizmatic', path.join(root, 'repository/videos/node_modules/vizmatic'));
  const first = await dependencyInventory(root);
  await fs.writeFile(file, 'export const value=2;');
  assert.notEqual((await dependencyInventory(root)).fingerprint, first.fingerprint);
  await fs.symlink(tmpdir(), path.join(root, 'repository/videos/node_modules/live-store'));
  await assert.rejects(dependencyInventory(root), /escapes its root/);
});

test('a changed immutable plan stops the actual coordinator before any worker starts and releases its lock', async (t) => {
  const root = await fixture(t),
    directory = path.join(root, 'attempt');
  await fs.mkdir(directory);
  const file = path.join(directory, 'plan.json');
  await writeJson(file, { version: 1, id: 'attention', mode: 'stage', policy: COHORT_POLICY });
  await writeJson(path.join(directory, 'job.json'), {
    state: 'queued',
    plan: { ...(await fileRecord(file)), path: 'plan.json' },
  });
  await fs.appendFile(file, ' ');
  await assert.rejects(runCohort(root), /Authority changed/);
  await assert.rejects(fs.stat(path.join(root, '.controller.lock')), { code: 'ENOENT' });
  assert.equal(JSON.parse(await fs.readFile(path.join(directory, 'job.json'))).state, 'queued');
  await assert.rejects(fs.stat(path.join(directory, 'render.log')), { code: 'ENOENT' });
});

test('an existing coordinator lock rejects a second writer without removing the first lock', async (t) => {
  const root = await fixture(t),
    lock = path.join(root, '.controller.lock');
  await fs.writeFile(lock, 'existing writer');
  await assert.rejects(runCohort(root), { code: 'EEXIST' });
  assert.equal(await fs.readFile(lock, 'utf8'), 'existing writer');
});

test('output verification binds all artifacts, movie bytes and the separate Stage post-render report', async (t) => {
  const root = await fixture(t),
    movie = Buffer.from('encoded movie fixture');
  await fs.writeFile(path.join(root, 'attention.mp4'), movie);
  const plan = { id: 'attention', mode: 'stage', sourceManifest: { fingerprint: 'source' } };
  const receipt = {
    id: 'attention',
    fingerprint: 'source',
    fullDecode: 'passed',
    sha256: hash(movie),
    artifactSha256: { 'attention.mp4': hash(movie) },
  };
  await writeJson(path.join(root, 'verification.json'), receipt);
  const report = {
    passed: true,
    errors: 0,
    sourceFingerprint: 'source',
    videoSha256: receipt.sha256,
  };
  await writeJson(path.join(root, 'film-check.json'), report);
  await verifyCohortDelivery(root, plan);
  await fs.writeFile(path.join(root, 'unregistered.txt'), 'unexpected');
  await assert.rejects(verifyCohortDelivery(root, plan), /registry is incomplete or changed/);
  await fs.unlink(path.join(root, 'unregistered.txt'));
  await writeJson(
    path.join(root, 'film-check.json'),
    { ...report, videoSha256: 'old' },
    { replace: true },
  );
  await assert.rejects(verifyCohortDelivery(root, plan), /differs from this movie/);
  await writeJson(path.join(root, 'film-check.json'), report, { replace: true });
  await fs.writeFile(path.join(root, 'attention.mp4'), 'changed');
  await assert.rejects(verifyCohortDelivery(root, plan), /registry is incomplete or changed/);
});

test('local accepted-upload authority stays distinct from a public registry download', () => {
  const spec = {
    version: 1,
    runtimeVersion: '0.8.0',
    sourceCommit: RELEASE_COMMIT,
    sourceTag: RELEASE_TAG,
    uploadSha1: UPLOAD_SHA1,
    distribution: 'accepted-upload-payload',
    registry: null,
    overlays: ['pnpm-lock.yaml', 'pnpm-workspace.yaml'].map((path) => ({
      path,
      sourceCommit: RELEASE_COMMIT,
    })),
  };
  validateReleaseSpec(spec);
  assert.throws(
    () => validateReleaseSpec({ ...spec, registry: {} }),
    /leave public registry authority null/,
  );
  assert.throws(() => validateReleaseSpec({ ...spec, sourceCommit: 'other' }), /exact signed/);
  assert.throws(
    () => validateReleaseSpec({ ...spec, overlays: [...spec.overlays, { path: '.npmrc' }] }),
    /only the signed release/,
  );
});

test('package extraction verifies actual payload bytes and rejects archive links before extraction', async (t) => {
  const root = await fixture(t),
    source = path.join(root, 'source');
  await fs.mkdir(path.join(source, 'package'), { recursive: true });
  await writeJson(path.join(source, 'package/package.json'), {
    name: 'vizmatic',
    version: '0.8.0',
  });
  const tarball = path.join(root, 'package.tgz');
  await exec('tar', ['-czf', tarball, '-C', source, 'package']);
  const spec = {
    uploadSha1: createHash('sha1')
      .update(await fs.readFile(tarball))
      .digest('hex'),
  };
  const extracted = await extractReleasePackage(tarball, path.join(root, 'valid'), spec);
  assert.equal(
    JSON.parse(await fs.readFile(path.join(extracted, 'package.json'))).version,
    '0.8.0',
  );
  await assert.rejects(
    extractReleasePackage(tarball, path.join(root, 'bad-digest'), { uploadSha1: '0'.repeat(40) }),
    /accepted upload digest/,
  );
  await fs.symlink('/tmp/outside', path.join(source, 'package/link'));
  const unsafe = path.join(root, 'unsafe.tgz');
  await exec('tar', ['-czf', unsafe, '-C', source, 'package']);
  const unsafeSpec = {
    uploadSha1: createHash('sha1')
      .update(await fs.readFile(unsafe))
      .digest('hex'),
  };
  await assert.rejects(
    extractReleasePackage(unsafe, path.join(root, 'unsafe'), unsafeSpec),
    /Unsafe npm package archive/,
  );
  await assert.rejects(fs.stat(path.join(root, 'unsafe')), { code: 'ENOENT' });
});
