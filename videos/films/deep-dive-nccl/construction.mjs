import { clamp, cost, phase } from './arithmetic.mjs';
import { ids, reduced } from './fixtures.mjs';
import { partial } from './model.mjs';
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
export const narratedProgress = (state, id, fallback) => state.cues?.[id]?.progress ?? fallback;
export function cueProgress(state, beat, id) {
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return narratedProgress(state, id, state.beatP ?? 0);
}
export function heard(state, beat, id) {
  if (state.beat !== beat) return state.beat > beat;
  return state.cues ? state.cues[id]?.phase === 'after' : state.beatP >= 1;
}
export function sampleModel(id, state) {
  const b = state.beat ?? tracks[id]?.sample(state).snapshot.b ?? 0,
    q = phase(state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'intro')
    return {
      ...base,
      column: 2,
      complete: heard(state, 1, 'nc-intro-b1-s1') && !heard(state, 3, 'intro-owner'),
      reduced,
    };
  if (id === 'agreement')
    return {
      ...base,
      calls: [0, 1, 2, 3].map((rank) =>
        b === 1 && rank === 2 ? 'Broadcast' : b === 0 ? 'All-reduce' : 'All-gather',
      ),
      agreement: b !== 1,
      sequence: b === 0 ? 0 : 1,
    };
  if (id === 'ring') {
    const flight = narratedProgress(state, 'ring-hop-' + b, Math.min(1, q / 0.4)),
      addition = narratedProgress(state, 'ring-add-' + b, q >= 0.4 ? 1 : 0),
      hops = b + (addition === 1 ? 1 : 0);
    return {
      ...base,
      flight,
      addition,
      hops,
      ...partial(hops),
      before: partial(b),
      source: [3, 0, 1][b],
      target: [0, 1, 2][b],
    };
  }
  if (id === 'gather') {
    const flight = narratedProgress(state, 'gather-copy-' + b, Math.min(1, q / 0.4)),
      hops = b + (flight === 1 ? 1 : 0),
      known = [2, 3, 0, 1].slice(0, hops + 1);
    return {
      ...base,
      flight,
      hops,
      known,
      source: [2, 3, 0][b],
      target: [3, 0, 1][b],
      value: reduced[2],
    };
  }
  if (id === 'cost') {
    const bytes = heard(state, 2, 'cost-big-size')
      ? 1000000
      : heard(state, 1, 'cost-mid-size')
        ? 200000
        : 1000;
    return {
      ...base,
      bytes,
      ring: cost(bytes),
      tree: cost(bytes, false),
    };
  }
  if (id === 'streams') {
    const time =
      b === 0
        ? narratedProgress(state, 'streams-input', q) +
          0.2 * narratedProgress(state, 'streams-host', q)
        : b === 1
          ? 1.2 + narratedProgress(state, 'streams-overlap', q) * 4.8
          : 6 + narratedProgress(state, 'streams-complete', q);
    return {
      ...base,
      time,
      hostReturned: time >= 1.2,
      inputReady: time >= 1,
      complete: time >= 7,
      consumer: heard(state, 2, 'streams-release'),
    };
  }
  if (id === 'receipt') {
    const bytes = 256 * 2 ** 20,
      seconds = 0.006,
      ranks = 4,
      algbw = bytes / seconds / 1e9,
      factor = (2 * (ranks - 1)) / ranks,
      hidden = 4 * cueProgress(state, 2, 'receipt-shift');
    return {
      ...base,
      bytes,
      seconds,
      ranks,
      algbw,
      factor,
      busbw: algbw * factor,
      hidden,
      exposed: seconds * 1000 - hidden,
    };
  }
  const failureProgress = narratedProgress(state, 'synthesis-first-failure', b > 0 ? 1 : 0);
  return {
    ...base,
    path: b === 0 ? ['GPU', 'GPU fabric', 'GPU'] : ['GPU', 'PCIe', 'NIC', 'Fabric', 'NIC', 'GPU'],
    failure: b > 0 && failureProgress >= 0.25 ? 'Rank 2 allocation failure at step 8' : null,
    timeout: b === 2 || (b === 1 && failureProgress >= 0.85),
  };
}
export function sentence(state, id, beat, index) {
  if (state.beat > beat) return 1;
  if (state.beat < beat) return 0;
  const key = `nc-${id}-b${beat}-s${index}`;
  if (state.cues && !state.cues[key]) throw Error('Unknown NCCL sentence anchor: ' + key);
  return clamp(state.cues?.[key]?.progress ?? state.beatP ?? 0);
}
export const done = (state, id, beat, index) => sentence(state, id, beat, index) === 1;
