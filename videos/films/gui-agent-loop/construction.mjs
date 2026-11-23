import { progressBetween } from './arithmetic.mjs';
import {
  INITIAL_PORTAL,
  NOTE_REQUEST,
  NOTE_SCREEN,
  PROBE_END,
  PROBE_START,
  QUEUE_CUE,
  freshnessIntervals,
} from './fixtures.mjs';
import {
  applyNoteEvent,
  applyPortalAction,
  coordinatePipeline,
  observeNoteReceipt,
  resolveMark,
} from './model.mjs';
export function coordinateStage(beat, progress) {
  const { point, unpadded, native, css } = coordinatePipeline();
  const stages = [
    {
      label: 'Observed image',
      x: point.modelX,
      y: point.modelY,
    },
    {
      label: 'Subtract padding',
      ...unpadded,
    },
    {
      label: 'Restore crop scale ×2',
      x: unpadded.x * 2,
      y: unpadded.y * 2,
    },
    {
      label: 'Add crop origin',
      ...native,
    },
    {
      label: 'Divide by DPR 2',
      ...css,
    },
  ];
  const index = beat === 0 ? 0 : beat === 1 ? Math.min(3, 1 + Math.floor(progress * 3)) : 4;
  return {
    index,
    current: stages[index],
    stages,
  };
}
export function freshnessSnapshot(beat, progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * freshnessIntervals[beat];
  const reached = (atBeat, seconds) => beat > atBeat || (beat === atBeat && elapsed >= seconds);
  const oldObservation = {
    sessionId: INITIAL_PORTAL.sessionId,
    frameId: INITIAL_PORTAL.frameId,
    version: INITIAL_PORTAL.version,
  };
  const oldProposal = {
    ...oldObservation,
    kind: 'expand-failure',
    runId: 'RUN-78432',
  };
  const advanced = reached(1, 2.975);
  let host = advanced
    ? applyPortalAction(INITIAL_PORTAL, {
        ...oldObservation,
        kind: 'search-run',
        runId: oldProposal.runId,
      }).state
    : INITIAL_PORTAL;
  const staleChecked = reached(1, 7.4875);
  const staleResult = staleChecked ? applyPortalAction(host, oldProposal) : null;
  const captured = reached(2, 1.3875);
  const observation = captured
    ? {
        sessionId: host.sessionId,
        frameId: host.frameId,
        version: host.version,
      }
    : null;
  const controls = captured
    ? [
        {
          id: 'failed-tests-1',
          frameId: host.frameId,
          target: 'Failed tests',
          runId: host.runId,
          actionable: true,
          box: [505, 445, 810, 365],
        },
      ]
    : [];
  const matches = controls.filter(
    (control) => control.target === 'Failed tests' && control.runId === oldProposal.runId,
  );
  const resolved =
    reached(2, 3.7125) && matches.length === 1
      ? resolveMark(observation.frameId, controls, matches[0].id)
      : null;
  const actionable = reached(2, 6.275) && Boolean(resolved && matches[0].actionable);
  const dispatched = reached(2, 8.6) && actionable;
  if (dispatched)
    host = applyPortalAction(host, {
      ...observation,
      kind: 'expand-failure',
      runId: oldProposal.runId,
    }).state;
  return {
    elapsed,
    oldObservation,
    oldProposal,
    advanced,
    host,
    staleChecked,
    staleResult,
    oldProposalVisible: reached(1, 4.125),
    captured,
    observation,
    controls,
    resolved,
    actionable,
    dispatched,
    failureClicks: Number(dispatched),
    browserInputs: Number(advanced) + Number(dispatched),
  };
}
export function submissionFrame(beat, progress) {
  const writeProgress = beat > 0 ? 1 : progressBetween(progress, 0.15, 0.38);
  let store = {
    pending: [],
    queued: [],
  };
  if (writeProgress === 1) store = applyNoteEvent(store, 'submit');
  if (beat > 1 || (beat === 1 && progress >= QUEUE_CUE)) store = applyNoteEvent(store, 'process');
  const probeProgress = beat < 2 ? 0 : progressBetween(progress, PROBE_START, PROBE_END);
  const receipt =
    probeProgress === 1 && store.queued.some((note) => note.id === NOTE_REQUEST.id)
      ? {
          requestId: NOTE_REQUEST.id,
          status: 'queued',
          queuedCount: store.queued.length,
        }
      : null;
  const replay = applyNoteEvent(
    applyNoteEvent(store, 'submit', {
      ...NOTE_REQUEST,
      id: 'N-2',
    }),
    'process',
  );
  return {
    writeProgress,
    inputSent: writeProgress > 0,
    store,
    probeProgress,
    receipt,
    hostOutcome: observeNoteReceipt(receipt),
    screen: NOTE_SCREEN,
    screenshotChanged: false,
    replayWouldAddAnother: replay.queued.length,
    deadlineBranchVisible: beat === 2 && progress >= 4.8 / 10.438,
  };
}
export function delayedSubmit() {
  const queued = submissionFrame(1, 1),
    observed = submissionFrame(2, 1);
  return {
    first: {
      immediate: queued.hostOutcome,
      screenshotChanged: queued.screenshotChanged,
    },
    queued: queued.store.queued.length,
    statusRead: observed.hostOutcome,
    replayWouldAddAnother: queued.replayWouldAddAnother,
  };
}
