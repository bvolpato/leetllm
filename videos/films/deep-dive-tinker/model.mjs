import {
  ACTION_MASK,
  FULL,
  IDS,
  INPUTS,
  SAMPLE_ADVANTAGES,
  SAMPLE_FIXTURE,
  SAMPLE_LOGPROBS,
  TARGETS,
  TARGET_WEIGHTS,
} from './fixtures.mjs';
import { ADVANTAGES, REWARDS, ease, rewardMean } from './arithmetic.mjs';
import { tinkerConstruction } from './construction.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  IDS.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: id + '-initial',
        snapshot: {
          stage: 0,
        },
      },
      cues: [0, 1, 2].map((stage) => ({
        id: id + '-stage-' + stage,
        beat: stage,
        at: 0,
        snapshot: {
          stage,
        },
      })),
    }),
  ]),
);
export function trajectoryTrace(beat, progress) {
  const seconds = progress * [16.78, 20.308, 21.988][beat];
  const tokens =
    beat > 0
      ? [...TARGETS]
      : TARGETS.map((v, i) => (i === 0 || seconds >= [0, 10.03, 11.69][i] ? v : null));
  const logs =
    beat > 0
      ? [...SAMPLE_LOGPROBS]
      : SAMPLE_LOGPROBS.map((v, i) => (i === 0 || seconds >= [0, 10.03, 11.69][i] ? v : null));
  const credits =
    beat > 0
      ? [...SAMPLE_ADVANTAGES]
      : SAMPLE_ADVANTAGES.map((v, i) => (i === 0 || seconds >= [0, 14.79, 15.6][i] ? v : null));
  const mask =
    beat > 0
      ? [...ACTION_MASK]
      : ACTION_MASK.map((v, i) => (i === 0 || seconds >= [0, 14.79, 15.6][i] ? v : null));
  return {
    seconds,
    tokens,
    logs,
    credits,
    mask,
    receipts: [seconds >= 5.9, seconds >= 7.6],
    tool: beat === 2 && seconds >= 10.75,
    validated: beat === 2 && seconds >= 19,
  };
}
export function sampleModel(id, state) {
  if (!tracks[id]) return tinkerConstruction(id, state);
  const stage = tracks[id].sample(state).snapshot.stage;
  const q = ease(state.beatP);
  if (id === 'opening') {
    const trainerVersion = 2;
    const samplerVersion = 1;
    return {
      stage,
      q,
      trainerVersion,
      samplerVersion,
      stale: trainerVersion !== samplerVersion,
    };
  }
  if (id === 'boundary')
    return {
      stage,
      q,
      localSteps: ['render', 'grade', 'datum'],
      hostedSteps: ['compute', 'update', 'sample', 'store'],
    };
  if (id === 'sft')
    return {
      stage,
      q,
      full: FULL,
      inputs: INPUTS,
      targets: TARGETS,
      weights: TARGET_WEIGHTS,
      weightSum: TARGET_WEIGHTS.reduce((a, b) => a + b, 0),
      scaled: TARGET_WEIGHTS.map((v) => v / TARGET_WEIGHTS.reduce((a, b) => a + b, 0)),
    };
  if (id === 'group-credit') {
    const shown = stage === 0 ? Math.ceil(q * REWARDS.length) : REWARDS.length;
    return {
      stage,
      q,
      rewards: REWARDS,
      mean: rewardMean,
      advantages: ADVANTAGES,
      shown,
      showMean: shown === REWARDS.length,
    };
  }
  if (id === 'trajectory-datum') {
    return {
      stage,
      q,
      targets: TARGETS,
      logprobs: SAMPLE_LOGPROBS,
      advantages: SAMPLE_ADVANTAGES,
      mask: ACTION_MASK,
      aligned: [TARGETS, SAMPLE_LOGPROBS, SAMPLE_ADVANTAGES, ACTION_MASK].every(
        (row) => row.length === INPUTS.length,
      ),
    };
  }
  if (id === 'lora-path')
    return {
      stage,
      q,
      base: 'W',
      factors: ['A', 'B'],
      formula: 'W′ = W + γBA',
      rank: stage >= 1 ? 4 : 2,
    };
  if (id === 'clock')
    return {
      stage,
      q,
      time: stage + q,
      cycles: 3,
      submittedTogether: stage > 0,
    };
  const complete = (cue, fallback) => state.cues?.[cue] ? state.cues[cue].phase === 'after' : fallback;
  const inner = Math.max(SAMPLE_FIXTURE.x, SAMPLE_FIXTURE.lo);
  const result = Math.min(inner, SAMPLE_FIXTURE.hi);
  return {
    stage,
    q,
    selected: ['artifact by consumer', 'sampler weights', 'adapter-v2 sample fixture'][stage],
    trainingVersion: 2,
    samplerVersion: stage >= 1 ? 2 : 1,
    saved: stage >= 1,
    transfer: stage === 1 ? q : stage >= 2 ? 1 : 0,
    clientAttached: stage >= 2,
    responseVisible: stage >= 2 && complete('tk-snapshots-2-1', q >= 0.1),
    innerVisible: stage >= 2 && complete('snapshots-inner-max', q >= 0.45),
    resultVisible: stage >= 2 && complete('snapshots-outer-min', q >= 0.7),
    graderVisible: stage >= 2 && complete('snapshots-compare', q >= 0.88),
    fixture: SAMPLE_FIXTURE,
    inner,
    result,
    passed: result === SAMPLE_FIXTURE.expected,
  };
}
