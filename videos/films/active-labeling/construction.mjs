import {
  candidates,
  cleanedRows,
  draftRows,
  judgeRows,
  pool,
  provenance,
  rawText,
  reviewMatrix,
  selectionItems,
} from './fixtures.mjs';
import {
  auditRelease,
  cohenKappa,
  hybridSteps,
  judgePair,
  overlapFindings,
  redact,
  reviewJudgeOrder,
} from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const track = (initial, cues) =>
  createCueTrack({
    initial: {
      id: 'initial',
      snapshot: initial,
    },
    cues: cues.map(([beat, at, snapshot], i) => ({
      id: `cue-${i}`,
      beat,
      at,
      snapshot,
    })),
  });
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.08) / 0.8));
export const redactionTrack = track(
  {
    redacted: false,
  },
  [
    [
      0,
      0.45,
      {
        redacted: true,
      },
    ],
  ],
);
export const pairTrack = track(
  {
    pair: ['A', 'B'],
    evaluated: false,
  },
  [
    [
      1,
      0,
      {
        pair: ['A', 'B'],
        evaluated: true,
      },
    ],
    [
      2,
      0,
      {
        pair: ['C', 'D'],
        evaluated: true,
      },
    ],
  ],
);
export const queueTrack = track(
  {
    count: 0,
  },
  [
    [
      0,
      0.25,
      {
        count: 1,
      },
    ],
    [
      0,
      0.6,
      {
        count: 2,
      },
    ],
  ],
);
export const diversityTrack = track(
  {
    count: 0,
  },
  [
    [
      0,
      0.15,
      {
        count: 1,
      },
    ],
    [
      1,
      0.1,
      {
        count: 2,
      },
    ],
    [
      1,
      0.4,
      {
        count: 3,
      },
    ],
    [
      1,
      0.7,
      {
        count: 4,
      },
    ],
  ],
);
export const releaseTrack = track(
  {
    rebuilt: false,
    completed: true,
  },
  [
    [
      2,
      0.095,
      {
        rebuilt: true,
        completed: false,
      },
    ],
    [
      2,
      0.55,
      {
        rebuilt: true,
        completed: true,
      },
    ],
  ],
);
export const ramp = (p, a, z) => Math.max(0, Math.min(1, (p - a) / (z - a)));
export const smooth = (p) => p * p * (3 - 2 * p);
export function agreementConstruction({ beat, beatP: p }) {
  const diagonal = beat > 0 ? 3 : Math.min(3, Math.floor(ramp(p, 0.74, 0.94) * 3.001));
  const terms = beat > 1 ? 3 : beat < 1 ? 0 : Math.min(3, Math.floor(ramp(p, 0.16, 0.35) * 3.001));
  const rows = reviewMatrix.map((row) => row.reduce((a, b) => a + b, 0)),
    cols = rows.map((_, i) => reviewMatrix.reduce((sum, row) => sum + row[i], 0));
  const stats = cohenKappa(),
    matched = reviewMatrix.reduce((sum, row, i) => sum + (i < diagonal ? row[i] : 0), 0);
  const contributions = rows.map((count, i) => (count * cols[i]) / stats.total ** 2);
  return {
    ...stats,
    rows,
    cols,
    diagonal,
    terms,
    matched,
    contributions,
    partialChance: contributions.slice(0, terms).reduce((a, b) => a + b, 0),
    kappaReady: beat > 1 || (beat === 1 && p >= 0.49),
  };
}
export function mappedJudgeConstruction(progress) {
  const position = ramp(progress, 0.22, 0.59) * judgeRows.length,
    completed = Math.min(judgeRows.length, Math.floor(position));
  const rows = reviewJudgeOrder().rows;
  return {
    rows,
    completed,
    active: completed < rows.length ? completed : null,
    travel: position - completed,
    changed: rows.slice(0, completed).filter((row) => row.mapped !== row.original).length,
  };
}
export function sampleModel(sceneId, state) {
  const position = state.beat + state.beatP;
  if (sceneId === 'redact-and-provenance') {
    const { redacted } = redactionTrack.sample(state).snapshot;
    return {
      redacted,
      text: redacted ? redact(rawText) : rawText,
      provenance,
    };
  }
  if (sceneId === 'write-rubric') {
    const snapshot = pairTrack.sample(state).snapshot,
      pair = snapshot.pair.map((id) => candidates[id]);
    return {
      ...snapshot,
      pair,
      decision: snapshot.evaluated ? judgePair(...pair) : 'APPLY RUBRIC',
    };
  }
  if (sceneId === 'uncertainty-selection') {
    const { count } = queueTrack.sample(state).snapshot;
    return {
      pool,
      queue: [...pool].sort((a, b) => b.uncertainty - a.uncertainty).slice(0, count),
    };
  }
  if (sceneId === 'diversity-selection') {
    const { count } = diversityTrack.sample(state).snapshot,
      steps = hybridSteps();
    return {
      count,
      selected: count ? steps[count - 1].selected : [],
      step: count ? steps[count - 1] : null,
      baseline: [...selectionItems].sort((a, b) => b.uncertainty - a.uncertainty).slice(0, count),
    };
  }
  if (sceneId === 'dataset-release') {
    const snapshot = releaseTrack.sample(state).snapshot;
    return {
      ...snapshot,
      ...auditRelease(snapshot.rebuilt ? cleanedRows : draftRows, snapshot.completed),
    };
  }
  if (sceneId === 'evaluation-boundary')
    return {
      showJudge: position >= 2,
      findings: overlapFindings([draftRows[3]]),
      ...reviewJudgeOrder(),
    };
  if (sceneId === 'reviewer-agreement')
    return {
      ...cohenKappa(),
      showStatistic: position >= 1,
      showDisagreements: position >= 2,
    };
  return {};
}
