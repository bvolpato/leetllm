import {
  addressReceipt,
  executionAt,
  reduction,
  roofline,
  sharedTrace,
  threadMap,
  warmupTrace,
  warpMap,
} from './arithmetic.mjs';
import { extendedValues, ticketClock, tokenValues } from './fixtures.mjs';
import { directed, mix } from './construction.mjs';
export function sampleModel(sceneId, state) {
  const beat = state.beat ?? 0;
  if (sceneId === 'intro') {
    const { hostStart, eventStart, hostReturn, eventEnd, scalarAt } = ticketClock;
    const time = hostStart +
      (eventStart - hostStart) * directed(state, 'start-clock', 0, 0, 0.3) +
      (hostReturn - eventStart) * directed(state, 'host-return', 0, 0.3, 0.53) +
      (eventEnd - hostReturn) * directed(state, 'stream-advances', 1, 0.5, 0.72) +
      (scalarAt - eventEnd) * directed(state, 'number-returns', 1, 0.72, 0.87);
    return executionAt(time);
  }
  if (sceneId === 'residence') {
    const copy = directed(state, 'copy-row', 0, 0.3, 0.65);
    return {
      copy,
      landed: copy === 1 ? 8 : 0,
      queued: directed(state, 'queue-mean', 1) === 1,
      queueActive: directed(state, 'queue-mean', 1) > 0,
      checks: directed(state, 'process-check', 1, 0.65, 0.9) > 0,
    };
  }
  if (sceneId === 'mapping')
    return {
      split: directed(state, 'split-blocks', 0, 0.35, 0.7),
      base: directed(state, 'owner-base', 1, 0.05, 0.3),
      answer: directed(state, 'owner-answer', 1, 0.35, 0.7),
      extend: directed(state, 'extend-launch', 2, 0.05, 0.35),
      guarded: directed(state, 'guard-tail', 2, 0.45, 0.8) === 1,
      map: threadMap(beat === 2 ? 10 : 8),
    };
  if (sceneId === 'warps') {
    const first = directed(state, 'populate-warps', 0, 0.3, 0.5),
      second = directed(state, 'next-block-warp', 0, 0.7, 0.82),
      main = directed(state, 'larger-block', 1, 0.12, 0.5),
      rest = directed(state, 'warp-remainder', 1, 0.55, 0.82);
    return {
      first,
      second,
      main,
      rest,
      sizes: beat === 0 ? [4, 4] : [36],
      warps: warpMap(beat === 0 ? [4, 4] : [36]),
    };
  }
  if (sceneId === 'coalescing' || sceneId === 'banks') {
    const bank = sceneId === 'banks';
    const progress = directed(
      state,
      bank
        ? beat === 0
          ? 'bank-conflict'
          : beat === 1
            ? 'pad-banks'
            : 'broadcast-word'
        : beat === 0
          ? 'collect-adjacent'
          : beat === 1
            ? 'fan-segments'
            : 'restore-segments',
      beat,
      beat === 1 ? 0.45 : 0.3,
      0.8,
    );
    const previous = Array.from(
      {
        length: 8,
      },
      (_, i) => (bank ? (beat === 2 ? i * 33 : i * 32) : beat === 2 ? i * 32 : i),
    );
    const next = Array.from(
      {
        length: 8,
      },
      (_, i) => (bank ? (beat === 0 ? i * 32 : beat === 1 ? i * 33 : 0) : beat === 1 ? i * 32 : i),
    );
    const amount = progress * 8,
      completed = Math.min(8, Math.floor(amount + 1e-9));
    const waiting = beat > 0 && progress === 0;
    const words = waiting ? previous : next;
    const receipt = addressReceipt(waiting ? previous : next.slice(0, completed));
    return {
      progress,
      completed,
      moving:
        completed < 8 && amount > completed
          ? {
              lane: completed,
              p: amount - completed,
            }
          : null,
      words,
      previous,
      next,
      ...receipt,
      bank,
      beat,
      waiting,
    };
  }
  if (sceneId === 'barrier') {
    if (beat === 1 && state.cues?.['barrier-replay']?.phase === 'before')
      return { early: true, ...sharedTrace(2, false) };
    if (beat === 2)
      return {
        second: directed(state, 'second-subtotal', 2, 0.05, 0.25),
        join: directed(state, 'join-subtotals', 2, 0.35, 0.6),
        pool: directed(state, 'pool-device', 2, 0.65, 0.85),
        ...reduction(tokenValues),
      };
    const publish = directed(
      state,
      beat === 0 ? 'early-writes' : 'barrier-publish',
      beat,
      0.15,
      0.55,
    );
    const read = directed(state, beat === 0 ? 'early-reader' : 'barrier-read', beat, 0.6, 0.85);
    const time = beat === 0 ? 0.49 * publish + 1.51 * read : 2 * publish + 0.1 * read;
    return {
      publish,
      read,
      ...sharedTrace(time, beat === 1),
    };
  }
  if (sceneId === 'clocks') {
    if (beat === 2)
      return {
        warmup: true,
        ...warmupTrace(
          14 * directed(state, 'warmup-complete', 2, 0.1, 0.3) +
            16 * directed(state, 'warmed-samples', 2, 0.4, 0.8),
        ),
      };
    const time =
      beat === 0
        ? 2 * directed(state, 'advance-enqueue', 0, 0.15, 0.45) +
          10 * directed(state, 'continue-device', 0, 0.5, 0.8)
        : 12 +
          29 * directed(state, 'finish-device', 1, 0.25, 0.55) +
          directed(state, 'report-scalar', 1, 0.58, 0.75);
    return {
      warmup: false,
      ...executionAt(time),
    };
  }
  if (sceneId === 'budget') {
    const weights = directed(state, 'weight-bytes', 0, 0.2, 0.4),
      gradients = directed(state, 'gradient-bytes', 0, 0.45, 0.6),
      moments = directed(state, 'moment-bytes', 0, 0.65, 0.85);
    return {
      weights,
      gradients,
      moments,
      bytes: 4 * weights + 4 * gradients + 8 * moments,
      scale: directed(state, 'scale-budget', 1, 0.05, 0.4),
      extra: directed(state, 'activation-budget', 1, 0.45, 0.75),
      gib: 16e9 / 2 ** 30,
    };
  }
  if (sceneId === 'synthesis') {
    const p = directed(
      state,
      beat === 0 ? 'build-intensity' : beat === 1 ? 'reuse-bytes' : 'reach-compute',
      beat,
      0.2,
      0.75,
    );
    const bytes = beat === 0 ? 4000 : beat === 1 ? mix(4000, 1000, p) : mix(1000, 250, p);
    return {
      p,
      ...roofline(1000 / bytes),
    };
  }
  if (sceneId === 'transfer')
    return {
      tail: directed(state, 'final-tail', 0, 0.4, 0.7),
      sums: directed(state, 'final-sums', 1, 0.05, 0.35),
      divide: directed(state, 'final-divide', 1, 0.4, 0.65),
      numeric: beat > 1 || (beat === 1 && state.cues?.['final-numeric-result']?.phase === 'after'),
      report: directed(state, 'final-report', 2, 0.05, 0.35),
      format: directed(state, 'final-format', 2, 0.55, 0.85),
      ...reduction(extendedValues),
    };
  throw new Error('Unknown CUDA teaching scene: ' + sceneId);
}
