import { admissionReceipt, advantages, maskedNll, scalarResume, sum } from './arithmetic.mjs';
import { mask, rewards, skyNewScenes, tokens, trace, tracks } from './fixtures.mjs';
import { clampSky, phase } from './construction.mjs';
import assert from 'node:assert/strict';
export function sampleModel(id, state) {
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'intro')
    return {
      ...base,
      turn: b,
      trajectory: 'query-42_0',
      reward: b === 0 ? -0.2 : 0.8,
      terminal: b === 2,
    };
  if (id === 'masks') {
    const logprobs = [-0.2, -0.4, b === 1 ? -9 : 0, -0.6, b === 2 ? -1.2 : -0.8];
    return {
      ...base,
      logprobs,
      loss: maskedNll(logprobs),
      return: sum(rewards),
      trainable: sum(mask),
    };
  }
  if (id === 'group') {
    const cue = state.cues?.['group-equal-rewards'],
      equal =
        b === 2
          ? cue
            ? cue.phase === 'after'
              ? 1
              : cue.phase === 'before'
                ? 0
                : cue.progress
            : Math.max(0, Math.min(1, q / 0.45))
          : 0,
      reward = [1, equal, 1, equal];
    return {
      ...base,
      reward,
      ...advantages(reward),
    };
  }
  if (id === 'schedules')
    return {
      ...base,
      async: b > 0,
      time: b === 0 ? q * 10 : b === 1 ? q * 8 : 8,
    };
  if (id === 'capacity') {
    const i = b === 0 ? 0 : b === 1 ? (q < 0.5 ? 1 : 2) : 3,
      row = trace[i],
      consumed = row.step - 1,
      buffered = row.accepted - consumed;
    return {
      ...base,
      ...row,
      consumed,
      buffered,
      outstanding: buffered + row.running,
      lag: row.step - row.scheduled,
      limit: 2 + row.step,
      headroom: 3,
    };
  }
  if (id === 'filter') {
    const travel = (cue, beat) =>
      state.cues?.[cue]?.progress ?? (b === beat ? clampSky(state.beatP / 0.25) : Number(b > beat));
    const outgoing = travel('filter-beat-2-focus-1', 1);
    const incoming = travel('filter-beat-3-focus-1', 2);
    let ledger = { submitted: 5, accepted: 3, filtered: 0, running: 2 };
    if (outgoing === 1) ledger = counterTransition(ledger, 'filter');
    if (incoming === 1) ledger = counterTransition(ledger, 'reserve');
    return {
      ...base,
      ...ledger,
      outgoing,
      incoming,
      limit: 5,
    };
  }
  if (id === 'replicas') {
    const versions = b === 0 ? [11, 11, 11] : b === 1 ? [12, 12, 11] : [12, 12, 12],
      protocolComplete = b === 2;
    return {
      ...base,
      versions,
      protocolComplete,
      resume: protocolComplete && versions.every((v) => v === 12),
    };
  }
  return {
    ...base,
    trajectory: 'query-42_0',
    tokenCount: tokens.length,
    trainable: sum(mask),
    return: sum(rewards),
    sampler: ['weights', 'model config'],
    checkpoint: ['weights', 'optimizer', 'scheduler', 'data progress'],
  };
}
export function restoreProbe(progress) {
  const complete = progress >= 0.5,
    gradient = 0.2,
    learningRate = 0.1,
    previous = {
      weight: 1,
      velocity: 0,
      step: 10,
    };
  const advance = (saved) => {
    const velocity = 0.9 * saved.velocity + gradient;
    return {
      weight: saved.weight - learningRate * velocity,
      velocity,
      step: saved.step + 1,
    };
  };
  const restoredInitial = JSON.parse(JSON.stringify(previous));
  return {
    complete,
    gradient,
    learningRate,
    reference: complete ? advance(previous) : previous,
    restored: complete ? advance(restoredInitial) : restoredInitial,
  };
}
export function counterTransition(state, event) {
  const next = {
    ...state,
  };
  assert.equal(state.submitted, state.accepted + state.filtered + state.running);
  if (event === 'reserve') {
    next.submitted++;
    next.running++;
  } else if (event === 'complete') {
    assert(next.running > 0);
    next.running--;
    next.accepted++;
  } else if (event === 'filter') {
    assert(next.accepted > 0);
    next.accepted--;
    next.filtered++;
  } else throw Error('Unknown counter operation');
  assert.equal(next.submitted, next.accepted + next.filtered + next.running);
  return next;
}
export function skyChapterModel(id, state) {
  assert(skyNewScenes.has(id));
  return {
    id,
    b: state.beat ?? 0,
    p: clampSky(state.beatP ?? 0),
    admission: admissionReceipt({
      B: 2,
      S: 2,
      step: 4,
      accepted: 10,
      running: 1,
      workers: 6,
    }),
    fresh: admissionReceipt({
      B: 2,
      S: 1,
      step: 7,
      accepted: 13,
      running: 2,
      workers: 4,
    }),
    full: scalarResume(
      {
        weight: 2,
        velocity: 0.4,
      },
      0.5,
    ),
    weightOnly: scalarResume(
      {
        weight: 2,
        velocity: 0.4,
      },
      0.5,
      {
        weightOnly: true,
      },
    ),
    wrongCursor: scalarResume(
      {
        weight: 2,
        velocity: 0.4,
      },
      -0.25,
    ),
  };
}
