import {
  clip01,
  decode8,
  encode8,
  floatAdds,
  halfAdds,
  phase,
  roundTrip,
  roundedOverflow,
  stochasticNeighbor,
  sum,
} from './encoding.mjs';
import { extendedIds, rows, tracks } from './fixtures.mjs';
import {
  blockContraction,
  experiment,
  freshGroupWorksheet,
  orientationWorksheet,
  projection,
} from './model.mjs';
export function sampleOriginalModel(sceneId, state) {
  const { step } = tracks[sceneId].sample(state).snapshot;
  const q = phase(step > state.beat ? 0 : state.beatP);
  if (sceneId === 'intro')
    return {
      step,
      q,
      ...roundTrip(500, 10 / 448),
      converted: step === 2 || (step === 1 && q >= 0.4),
    };
  if (sceneId === 'number-grid') {
    const cue = state.cues?.['number-grid-exponent-spacing'],
      expanded = step === 2 && !!cue && cue.phase !== 'before',
      x =
        step === 0
          ? 1 + 0.04 * q
          : step === 1
            ? 1.0625
            : expanded
              ? 1.1875 + (2.375 - 1.1875) * cue.progress
              : 1.1875;
    return {
      step,
      q,
      x,
      expanded,
      ...encode8(x),
    };
  }
  if (sceneId === 'stale-scale')
    return {
      step,
      q,
      ...roundTrip(step === 0 ? 10 : 500, step === 2 ? 500 / 448 : 10 / 448),
    };
  if (sceneId === 'local-scales') {
    const mode = step === 0 ? 'tensor' : 'block';
    return {
      step,
      q,
      mode,
      values: experiment[mode],
      focusRow: step === 2 ? 1 : 0,
      focusColumn: step === 2 ? 3 : 0,
    };
  }
  if (sceneId === 'projection') {
    const trace = projection(step === 2),
      count = Math.floor(32 * q + 1e-9);
    return {
      step,
      q,
      trace,
      count,
      original: trace.original[count],
      reconstructed: trace.reconstructed[count],
    };
  }
  if (sceneId === 'block-scales') {
    const fixture = blockContraction(),
      ready = step === 0 ? Number(q >= 0.9) : step === 1 ? 1 + Number(q >= 0.9) : 2;
    return {
      step,
      q,
      ...fixture,
      ready,
      running: sum(fixture.contributions.slice(0, ready)),
    };
  }
  if (sceneId === 'accumulation') {
    const replay = state.cues?.['accumulation-replay-fp32'];
    const count =
      step === 2
        ? 4
        : step === 1 && replay
          ? Math.floor(4 * replay.progress + 1e-9)
          : Math.floor(4 * q + 1e-9);
    return {
      step,
      q,
      count,
      half: halfAdds[count],
      wide: floatAdds[count],
    };
  }
  if (sceneId === 'traffic') {
    const elements = rows.flat().length,
      elementBytes = elements,
      scaleBytes = rows.length,
      wideBytes = elements * 4;
    const transferred = step === 1 ? Math.floor(2 * wideBytes * q + 1e-9) : 0;
    return {
      step,
      q,
      elements,
      elementBytes,
      scaleBytes,
      packed: elementBytes + scaleBytes,
      wideBytes,
      written: Math.min(wideBytes, transferred),
      reread: Math.max(0, transferred - wideBytes),
    };
  }
  const original = decode8(0x38),
    encoded =
      step === 0
        ? {
            code: 0x38,
          }
        : encode8(original, 'fnuz');
  const received = decode8(encoded.code, 'fnuz');
  return {
    step,
    q,
    original,
    code: encoded.code,
    received,
    expected: original * 2,
    result: received * 2,
  };
}
export const cueProgress = (state, id) => state.cues?.[id]?.progress ?? phase(state.beatP);
export const cueDone = (state, id) =>
  state.cues?.[id]?.phase === 'after' || (state.cues?.[id]?.progress ?? -1) >= 1;
export function delayedScaleReplay(progress) {
  const values = [4, 16, 64, 700, -2, -8, -32, -250],
    count = Math.min(8, Math.floor(clip01(progress) * 8));
  return {
    values,
    count,
    observedMax: count ? Math.max(...values.slice(0, count).map(Math.abs)) : null,
    complete: count === 8,
    history: count === 8 ? [700, 10, 8] : [10, 8, 6],
    scale: 10 / 448,
  };
}
export function sampleModel(sceneId, state) {
  if (!extendedIds.includes(sceneId)) return sampleOriginalModel(sceneId, state);
  const step = state.beat,
    p = cueProgress(state, 'lp-' + sceneId + '-build-' + step),
    done = (name) => cueDone(state, 'lp-' + sceneId + '-' + name);
  const s = {
    step,
    q: p,
  };
  if (sceneId === 'scale-timeline')
    return {
      ...s,
      ...delayedScaleReplay(p),
    };
  if (sceneId === 'overflow-mode')
    return {
      ...s,
      a: roundedOverflow(449),
      b: roundedOverflow(465),
      show449: step > 0 || done('449'),
      show465: step > 0 || done('465'),
      showModes: step > 1 || done('modes'),
      showCPU: done('cpu'),
    };
  if (sceneId === 'rounding-probability')
    return {
      ...s,
      ...stochasticNeighbor(1.01),
      showProbability: step > 1 || done('prob'),
    };
  if (sceneId === 'orientation')
    return {
      ...s,
      ...orientationWorksheet(),
      fresh: step === 1 && done('fresh'),
    };
  if (sceneId === 'fresh-group') {
    const revealed = (name, beat) =>
      step > beat ||
      (step === beat &&
        (state.cues
          ? state.cues['lp-fresh-group-' + name]?.phase === 'after'
          : state.beatP >= 0.8));
    return {
      ...s,
      ...freshGroupWorksheet(),
      showScale: revealed('scale', 1),
      showTiny: revealed('tiny', 1),
      showSpike: revealed('spike', 2),
      showZero: revealed('zero', 2),
    };
  }
  return s;
}
