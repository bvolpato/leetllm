import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fusionResult,
  selectedLuminance,
  boundDecision,
  moderationPopulation,
} from '../animations/design-real-time-content-moderation-system.mjs';

test('trusted signature precedes optional model availability without treating unknown flags as authority', () => {
  assert.deepEqual(fusionResult(NaN, 0.1, true), { action: 'BLOCK', score: null });
  assert.deepEqual(fusionResult(0.1, 0.1, 'true'), { action: 'REVIEW', score: null });
  assert.deepEqual(fusionResult(NaN, 0.1, false), { action: 'REVIEW', score: null });
  assert.equal(fusionResult(0.65, 0.65).action, 'REVIEW');
  assert.equal(fusionResult(0.08, 0.12).action, 'ALLOW');
});

test('luminance selection retains original identities and uses strict cut magnitude', () => {
  assert.deepEqual(
    selectedLuminance([10, 11, 12, 13, 15, 16, 82, 84, 85, 86, 18, 19]),
    [0, 4, 6, 8, 10],
  );
  assert.deepEqual(selectedLuminance([0, 30, 61, 61, 61], 4, 30), [0, 2, 4]);
  assert.deepEqual(selectedLuminance([10, 10, 10, 10, 10], 4), [0, 4]);
});

test('stored old decision acknowledges a duplicate but cannot resolve the current pending revision', () => {
  const item = {
    revision: 12,
    scope: 'profile-eu',
    policy: 'v7',
    state: 'PENDING',
    applied: { D9: [11, 'profile-eu', 'v7', 'ALLOW'] },
  };
  const receipt = { id: 'D9', revision: 11, scope: 'profile-eu', policy: 'v7', action: 'ALLOW' };
  assert.equal(boundDecision(item, receipt).status, 'DUPLICATE');
  assert.equal(boundDecision(item, { ...receipt, id: 'D10' }).status, 'STALE');
  assert.equal(boundDecision(item, { ...receipt, action: 'BLOCK' }).status, 'CONFLICT');
  assert.equal(item.state, 'PENDING');
  assert.deepEqual(Object.keys(item.applied), ['D9']);
});

test('a current permitted operation applies once and a timed-out operation stays closed', () => {
  const item = { revision: 3, scope: 'upload-eu', policy: 'v8', state: 'PENDING', applied: {} };
  const receipt = { id: 'D24', revision: 3, scope: 'upload-eu', policy: 'v8', action: 'ALLOW' };
  const result = boundDecision(item, receipt);
  assert.equal(result.status, 'APPLIED');
  assert.equal(result.item.state, 'PUBLISHED');
  assert.equal(item.state, 'PENDING');
  assert.equal(boundDecision(result.item, receipt).status, 'DUPLICATE');
  assert.equal(boundDecision({ ...item, state: 'HELD_AFTER_TIMEOUT' }, receipt).status, 'CLOSED');
  assert.equal(boundDecision(item, { ...receipt, revision: 3.5 }).status, 'INVALID');
});

test('base-rate construction conserves the two source populations and the blocked denominator', () => {
  const data = moderationPopulation(20000, 0.01, 0.9, 0.01);
  assert.equal(data.violations + data.legitimate, data.total);
  assert.equal(data.tp + data.fn, data.violations);
  assert.equal(data.fp + data.tn, data.legitimate);
  assert.deepEqual([data.tp, data.fp, data.fn, data.tn], [180, 198, 20, 19602]);
  assert(Math.abs(data.precision - 10 / 21) < 1e-12);
});
