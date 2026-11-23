import assert from 'node:assert/strict';
import {
  coordinateStage,
  delayedSubmit,
  freshnessSnapshot,
  submissionFrame,
} from './construction.mjs';
import {
  NOTE_REQUEST,
  NOTE_SCREEN,
  PROBE_END,
  QUEUE_CUE,
  freshnessIntervals,
} from './fixtures.mjs';
import {
  applyNoteEvent,
  coordinatePipeline,
  evaluationEpisode,
  observeNoteReceipt,
  policyDecision,
  portalTrace,
  resolveMark,
  routeSurface,
} from './model.mjs';
export function validateModel() {
  const episode = evaluationEpisode();
  assert.deepEqual(
    [
      episode.targetHits,
      episode.dispatchedClicks,
      episode.forbiddenAttempts,
      episode.forbiddenExecutions,
      episode.steps,
    ],
    [2, 2, 1, 0, 5],
  );
  assert(!evaluationEpisode(3).goal);
  assert(evaluationEpisode(4).goal);
  assert(episode.goal);
  assert.equal(episode.rows[4].decision, 'outside-task-scope');
  const trace = portalTrace();
  assert.equal(trace.searched.decision, 'dispatched');
  assert.equal(trace.stale.decision, 'stale-observation');
  assert.equal(trace.expanded.state.failureOpen, true);
  assert.equal(trace.draft.decision, 'saved-locally');
  assert.equal(trace.deploy.decision, 'outside-task-scope');
  assert.equal(freshnessSnapshot(0, 1).host.version, 1);
  const staleFrame = freshnessSnapshot(1, 8 / freshnessIntervals[1]);
  assert.equal(staleFrame.host.version, 2);
  assert.equal(staleFrame.staleResult.decision, 'stale-observation');
  assert.equal(staleFrame.failureClicks, 0);
  assert.equal(staleFrame.host.failureOpen, false);
  assert.equal(freshnessSnapshot(2, 3 / freshnessIntervals[2]).resolved, null);
  assert.equal(freshnessSnapshot(2, 6 / freshnessIntervals[2]).actionable, false);
  const clickedFrame = freshnessSnapshot(2, 9 / freshnessIntervals[2]);
  assert.equal(clickedFrame.observation.version, 2);
  assert.equal(clickedFrame.resolved.target, 'Failed tests');
  assert.equal(clickedFrame.host.frameId, 'frame-3');
  assert.equal(clickedFrame.host.version, 3);
  assert.equal(clickedFrame.host.failureOpen, true);
  assert.equal(clickedFrame.failureClicks, 1);
  const coordinates = coordinatePipeline();
  assert.deepEqual(coordinates.native, {
    x: 300,
    y: 150,
  });
  assert.deepEqual(coordinates.css, {
    x: 150,
    y: 75,
  });
  assert.deepEqual(coordinateStage(1, 0.1).current, {
    label: 'Subtract padding',
    x: 100,
    y: 50,
  });
  assert.equal(coordinateStage(1, 0.5).current.x, 200);
  assert.equal(coordinateStage(1, 0.9).current.x, 300);
  assert.equal(coordinateStage(2, 0.1).current.x, 150);
  assert.equal(
    resolveMark(
      'frame-3',
      [
        {
          id: 'mark-1',
          frameId: 'frame-2',
          target: 'Failed tests',
          box: [10, 10, 80, 30],
        },
      ],
      'mark-1',
    ),
    null,
  );
  assert.equal(
    resolveMark(
      'frame-2',
      [
        {
          id: 'mark-1',
          frameId: 'frame-2',
          target: 'Failed tests',
          box: [10, 10, 80, 30],
        },
      ],
      'mark-1',
    ).target,
    'Failed tests',
  );
  const submit = delayedSubmit();
  assert.equal(submit.first.immediate, 'unknown');
  assert.equal(submit.statusRead, 'queued');
  assert.equal(submit.replayWouldAddAnother, 2);
  assert.equal(observeNoteReceipt(null), 'unknown');
  assert.equal(
    observeNoteReceipt({
      requestId: 'N-2',
      status: 'queued',
      queuedCount: 1,
    }),
    'unknown',
  );
  assert.equal(
    observeNoteReceipt({
      requestId: 'N-1',
      status: 'pending',
      queuedCount: 1,
    }),
    'unknown',
  );
  assert.equal(
    observeNoteReceipt({
      requestId: 'N-1',
      status: 'queued',
      queuedCount: 0,
    }),
    'unknown',
  );
  const pending = submissionFrame(1, QUEUE_CUE - 0.001),
    backendQueued = submissionFrame(1, QUEUE_CUE + 0.001);
  assert.equal(pending.store.pending.length, 1);
  assert.equal(pending.store.queued.length, 0);
  assert.equal(backendQueued.store.pending.length, 0);
  assert.deepEqual(
    backendQueued.store.queued.map((note) => note.id),
    ['N-1'],
  );
  for (const p of [0, 0.25, 0.5, 0.99]) {
    assert.equal(submissionFrame(1, p).hostOutcome, 'unknown');
    assert.equal(submissionFrame(1, p).receipt, null);
    assert.deepEqual(submissionFrame(1, p).screen, NOTE_SCREEN);
  }
  assert.equal(submissionFrame(2, PROBE_END - 0.001).hostOutcome, 'unknown');
  const confirmed = submissionFrame(2, PROBE_END + 0.001);
  assert.equal(confirmed.hostOutcome, 'queued');
  assert.deepEqual(confirmed.receipt, {
    requestId: 'N-1',
    status: 'queued',
    queuedCount: 1,
  });
  const replay = applyNoteEvent(
    applyNoteEvent(confirmed.store, 'submit', {
      ...NOTE_REQUEST,
      id: 'N-2',
    }),
    'process',
  );
  assert.deepEqual(
    replay.queued.map((note) => note.id),
    ['N-1', 'N-2'],
  );
  assert.equal(replay.queued.length, confirmed.replayWouldAddAnother);
  assert.equal(policyDecision('rerunDeploy'), 'deny');
  assert.equal(policyDecision('writeIncident'), 'approval-required');
  assert.equal(routeSurface('read-legacy-traceback', false), 'computer-use');
  assert.equal(routeSurface('read-status', true), 'typed-api');
}
export function buildVerifiedDelayedWrite() {
  function delayedWriteBranches() {
    const start = {
        pending: [],
        queued: [],
      },
      one = applyNoteEvent(start, 'submit'),
      blind = applyNoteEvent(one, 'submit', {
        ...NOTE_REQUEST,
        id: 'N-2',
      }),
      blindDone = applyNoteEvent(applyNoteEvent(blind, 'process'), 'process'),
      waitDone = applyNoteEvent(one, 'process');
    return {
      one,
      blind,
      blindDone,
      waitDone,
    };
  }
  assert.equal(delayedWriteBranches().blindDone.queued.length, 2);
  assert.equal(delayedWriteBranches().waitDone.queued.length, 1);
  return {
    delayedWriteBranches,
  };
}
export const { delayedWriteBranches } = buildVerifiedDelayedWrite();
