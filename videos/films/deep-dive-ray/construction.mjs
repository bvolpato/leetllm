import { bounded, features, phase, rayClamp, rayFeature } from './arithmetic.mjs';
import { ids, parallel, serial, texts } from './fixtures.mjs';
import { motion, results } from './ledger.mjs';
import {
  rayApplyBatch,
  rayBackpressure,
  rayObjectLoss,
  rayPlacement,
  rayResources,
  windowTrace,
} from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          b: 0,
        },
      },
      cues: [0, 1, 2].map((b) => ({
        id: `${id}-${b}`,
        beat: b,
        at: 0,
        snapshot: {
          b,
        },
      })),
    }),
  ]),
);
export function retryTrace(beat, progress) {
  const seconds = bounded(progress) * [18.888, 17.352, 21.264][beat];
  const durable = beat > 0,
    done = beat === 2;
  const firstCommit = done || seconds >= (durable ? 5.4 : 2.05);
  const replaySent = done || seconds >= (durable ? 6.42 : 7.47);
  const replayArrived = done || seconds >= (durable ? 7.51 : 9.35);
  const secondCommit = !durable && seconds >= 9.55;
  const count = Number(firstCommit) + Number(secondCommit);
  const stored = durable && firstCommit;
  const hit = durable && replayArrived && (done || seconds >= 7.65);
  const request = done
    ? null
    : seconds < (durable ? 2.3 : 1.6)
      ? {
          attempt: 1,
          progress: bounded((seconds - 0.15) / (durable ? 2.15 : 1.45)),
        }
      : replaySent && seconds < (durable ? 7.51 : 9.35)
        ? {
            attempt: 2,
            progress: bounded((seconds - (durable ? 6.42 : 7.47)) / (durable ? 1.09 : 1.88)),
          }
        : null;
  const replyStart = durable ? 8.25 : 12.8,
    replyEnd = durable ? 9.6 : 15.2;
  const replying = !done && seconds >= replyStart && seconds < replyEnd;
  const received = done || seconds >= replyEnd;
  const lost = firstCommit && (done || seconds >= (durable ? 6.05 : 3.2));
  const recreated = durable && (done || seconds >= 14.3);
  const emphasis = done
    ? 0
    : Math.max(0, 1 - Math.abs(seconds - (durable ? 5.4 : secondCommit ? 9.55 : 2.05)) / 0.85);
  return {
    seconds,
    durable,
    firstCommit,
    secondCommit,
    count,
    stored,
    hit,
    request,
    replying,
    replyProgress: bounded((seconds - replyStart) / (replyEnd - replyStart)),
    received,
    lost,
    recreated,
    pid: recreated ? 202 : 101,
    attempts: replaySent ? 2 : 1,
    record: stored
      ? {
          batch: 'B17',
          result: 1,
        }
      : null,
    emphasis,
  };
}
export function sampleModel(id, state) {
  if (RAY_NEW.has(id)) return rayChapterState(id, state);
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'intro' || id === 'dependencies') {
    const events = id === 'dependencies' && b === 0 ? serial : parallel,
      end = Math.max(...events.map((e) => e.end)),
      handoff = parallel[2].start,
      time =
        id === 'intro'
          ? handoff * motion(state, 'intro-first-finish', 0) +
            (end - handoff) * motion(state, 'intro-finish', 0)
          : b === 2
            ? end
            : q * end,
      comparison =
        id === 'intro'
          ? {
              serial,
              parallel,
              paths: {
                serial: Math.max(...serial.map((event) => event.end)),
                twoWorkers: Math.max(...parallel.map((event) => event.end)),
              },
            }
          : undefined;
    return {
      ...base,
      events,
      end,
      time,
      ready: events.filter((e) => e.end <= time).map((e) => e.id),
      values: id === 'intro' ? results : texts.map(features),
      ...(comparison
        ? {
            comparison,
          }
        : {}),
    };
  }
  if (id === 'references') {
    const copyCue = state.cues?.['references-beat-2-focus-1'];
    const secondCopyPresent =
      b === 1 && (copyCue ? ['during', 'after'].includes(copyCue.phase) : true);
    const ownerCue = state.cues?.['references-beat-3-focus-1'];
    const ownerLost = b === 2 && ['during', 'after'].includes(ownerCue?.phase);
    return {
      ...base,
      copies: secondCopyPresent ? 2 : 1,
      bytesPerCopy: 64,
      owner: 'driver',
      lost: b === 2,
      secondCopyPresent,
      consumerWaiting: b === 1 && !secondCopyPresent,
      ownerLost,
    };
  }
  if (id === 'placement') {
    const grow = state.cues?.['ray-placement-grow'];
    const capacity = b === 2 && (!grow || grow.phase === 'after') ? [4, 2] : [2, 2],
      strict = b > 0,
      feasible = strict ? Math.max(...capacity) >= 4 : capacity.reduce((a, v) => a + v, 0) >= 4,
      assigned = !feasible ? [0, 0] : strict ? [4, 0] : [2, 2];
    return {
      ...base,
      capacity,
      strict,
      feasible,
      assigned,
    };
  }
  if (id === 'window') {
    const first = state.cues?.['window-consume-first'],
      next = state.cues?.['window-keep-bounded'];
    const tick =
      b === 0
        ? 0
        : b === 1
          ? first
            ? next?.phase !== 'before'
              ? 3 + Math.floor(5 * (next?.progress ?? 0))
              : Math.floor(3 * first.progress)
            : Math.floor(q * 8)
          : 12;
    return {
      ...base,
      tick,
      ...windowTrace(tick),
    };
  }
  if (id === 'restart') {
    const restored =
      b === 2 &&
      (state.cues ? state.cues['restart-load-durable-ledger']?.phase === 'after' : q >= 0.5);
    return {
      ...base,
      pid: b === 0 && q < 0.6 ? 101 : 202,
      count: b === 0 && q < 0.6 ? 3 : restored ? 3 : 0,
      restored,
      inputs: [true, true, true],
    };
  }
  if (id === 'retry')
    return {
      ...base,
      ...retryTrace(Math.min(2, state.beat ?? 0), state.beatP ?? 0),
    };
  return {
    ...base,
    replica: 1,
    routed: b > 0 || q > 0.4,
    batch: b === 0 ? [] : ['R4', 'R7', 'R9'],
    request: 'R7',
  };
}
export const RAY_NEW = new Set([
  'primitive-contract',
  'argument-inspection',
  'local-lab',
  'scheduler-owners',
  'actor-resource',
  'lost-result',
  'memory-lifetime',
  'bundle-membership',
  'granularity-pressure',
  'durable-restore',
  'retry-controls',
  'library-owners',
  'engine-boundary',
  'gcs-recovery',
  'failure-evidence',
  'source-history',
  'fresh-owner',
]);
export function rayProgress(state, id, beat) {
  const b = state.beat ?? 0;
  if (b < beat) return 0;
  if (b > beat) return 1;
  const q = state.cues?.[id];
  return q
    ? q.phase === 'before'
      ? 0
      : q.phase === 'after'
        ? 1
        : rayClamp(q.progress)
    : rayClamp(((state.beatP ?? 0) - 0.06) / 0.88);
}
export function rayChapterState(id, state) {
  const b = state.beat ?? 0,
    p = rayProgress(state, 'ray-' + id + '-op-' + b, b),
    done = (id, beat = b) => rayProgress(state, 'ray-' + id, beat) === 1;
  const base = {
    b,
    p,
  };
  if (id === 'primitive-contract')
    return {
      ...base,
      values: ['cache', 'router', 'trace'].map(rayFeature),
      valuesReady: done('feature-values', 0),
    };
  if (id === 'actor-resource') {
    const removed = b === 1 && done('actor-release', 1),
      actors = b === 0 && !done('actor-two', 0) ? [1] : removed ? [1] : [1, 1];
    return {
      ...base,
      removed,
      ...rayResources(2, actors),
      childReady: b === 0 ? done('actor-child', 0) : b === 1 && removed,
      childAdmitted: removed,
      freeAfterChild: removed ? 0 : 2 - actors.reduce((a, z) => a + z, 0),
    };
  }
  if (id === 'lost-result') {
    const ownerAlive = b !== 1 || !done('owner-dies', 1),
      reconstructed = b === 0 && done('reconstruct', 0),
      allLost = b === 0 && done('all-copies', 0),
      lostA = done('copy-a-lost', 0) || done('copy-survives', 0) || allLost,
      onA = b === 0 && (!lostA || reconstructed),
      onB = b === 0 ? !allLost : b === 1 || !done('put-last-copy', 2),
      copies = Number(onA) + Number(onB),
      lineage = b !== 2;
    return {
      ...base,
      ownerAlive,
      onA,
      onB,
      copies,
      reconstructed,
      ...rayObjectLoss({
        ownerAlive,
        copies,
        lineage,
      }),
      ...(reconstructed
        ? {
            status: 'Same task output reconstructed',
          }
        : {}),
      resultReady:
        b === 0
          ? allLost
            ? reconstructed
            : done('copy-survives', 0)
          : b === 1
            ? done('owner-error', 1)
            : done('put-no-lineage', 2),
    };
  }
  if (id === 'granularity-pressure')
    return {
      ...base,
      trace: rayBackpressure(4 + Math.floor(rayProgress(state, 'ray-sink-full', 0) * 3)),
      bytes: 3 * 64,
      costSingle: 12 * (10 + 2),
      costBatch: 3 * (4 * 10 + 2),
      bytesReady: done('payload-total', 1),
      exceeded: done('store-exceeded', 1),
      singleReady: done('cost-single', 2),
      batchReady: done('cost-batched', 2),
    };
  if (id === 'durable-restore') {
    const initial = {
        count: 3,
        records: {
          B17: 3,
        },
      },
      committed = b > 1 || (b === 1 && done('transaction-after', 1)),
      first = rayApplyBatch(initial, 'B18', 2),
      second = rayApplyBatch(first.ledger, 'B19', 1),
      old = rayApplyBatch(second.ledger, 'B18', 2);
    return {
      ...base,
      initial,
      first,
      second,
      old,
      committed,
      replayed: done('batch-replay', 1),
      oldReady: done('old-result', 2),
    };
  }
  if (id === 'bundle-membership') {
    let strategy = 'PACK';
    if (b === 1) {
      if (rayProgress(state, 'ray-bundle-fits', 1) > 0) strategy = 'BUNDLE';
      else if (rayProgress(state, 'ray-strict-spread', 1) > 0) strategy = 'STRICT_SPREAD';
      else if (rayProgress(state, 'ray-spread-prefers', 1) > 0) strategy = 'SPREAD';
      else if (rayProgress(state, 'ray-strict-pack', 1) > 0) strategy = 'STRICT_PACK';
    }
    return {
      ...base,
      strategy,
      ...rayPlacement(
        [2, 2],
        strategy === 'BUNDLE' ? [4] : [1, 1, 1, 1],
        strategy === 'BUNDLE' ? 'PACK' : strategy,
      ),
      verdictReady:
        b !== 1 ||
        done(
          strategy === 'BUNDLE'
            ? 'bundle-fits'
            : strategy === 'STRICT_SPREAD'
              ? 'strict-spread'
              : strategy === 'SPREAD'
                ? 'spread-prefers'
                : strategy === 'STRICT_PACK'
                  ? 'strict-pack'
                  : 'pack-prefers',
          1,
        ),
      nodeLost: b === 2 && done('node-loss', 2),
    };
  }
  if (id === 'fresh-owner')
    return {
      ...base,
      ownerVerdict: b > 0 && done('fresh-owner-error', 1),
      ledgerVerdict: b > 0 && done('fresh-batch-result', 1),
      newReference: b === 2 && done('fresh-newref', 2),
      oldReference: 'X',
      storedResult: 5,
    };
  return base;
}
