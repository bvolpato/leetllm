import { modelDigest, sum } from './arithmetic.mjs';
import {
  CANARY_EVIDENCE_CUES,
  OFFLINE_CASES,
  bundle,
  failedBundle,
  passingWindow,
  pendingWindow,
  regressingHistory,
} from './fixtures.mjs';
import { evaluatePackage, offline, offlineReceipt, receiptsFor } from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const track = createCueTrack({
  initial: {
    id: 'first',
    snapshot: 0,
  },
  cues: [
    {
      id: 'second',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
  ],
});
export const canaryTrack = createCueTrack({
  initial: {
    id: 'pending-quality',
    snapshot: 0,
  },
  cues: [
    {
      id: 'mature-passing-quality',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
    {
      id: 'earlier-mature-regression',
      beat: 2,
      at: 0,
      snapshot: 2,
    },
  ],
});
export function canaryEvidence(state) {
  const beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (state.cues?.['canary-labels-rise']) {
    const count = (id) => Math.max(0, Math.min(4, Math.ceil(4 * (state.cues[id]?.progress ?? 0))));
    const labelCount = beat === 0 ? 0 : beat > 1 ? 4 : count('canary-labels-rise'),
      costCount = beat === 0 ? 0 : beat > 1 ? 4 : count('canary-costs-rise');
    const rows = passingWindow.qualityRows.map((row, index) => ({
      id: row.id,
      label: index < labelCount ? row.late : null,
      candidateCost: index < costCount ? row.candidateCost : null,
      baselineCost: index < costCount ? row.baselineCost : null,
    }));
    return {
      rows,
      labelCount,
      costCount,
      expected: 4,
      candidateTotal: sum(rows.map((r) => r.candidateCost ?? 0)),
      baselineTotal: sum(rows.map((r) => r.baselineCost ?? 0)),
      controllerCalled: beat === 0 || beat > 1 || state.cues['canary-b2-4']?.phase !== 'before',
      window: {
        ...passingWindow,
        labelsReady: labelCount === 4,
        qualityRows: costCount === 4 ? passingWindow.qualityRows : null,
      },
    };
  }
  const received = (cues) =>
    beat === 0 ? 0 : beat > 1 ? cues.length : cues.filter((cue) => progress >= cue).length;
  const labelCount = received(CANARY_EVIDENCE_CUES.labels);
  const costCount =
    state.cues?.['canary-b2-3'] && state.cues['canary-b2-3'].phase !== 'before'
      ? 4
      : received(CANARY_EVIDENCE_CUES.costs);
  const rows = passingWindow.qualityRows.map((row, index) => ({
    id: row.id,
    label: index < labelCount ? row.late : null,
    candidateCost: index < costCount ? row.candidateCost : null,
    baselineCost: index < costCount ? row.baselineCost : null,
  }));
  const costRows = rows.filter((row) => row.candidateCost !== null);
  return {
    rows,
    labelCount,
    costCount,
    expected: passingWindow.qualityRows.length,
    candidateTotal: sum(costRows.map((row) => row.candidateCost)),
    baselineTotal: sum(costRows.map((row) => row.baselineCost)),
    controllerCalled: beat === 0 || beat > 1 || progress >= CANARY_EVIDENCE_CUES.controller,
    window: {
      ...passingWindow,
      labelsReady: labelCount === passingWindow.qualityRows.length,
      qualityRows:
        costCount === passingWindow.qualityRows.length ? passingWindow.qualityRows : null,
    },
  };
}
export const bad = evaluatePackage(failedBundle, receiptsFor(failedBundle, 24));
export const passingEvaluation = evaluatePackage(
  bundle,
  OFFLINE_CASES.map((row) => ({
    id: row.id,
    modelDigest: modelDigest(bundle),
    cost: row.gold ? 2 : 0,
    baseline: row.gold ? 25 : 0,
  })),
);
export function offlineConstruction(state) {
  const cue = state.cues?.['offline-b2-1'],
    passing = cue ? cue.phase !== 'before' : (state.beat ?? 0) > 0,
    progress = passing ? (cue ? (cue.phase === 'after' ? 1 : cue.progress) : 1) : 1,
    model = passing ? bundle : failedBundle,
    rows = passing ? passingEvaluation : bad,
    shown = passing ? Math.ceil(rows.length * progress) : rows.length,
    training = passing ? 'train-v1' : 'train-v0';
  return {
    passing,
    progress,
    model,
    rows,
    shown,
    training,
    gate: shown === rows.length ? offline(rows) : null,
    receipt: offlineReceipt(model, rows, training),
  };
}
export function sampleModel(scene, state) {
  const b = (scene === 'canary' ? canaryTrack : track).sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.08) / 0.7));
  const evidence = scene === 'canary' ? canaryEvidence(state) : null;
  return {
    b,
    p,
    bundle,
    gate: offline(bad),
    canaryEvidence: evidence,
    windows:
      b === 2
        ? regressingHistory
        : b
          ? [pendingWindow, evidence?.window ?? passingWindow]
          : [pendingWindow],
    active: scene === 'recovery' && b ? 'v0' : 'v1',
  };
}
