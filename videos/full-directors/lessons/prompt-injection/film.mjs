import assert from 'node:assert/strict';
import { printing } from './printshop.mjs';
import { checkRecords, labelCoverage } from './records.mjs';
import { readerPaths, readerScenes, trafficFrame } from './reader.mjs';
import { detectorCases, gateFrame, rewindFrame, serviceScenes } from './service.mjs';
import { auditScenes, finalFrame, supportFrame } from './audit.mjs';

const scenes = [...readerScenes, ...serviceScenes, ...auditScenes];
function cueFrame(beat, active = []) {
  return { beat: { beatIndex: beat - 1 }, reveal: (phrase) => Number(active.includes(phrase)) };
}
function check() {
  checkRecords();
  assert.deepEqual(readerPaths(cueFrame(1)), { notes: 1, send: true, write: true });
  assert.deepEqual(readerPaths(cueFrame(2)), { notes: 0, send: true, write: true });
  assert.deepEqual(readerPaths(cueFrame(3, ['leave every tool'])), { notes: 0, send: true, write: false });
  const noGrant = trafficFrame(cueFrame(3, ['The service checks', 'The lookup is empty']), true);
  assert.equal(noGrant.missing, 1);
  assert.equal(noGrant.denied, 0);
  assert.equal(noGrant.state.traffic, 0);
  const releaseCues = ['Dispatch the write', 'The service has received', 'allocation takes effect'];
  for (const [shown, expected] of [
    [1, [0, 3, null]],
    [2, [0, 3, null]],
    [3, [25, 4, null]],
  ]) {
    const { state } = trafficFrame(cueFrame(4, releaseCues.slice(0, shown)), false);
    assert.deepEqual([state.traffic, state.revision, state.receipt], expected);
  }
  const { state: inReturn } = trafficFrame({
    beat: { beatIndex: 4 },
    reveal: () => 0.5,
  }, false);
  assert.equal(inReturn.traffic, 25);
  assert.equal(inReturn.receipt, null);
  const { state: received } = trafficFrame(cueFrame(5, ['the caller receives the receipt']), false);
  assert.deepEqual(
    [received.receipt.traffic, received.receipt.revision],
    [received.traffic, received.revision],
  );
  assert.deepEqual(detectorCases.map(({ flagged, allowed }) => [flagged, allowed]), [
    [true, false], [false, false], [true, true],
  ]);
  const beforeLookup = rewindFrame(cueFrame(1));
  assert.deepEqual(
    beforeLookup.histories.map((r) => r.inbox),
    [[], []],
  );
  const afterLoss = rewindFrame(
    cueFrame(2, [
      'stopped before dispatch',
      'request reached',
      'committed one release',
      'reply was lost',
    ]),
  );
  assert.deepEqual(
    afterLoss.histories.map((r) => [r.entries, r.inbox]),
    [
      [0, []],
      [1, []],
    ],
  );
  const recovered = rewindFrame(cueFrame(4));
  assert.deepEqual(
    recovered.histories.map((r) => [r.entries, r.inbox]),
    [
      [0, []],
      [1, ['receipt 1 for OP9']],
    ],
  );
  const staging = gateFrame(cueFrame(3, ['Switching to staging']));
  assert.equal(staging.request.target, 'staging');
  assert.equal(staging.grant.target, 'prod-10pct');
  assert.equal(staging.verdict, 'approval');
  const outside = gateFrame(cueFrame(4, ['hundred-percent target']));
  assert.equal(outside.request.target, 'prod-100pct');
  assert.equal(outside.verdict, 'target');
  const unsupported = supportFrame(cueFrame(4, ['tool-result count to zero']));
  assert.deepEqual(unsupported.report.paths, [50, 50, 0, 50, 50]);
  assert.deepEqual(labelCoverage(unsupported.report), { memberships: 200, outsideAtLeast: 50 });
  assert.equal(Boolean(unsupported.decided), false);
  assert.equal(supportFrame(cueFrame(5, ['Hold it'])).result.eligible, false);
  const small = supportFrame(cueFrame(7, ['twenty attack traces', 'upper bound rises']));
  assert.equal(small.report.attacks, 20);
  assert.deepEqual(small.report.paths, [4, 4, 4, 4, 4]);
  assert.equal(small.result.upper.toFixed(4), '0.1611');
  const prediction = finalFrame(cueFrame(2, ['grant names operation eleven']));
  assert.equal(prediction.verdict, null);
  assert.equal(Boolean(prediction.matched), false);
  assert.equal(prediction.state.approval.operation, 'OP11');
  const matched = finalFrame(
    cueFrame(4, [
      'Start a fresh run',
      'trusted grant to operation twelve',
      'Now the operations match',
    ]),
  );
  assert.equal(matched.matched, 1);
  assert.equal(matched.state.approval.operation, 'OP12');
  assert.equal(matched.state.entries.length, 0);
  const beforeReplay = finalFrame(cueFrame(5, ['replay looks up']));
  assert.equal(Boolean(beforeReplay.replay), false);
  assert.deepEqual(beforeReplay.state.added, [1]);
  const replay = finalFrame(cueFrame(5, ['finds it consumed']));
  assert.deepEqual(replay.state.added, [1, 0]);
  assert.equal(replay.state.approval, null);
  const denied = finalFrame(cueFrame(6, ['Go back']));
  assert.equal(denied.state.entries.length, 0);
  assert.equal(denied.state.approval.operation, 'OP11');
  return true;
}
export default {
  title: 'Keeping Instructions and Evidence Apart',
  preparePicture(schedule) {
    const phrases = {
      'c28-b06': ['The user can read the evaluation', 'The assistant can say', 'that C twenty-six passed evaluation R seventy-three', 'Keep that answer beside the release decision', 'If the user disputes it', 'give the policy owner the operation record'],
      'c28-b07': ['The operation record names', 'the grant the worker found and the field that differed', 'In Responsible AI Governance', 'that record goes to the person who owns the policy', 'and can review a disputed decision'],
    };
    for (const entry of schedule) {
      if (!phrases[entry.beat.id]) continue;
      for (const phrase of phrases[entry.beat.id]) entry.markCaption(phrase);
      entry.cueWordIndices = new Set(entry.cueWordIndices);
    }
  },
  draw(ctx, clock) {
    scenes[clock.beat.chapterIndex](printing(ctx), clock);
  },
  check,
};
