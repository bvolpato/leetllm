import assert from 'node:assert/strict';
import path from 'node:path';
import { collectInspectionRun } from './inspection-run.mjs';

export function selectInspectionJobs(jobs) {
  return {
    candidate:
      jobs.find((job) => job.candidateInspectionRun && job.media) ??
      jobs.find((job) => job.media) ??
      null,
    primary: jobs.find((job) => job.inspectionRun && !job.candidateInspectionRun) ?? null,
    correction: jobs.find((job) => job.candidateInspectionRun) ?? null,
  };
}

/** A separately frozen correction run never replaces the primary run's history. */
export async function collectCandidateInspectionRun({
  directory,
  expectedPlanSha256,
  ids,
  primary,
  read,
  bind,
  progressSnapshotPath,
}) {
  assert.match(expectedPlanSha256 ?? '', /^[a-f0-9]{64}$/, 'Candidate plan SHA-256 is required');
  const plan = await read(path.join(directory, 'inspection.json'));
  assert.equal(plan.binding.sha256, expectedPlanSha256, 'Foreign candidate plan');
  assert.notEqual(
    plan.binding.sha256,
    primary.record.plan.sha256,
    'Candidate plan must be separate',
  );
  assert(
    Array.isArray(ids) && ids.length > 0 && new Set(ids).size === ids.length,
    'Invalid candidate selection',
  );
  const original = await read(primary.record.plan.path);
  const originalEntries = new Map(original.value.lessons.map((entry) => [entry.id, entry]));
  assert.deepEqual(
    plan.value.lessons.map((entry) => entry.id),
    original.value.lessons.map((entry) => entry.id),
    'Foreign candidate collection',
  );
  assert.equal(
    plan.value.runtime.version,
    primary.record.runtime.version,
    'Foreign candidate runtime',
  );
  assert.deepEqual(
    plan.value.runtime.provenance,
    primary.record.runtime.provenance,
    'Foreign candidate runtime',
  );
  assert.equal(
    plan.value.runtime.dependencies.sha256,
    primary.record.runtime.dependencies.sha256,
    'Foreign candidate dependencies',
  );
  const dependencies = await bind(plan.value.runtime.dependencies.path);
  assert.equal(
    dependencies.sha256,
    plan.value.runtime.dependencies.sha256,
    'Candidate dependencies changed',
  );
  assert.equal(
    dependencies.bytes,
    plan.value.runtime.dependencies.bytes,
    'Candidate dependency length changed',
  );
  const entries = new Map(plan.value.lessons.map((entry) => [entry.id, entry]));
  for (const id of ids) {
    const entry = entries.get(id),
      before = originalEntries.get(id);
    assert(
      entry && before && entry.mode === 'canvas' && before.mode === 'canvas',
      `Foreign candidate ID: ${id}`,
    );
    assert.equal(entry.fps, before.fps, `Candidate FPS changed: ${id}`);
    assert.equal(entry.width, before.width, `Candidate width changed: ${id}`);
  }
  const result = await collectInspectionRun({
    directory,
    read,
    bind,
    progressSnapshotPath,
    strictDelivery: true,
  });
  assert.equal(
    result.record.plan.sha256,
    expectedPlanSha256,
    'Candidate plan changed during collection',
  );
  for (const job of result.jobs) {
    if (job.state !== 'complete') continue;
    assert(ids.includes(job.id), `Unselected candidate completion: ${job.id}`);
    assert.equal(job.directionReview, 'unrevisited', 'Candidate run cannot grant manual review');
    for (const file of entries.get(job.id).sourceManifest.closure.files) {
      const actual = await bind(file.path);
      assert.equal(actual.sha256, file.sha256, `Candidate source is not current: ${file.path}`);
      assert.equal(actual.bytes, file.bytes, `Candidate source length changed: ${file.path}`);
    }
    assert.equal(job.changedSinceFreeze.length, 0, `Candidate source is not current: ${job.id}`);
  }
  return {
    record: { ...result.record, selectedIds: ids, primaryPlan: primary.record.plan },
    jobs: result.jobs
      .filter((job) => ids.includes(job.id))
      .map((job) => ({ ...job, candidateInspectionRun: true })),
    observedProgress: result.observedProgress,
  };
}
