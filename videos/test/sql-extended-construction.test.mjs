import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import {
  literalSubstringPattern,
  eligibleRows,
  freshSqlPacket,
  groupChildren,
  rlsVisible,
  extendedSqlState,
} from '../animations/sql-databases-data-modeling-ai.mjs';

const YAML = createRequire(import.meta.url)('yaml');
const lesson = YAML.parse(
  fs.readFileSync(
    new URL('../lessons/sql-databases-data-modeling-ai.lesson.yaml', import.meta.url),
    'utf8',
  ),
);
const state = (sceneId, beat, patch = {}) => ({
  beat,
  cues: Object.fromEntries(
    lesson.scenes
      .find((s) => s.id === sceneId)
      .beats.flatMap((b) => b.visual_cues ?? [])
      .map((c) => [c.id, { progress: patch[c.id] ?? 0 }]),
  ),
});
const request = { workspace: 'Harbor', principal: 'Bob', time: '2026-09-01' };
test('literal substring escaping preserves punctuation before adding its own wildcards', () => {
  assert.equal(literalSubstringPattern('release_20%!'), '%release!_20!%!!%');
  assert.equal(literalSubstringPattern('!_%'), '%!!!_!%%');
});
test('half-open time and row-specific grants intersect with the requested workspace', () => {
  assert.deepEqual(
    eligibleRows(freshSqlPacket(), request).map((r) => r.id),
    ['c81'],
  );
  assert.deepEqual(
    eligibleRows(freshSqlPacket(true), request).map((r) => r.id),
    ['c80', 'c81'],
  );
  assert.deepEqual(
    eligibleRows(freshSqlPacket(), { ...request, time: '2026-08-31' }).map((r) => r.id),
    ['old'],
  );
  assert.deepEqual(
    eligibleRows(freshSqlPacket(), { ...request, principal: 'Cara' }).map((r) => r.id),
    ['c80'],
  );
});
test('a controlled grant change precedes its completed repaired-answer reveal', () => {
  const scene = 'fresh-request';
  const prediction = extendedSqlState(scene, state(scene, 0));
  assert.equal(prediction.revealed, false);
  const applied = extendedSqlState(
    scene,
    state(scene, 1, { 'fresh-request-step-1-4': 1, 'fresh-request-step-1-6': 1 }),
  );
  assert.equal(applied.repairApplied, true);
  assert.equal(applied.repair, false);
  assert.deepEqual(
    applied.allowed.map((r) => r.id),
    ['c80', 'c81'],
  );
  const settled = extendedSqlState(
    scene,
    state(scene, 1, {
      'fresh-request-step-1-4': 1,
      'fresh-request-step-1-6': 1,
      'fresh-request-step-1-8': 1,
    }),
  );
  assert.equal(settled.repair, true);
});
test('rollback restores the actual dependency diagram as well as its caption', () => {
  const scene = 'delete-order';
  assert.equal(
    extendedSqlState(scene, state(scene, 0, { 'delete-order-step-0-3': 0.8 })).removedCount,
    2,
  );
  const rollback = extendedSqlState(
    scene,
    state(scene, 0, { 'delete-order-step-0-3': 1, 'delete-order-step-0-4': 1 }),
  );
  assert.equal(rollback.removedCount, 0);
  assert.equal(rollback.rolledBack, true);
  assert.equal(extendedSqlState(scene, state(scene, 1)).removedCount, 0);
});
test('a valid reference can outlive its historical vector values', () => {
  const scene = 'lineage-version',
    changed = extendedSqlState(scene, state(scene, 0, { 'lineage-version-step-0-1': 1 }));
  assert.equal(changed.foreignKeyPasses, true);
  assert.equal(changed.savedScore, 1);
  assert.equal(changed.recomputedScore, 0);
  const fixed = extendedSqlState(
    scene,
    state(scene, 0, { 'lineage-version-step-0-1': 1, 'lineage-version-step-0-5': 1 }),
  );
  assert.equal(fixed.recomputedScore, 1);
});
test('row security distinguishes ordinary, forced-owner and bypass roles', () => {
  assert.equal(rlsVisible({ role: 'ordinary' }), false);
  assert.equal(rlsVisible({ role: 'owner' }), true);
  assert.equal(rlsVisible({ role: 'owner', force: true }), false);
  assert.equal(rlsVisible({ role: 'bypass', force: true }), true);
  assert.equal(rlsVisible({ role: 'superuser', force: true }), true);
  assert.equal(rlsVisible({ role: 'ordinary', policyAllows: true }), true);
});
test('grouping preserves an empty parent and counts selected child identities', () => {
  const groups = groupChildren(
    ['R', 'S', 'T'],
    [
      { parent: 'R', active: true },
      { parent: 'R', active: true },
      { parent: 'R', active: false },
      { parent: 'S', active: true },
    ],
  );
  assert.deepEqual(groups, [
    { parent: 'R', count: 2 },
    { parent: 'S', count: 1 },
    { parent: 'T', count: 0 },
  ]);
});
