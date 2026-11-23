import { mean, qUpdate, rsClamp, shaping, sum } from './arithmetic.mjs';
import {
  RS_FIRST_INDICES,
  RS_Q18,
  RS_REPORTED_SOURCE,
  RS_SENTENCES,
  seedRows,
} from './fixtures.mjs';
import { researchEvent } from './construction.mjs';
import { decision, reportedInterval, reportedMeans } from './evidence.mjs';
import assert from 'node:assert/strict';
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
export function controlledRun(shaped = false, zero = false) {
  const q = Array.from(
    {
      length: 7,
    },
    () => [0, 0],
  );
  for (let s = 0; s < 6; s++) {
    const reward = s === 5 ? 1 : 0,
      extra = shaped && !zero ? shaping(s, s + 1) : 0;
    q[s][1] = qUpdate(q[s][1], reward + extra, Math.max(...q[s + 1]), s === 5);
  }
  return q;
}
export const deltas = seedRows.map((r) => r.early_shaped - r.early_sparse);
export function bootstrapSamples() {
  let state = 20260731;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  return Array.from(
    {
      length: 2000,
    },
    () => {
      const indices = Array.from(
        {
          length: 24,
        },
        () => Math.floor(random() * 24),
      );
      return {
        indices,
        mean: mean(indices.map((index) => deltas[index])),
      };
    },
  );
}
export function bootstrap() {
  return bootstrapSamples().map((sample) => sample.mean);
}
export const resampleDraws = bootstrapSamples();
export const resampled = resampleDraws.map((sample) => sample.mean);
export function trajectory(actions) {
  const slips = [false, false, true, false, false, false, false, false];
  return actions.reduce(
    (positions, action, index) => {
      const move = slips[index] ? -action : action;
      return [...positions, Math.max(0, Math.min(6, positions.at(-1) + move))];
    },
    [0],
  );
}
export function sampleModel(state) {
  const b = track.sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.08) / 0.7));
  const cohortCue = state.cues?.['seed-cohort-complete'],
    cueCount = cohortCue && cohortCue.phase !== 'before' ? Math.ceil(24 * cohortCue.progress) : 0;
  return {
    b,
    p,
    q: b ? 1 : p,
    n: b ? 24 : Math.max(Math.floor(24 * p), cueCount),
  };
}
export function visibleControlRows(sample) {
  return sample.b ? 6 : Math.max(1, Math.min(6, Math.ceil(6 * sample.p)));
}
export function shapingSnapshot(beat, progress) {
  const elapsed = progress * 18.562;
  if (beat === 0)
    return {
      position: 0,
      completed: 0,
      label: 'Start state · potential −1',
    };
  const clip = (value) => Math.max(0, Math.min(1, value));
  const forward = clip((elapsed - 0.6875) / (1.7 - 0.6875));
  const reverse = clip((elapsed - 2.0125) / (2.95 - 2.0125));
  return {
    position: forward - reverse,
    completed: elapsed >= 7.5875 ? 3 : reverse === 1 ? 2 : forward === 1 ? 1 : 0,
    label:
      reverse > 0 && reverse < 1
        ? 'Return transition 1 → 0'
        : forward < 1
          ? 'Forward transition 0 → 1'
          : reverse === 1
            ? 'Returned to state 0'
            : 'Arrived at state 1',
  };
}
export const RS_NEW_IDS = new Set(Object.keys(RS_SENTENCES));
export function researchConstructionModel(id, state) {
  assert(RS_NEW_IDS.has(id), `Unknown research construction ${id}`);
  const b = state.beat ?? 0,
    e = (beat, sentence) => researchEvent(id, state, beat, sentence),
    done = (beat, sentence) => e(beat, sentence) === 1;
  const model = {
    id,
    b,
    progress: rsClamp(state.beatP ?? 0),
    completed: RS_SENTENCES[id].map((rows, beat) =>
      rows.map((_, sentence) => done(beat, sentence)),
    ),
  };
  if (id === 'actual-update') {
    const nextVisible = done(1, 2),
      reward = shaping(1, 0),
      next = nextVisible ? 0.4 : 0;
    Object.assign(model, {
      alpha: 0.35,
      illustrativeAlpha: 0.2,
      start: 1,
      action: 1,
      successor: 0,
      reward,
      next,
      target: reward + 0.95 * next,
      updated: 0.35 * (reward + 0.95 * next),
      negativeVisible: done(1, 1),
      nextVisible,
      changedVisible: done(1, 3),
    });
  }
  if (id === 'covariance') {
    const x = [0, 0.25, 0.5, 0.75, 1],
      y = x.map((v) => 1 - v),
      variance = (a) => sum(a.map((v) => (v - mean(a)) ** 2)) / (a.length - 1),
      cov = sum(x.map((v, i) => (v - mean(x)) * (y[i] - mean(y)))) / 4;
    Object.assign(model, {
      x,
      y,
      cov,
      varX: variance(x),
      varY: variance(y),
      independent: (variance(x) + variance(y)) / 5,
      paired: (variance(x) + variance(y) - 2 * cov) / 5,
    });
  }
  if (id === 'reported-bootstrap') {
    const count = b > 0 ? 10000 : done(0, 2) ? 10000 : Math.floor(10000 * e(0, 2)),
      means = count === reportedMeans.length ? reportedMeans : reportedMeans.slice(0, count);
    Object.assign(model, {
      count,
      means,
      low: reportedInterval[0],
      high: reportedInterval[1],
      endpointsVisible: done(1, 2),
      source: RS_REPORTED_SOURCE,
      indices: RS_FIRST_INDICES,
      firstMean: mean(RS_FIRST_INDICES.map((i) => deltas[i])),
    });
  }
  if (id === 'point-versus-bound')
    Object.assign(model, {
      mean: mean(deltas),
      low: reportedInterval[0],
      high: reportedInterval[1],
      positiveCount: deltas.filter((v) => v > 0).length,
      negativeCount: deltas.filter((v) => v < 0).length,
      selectedMean: mean(deltas.filter((v) => v > 0)),
      earlyPass: mean(deltas) >= 0.1 && reportedInterval[0] > 0,
      strongerPass: reportedInterval[0] > 0.1,
      verdictVisible: done(0, 1),
      strongerVisible: done(1, 1),
    });
  if (id === 'frozen-policy')
    Object.assign(model, {
      actions: RS_Q18.slice(0, 6).map((row) => row.indexOf(Math.max(...row))),
      successes: 91,
      episodes: 200,
      rate: 91 / 200,
      rateVisible: done(1, 0),
    });
  if (id === 'resource-axis')
    Object.assign(model, {
      episodes: 80,
      sparse: mean(seedRows.map((r) => r.steps_sparse)),
      shaped: mean(seedRows.map((r) => r.steps_shaped)),
      meansVisible: done(0, 1),
    });
  if (id === 'fresh-interpretation') {
    const changedEndpoint = done(3, 1);
    const input = {
      earlyMean: 0.13,
      earlyInterval: [0.04, 0.22],
      finalMean: 0.005,
      finalInterval: [changedEndpoint ? -0.030 : -0.005, 0.015],
      absolute: [0.42, 0.425],
    };
    Object.assign(model, {
      input,
      ...decision(input),
      changedEndpoint,
      competenceEstablished: false,
      earlyVisible: done(1, 0),
      finalVisible: done(1, 1),
      limitsVisible: done(1, 2),
      reportRepaired: done(2, 1),
    });
  }
  return model;
}
