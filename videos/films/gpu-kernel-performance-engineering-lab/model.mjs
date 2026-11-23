import {
  bankModel,
  clamp,
  edgeOwnership,
  motion,
  sectorTransition,
  sum,
  transpose,
} from './arithmetic.mjs';
import { bits, introOrder, recordedTiming, tracks } from './fixtures.mjs';
import { compactProgress } from './construction.mjs';
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro' || id === 'tiles')
    return {
      step,
      q,
      entries: id === 'intro' ? introOrder : transpose(4),
      visible:
        id === 'intro'
          ? step === 0
            ? 0
            : step === 1
              ? Math.floor(16 * q)
              : 16
          : step === 0
            ? Math.floor(16 * clamp((q - 0.55) / 0.45))
            : 16,
      phase:
        id === 'tiles'
          ? step > 0 || q >= 0.55
            ? 'TRANSPOSED READ'
            : q >= 0.3
              ? 'BLOCK BARRIER'
              : 'LOAD'
          : 'TRANSPOSE',
    };
  if (id === 'sectors') {
    const cue = state.cues?.['sectors-naive-store'],
      storeProgress = cue
        ? cue.phase === 'before'
          ? 0
          : cue.phase === 'after'
            ? 1
            : clamp(cue.progress)
        : clamp((q - 0.55) / 0.45);
    return {
      step,
      q,
      storeProgress,
      ...sectorTransition(
        step === 0 ? 32 - Math.floor(32 * storeProgress + 1e-9) : Math.floor(32 * q + 1e-9),
      ),
    };
  }
  if (id === 'banks')
    return {
      step,
      q,
      stride: step === 0 ? 32 : 33,
      ...bankModel(step === 0 ? 32 : 33),
    };
  if (id === 'barrier') {
    const time = step === 0 ? 1.5 * q : 2.5 * q,
      readyAt = [0.3, 0.8, 1.2, 2],
      slots = readyAt.map((at, i) => (time >= at ? i + 1 : null)),
      readAt = step === 0 ? 0.6 : 2.1,
      readSlots = readyAt.map((at, i) => (readAt >= at ? i + 1 : null));
    return {
      step,
      q,
      time,
      slots,
      attempted: time >= readAt,
      result: time >= readAt && readSlots.every((v) => v !== null) ? sum(readSlots) : null,
    };
  }
  if (id === 'primitives')
    return {
      step,
      q,
      bits,
      ...compactProgress(step === 0 ? 0 : Math.floor(q * 8)),
    };
  return {
    step,
    q,
    rows: step === 0 ? 3 : 5,
  };
}
export function timingEvidence(rows = recordedTiming) {
  const summarize = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      minimum: sorted[0],
      maximum: sorted.at(-1),
      median: sorted[Math.floor(sorted.length / 2)],
    };
  };
  const data = Object.fromEntries(Object.entries(rows).map(([id, a]) => [id, summarize(a)]));
  return {
    data,
    paddingRangesOverlap:
      Math.max(data.tiled.minimum, data.padded.minimum) <=
      Math.min(data.tiled.maximum, data.padded.maximum),
    allTiledBelowNaive: data.tiled.maximum < data.naive.minimum,
  };
}
export function freshEdgeReadout(cues = {}) {
  const after = (key) => cues[`gpu-fresh-trial-${key}`]?.phase === 'after',
    model = edgeOwnership(67, 2, 0),
    pair = model.pairs.find((x) => x.producer.row === 1 && x.producer.col === 64);
  return {
    producerCount: after('values') ? model.producers.length : null,
    barrierArrivals: after('barrier') ? 256 : null,
    value: after('value') ? pair.producer.value : null,
    outputIndex: after('index') ? pair.consumer.index : null,
  };
}
