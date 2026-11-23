import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  RELEASE_IDENTITIES,
  V081_POLICY,
  PARALLEL_POLICY,
  cohortSettings,
  releaseIdentity,
  validateCohortDefinition,
  validateV2Plan,
} from '../lib/cohort-definition.mjs';
import { validateReleaseSpec } from '../lib/release-consumer.mjs';
import { fileRecord, writeJson } from '../lib/cohort-files.mjs';
import { runCohort } from '../lib/render-cohort.mjs';

const definition = () => ({
  version: 1,
  id: 'canvas-second-wave',
  runtimeVersion: '0.8.1',
  policyId: V081_POLICY.id,
  subjects: [{ id: 'selected-canvas', mode: 'canvas' }],
});
const plan = () => ({
  version: 2,
  id: 'selected-canvas',
  mode: 'canvas',
  sourceManifest: { renderEngine: { version: '0.8.1' } },
  policy: { ...V081_POLICY },
  settings: cohortSettings('canvas'),
});

test('release validation binds each signed identity and requires public 0.8.1 authority', () => {
  for (const version of ['0.8.0', '0.8.1']) {
    const identity = releaseIdentity(version);
    const spec = {
      version: 1,
      runtimeVersion: version,
      ...identity,
      distribution: 'registry-tarball',
      registry: {
        gitHead: identity.sourceCommit,
        shasum: identity.uploadSha1,
        integrity: 'sha512-test-fixture',
      },
      cohortDefinition: { path: 'definition.json', sha256: 'a'.repeat(64) },
      overlays: ['pnpm-lock.yaml', 'pnpm-workspace.yaml'].map((name) => ({
        path: name,
        sourceCommit: identity.sourceCommit,
      })),
    };
    validateReleaseSpec(spec);
    for (const key of ['sourceCommit', 'sourceTag', 'uploadSha1'])
      assert.throws(() => validateReleaseSpec({ ...spec, [key]: 'changed' }), /exact signed/);
    assert.throws(
      () => validateReleaseSpec({ ...spec, registry: { ...spec.registry, gitHead: 'other' } }),
      /registry authority/,
    );
    if (version === '0.8.1') {
      assert.throws(
        () => validateReleaseSpec({ ...spec, cohortDefinition: undefined }),
        /bound definition/,
      );
      assert.throws(
        () =>
          validateReleaseSpec({ ...spec, distribution: 'accepted-upload-payload', registry: null }),
        /public registry authority/,
      );
    }
  }
  assert.equal(
    RELEASE_IDENTITIES['0.8.0'].sourceCommit,
    '7530fdbd20f3186c7b273f98cb4ee463368db1c1',
  );
  for (const version of ['0.8.2', '__proto__', 'constructor'])
    assert.throws(() => releaseIdentity(version), /Unsupported exact signed/);
});

test('a cohort selects explicit unique subjects without configurable worker or safety overrides', () => {
  validateCohortDefinition(definition());
  for (const delta of [
    { version: 2 },
    { runtimeVersion: '0.8.0' },
    { policyId: 'parallel-unreviewed' },
    { workers: 4 },
    { subjects: [] },
    { subjects: [{ id: '../escape', mode: 'canvas' }] },
    { subjects: [{ id: ['selected-canvas'], mode: 'canvas' }] },
    { subjects: [{ id: 'selected-canvas', mode: 'other' }] },
    { subjects: [definition().subjects[0], definition().subjects[0]] },
  ])
    assert.throws(() => validateCohortDefinition({ ...definition(), ...delta }));
});

test('v2 plans retain full rendering quality and exactly match their serial cohort policy', () => {
  validateV2Plan(plan(), definition());
  for (const delta of [
    { version: 1 },
    { id: 'not-selected' },
    { mode: 'stage' },
    { sourceManifest: { renderEngine: { version: '0.8.0' } } },
    { policy: { ...V081_POLICY, simultaneousFilms: 2 } },
    { policy: { ...V081_POLICY, diskFloorBytes: 0 } },
    { settings: { ...plan().settings, workers: 4 } },
    { settings: { ...plan().settings, threads: 4 } },
    { settings: { ...plan().settings, fps: 24 } },
    { settings: { ...plan().settings, width: 1280 } },
    { settings: { ...plan().settings, quality: 'draft' } },
  ])
    assert.throws(() => validateV2Plan({ ...plan(), ...delta }, definition()));
  const stage = definition();
  stage.subjects[0].mode = 'stage';
  validateV2Plan({ ...plan(), mode: 'stage', settings: cohortSettings('stage') }, stage);
  assert.equal(cohortSettings('stage').fps, 60);
  assert.equal(cohortSettings('canvas').fps, 30);
});

test('changing either copied definition stops the actual coordinator before worker execution', async (t) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'cohort-definition-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const directory = path.join(root, 'attempt');
  await fs.mkdir(directory);
  const namespace = path.join(root, 'cohort-definition.json');
  const local = path.join(directory, 'cohort-definition.json');
  await writeJson(namespace, definition());
  await fs.copyFile(namespace, local);
  const record = { ...(await fileRecord(local)), path: 'cohort-definition.json' };
  const planFile = path.join(directory, 'plan.json');
  await writeJson(planFile, { ...plan(), cohortDefinition: record });
  const stateFile = path.join(directory, 'job.json');
  await writeJson(stateFile, {
    state: 'queued',
    plan: { ...(await fileRecord(planFile)), path: 'plan.json' },
  });
  const clean = await fs.readFile(local);
  for (const [file, message] of [
    [local, /Authority changed/],
    [namespace, /namespace definition/],
  ]) {
    await fs.appendFile(file, ' ');
    await assert.rejects(runCohort(root), message);
    assert.equal(JSON.parse(await fs.readFile(stateFile)).state, 'queued');
    await assert.rejects(fs.stat(path.join(directory, 'render.log')), { code: 'ENOENT' });
    await assert.rejects(fs.stat(path.join(root, '.controller.lock')), { code: 'ENOENT' });
    await fs.writeFile(file, clean);
  }
});

test('only a bound parallel definition admits concurrent jobs in the actual runner', async (t) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'parallel-cohort-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const namespace = path.join(root, 'cohort-definition.json');
  const parallel = { ...definition(), policyId: PARALLEL_POLICY.id };
  validateV2Plan({ ...plan(), policy: PARALLEL_POLICY }, parallel);
  assert.throws(() => validateV2Plan(plan(), parallel));
  for (const jobs of [0, -1, 1.5, 5, '4', NaN]) {
    await assert.rejects(runCohort(root, { jobs }), /--jobs must be an integer/);
  }
  await assert.rejects(runCohort(root, { jobs: 4 }), /permits 1 simultaneous/);
  await writeJson(namespace, definition());
  await assert.rejects(runCohort(root, { jobs: 4 }), /permits 1 simultaneous/);
  await writeJson(namespace, parallel, { replace: true });
  assert.equal(await runCohort(root, { jobs: 4 }), 0);
  assert.equal(await runCohort(root), 0);
});
