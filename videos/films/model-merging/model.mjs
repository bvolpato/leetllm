import { average, connectedBasin, doubleWell, evaluateNeurons } from './arithmetic.mjs';
import { VECTOR_A, VECTOR_B, permutationExample, tiesExample } from './fixtures.mjs';
import { bound, timedProgress } from './construction.mjs';
import { arcSwap } from 'vizmatic';
export function taskArithmeticSnapshot(beat, progress) {
  const elapsed = bound(progress) * [15.838, 12.262, 11.862][beat];
  const base = [0, 0],
    checkpoints = [
      [1, 0],
      [0, 1],
    ];
  const deltas = checkpoints.map((checkpoint) => checkpoint.map((value, i) => value - base[i]));
  const subtraction =
    beat > 0 ? [1, 1] : [timedProgress(elapsed, 1.39, 3.15), timedProgress(elapsed, 3.15, 4.8)];
  const scales =
    beat === 0
      ? [0, 0]
      : beat > 1
        ? [0.8, 0.6]
        : [0.8 * timedProgress(elapsed, 8.2, 8.9), 0.6 * timedProgress(elapsed, 9.01, 9.85)];
  const weighted = deltas.map((delta, i) => delta.map((value) => value * scales[i]));
  const addition = beat === 0 ? 0 : beat > 1 ? 1 : timedProgress(elapsed, 10.06, 11.25);
  const partial = base.map((value, i) => value + weighted[0][i] + weighted[1][i] * addition);
  return {
    elapsed,
    base,
    checkpoints,
    deltas,
    subtraction,
    scales,
    weighted,
    addition,
    partial,
    complete: addition === 1,
  };
}
export function alignmentSnapshot(beat, beatP, measuredSwap) {
  const phase = Math.max(0, Math.min(1, (beatP - 0.38) / 0.34));
  const reorder = beat > 1 ? 1 : beat === 1 ? (measuredSwap ?? phase * phase * (3 - 2 * phase)) : 0;
  const example = permutationExample();
  const positions = arcSwap(
    {
      x: 1415,
      y: 561,
    },
    {
      x: 1415,
      y: 691,
    },
    reorder,
    {
      lift: 200,
    },
  );
  const pairs = example.b.input.map((input, i) => ({
    id: input > 0 ? 'positive' : 'negative',
    input,
    output: example.b.output[i],
    ...positions[i],
  }));
  const displayedB = {
    input: pairs.map((pair) => pair.input),
    output: pairs.map((pair) => pair.output),
  };
  const finalB =
    reorder === 1
      ? {
          input: [...pairs].sort((a, b) => a.y - b.y).map((pair) => pair.input),
          output: [...pairs].sort((a, b) => a.y - b.y).map((pair) => pair.output),
        }
      : null;
  const alignedAverage = finalB
    ? {
        input: average(example.a.input, finalB.input),
        output: average(example.a.output, finalB.output),
      }
    : null;
  return {
    reorder,
    pairs,
    displayedB,
    outputs: [-1, 1].map((x) => evaluateNeurons(displayedB, x)),
    alignedAverage,
  };
}
export function averageSnapshot(beat, beatP) {
  const elapsed = bound(beatP) * 10.27;
  const ready = beat > 1 || (beat === 1 && elapsed >= 4.7875);
  return {
    elapsed,
    ready,
    merged: ready ? average(VECTOR_A, VECTOR_B) : null,
  };
}
export function pathSnapshot(beat, beatP) {
  const elapsed = bound(beatP) * [17.35, 9.502, 15.438][beat];
  // The marker climbs the ridge with that clause, then holds its midpoint
  // throughout the following explanation of the sixty-four-unit loss.
  const w =
    beat === 0
      ? 2 * timedProgress(elapsed, 13.3, 15.95)
      : beat === 1
        ? 2
        : 2 + 2 * timedProgress(elapsed, 4, 11.35);
  return {
    elapsed,
    w,
    ridgeLoss: doubleWell(w),
    valleyLoss: connectedBasin(w),
  };
}
export function tiesSnapshot(beat, beatP) {
  const result = tiesExample(),
    elapsed = bound(beatP) * 22.51;
  const trimOpacity = beat > 1 ? 1 : beat === 1 ? timedProgress(elapsed, 0.4375, 3.5875) : 0;
  const elected = beat > 1 || (beat === 1 && elapsed >= 16.1);
  const merged = beat > 1 || (beat === 1 && elapsed >= 20.95);
  const signedSums = result.trimmed[0].map((_, i) =>
    result.trimmed.reduce((sum, row) => sum + row[i], 0),
  );
  const surviving = result.trimmed.map((row) =>
    row.map((value, i) => elected && Math.sign(value) === result.electedSigns[i] && value !== 0),
  );
  return {
    ...result,
    elapsed,
    trimOpacity,
    elected,
    mergeReady: merged,
    signedSums: elected ? signedSums : null,
    surviving,
    currentMerge: merged ? result.merged : null,
  };
}
export function earnedTransferSnapshot(state = {}) {
  const cue = state.cues?.['earned-result'];
  const progress = cue
    ? cue.phase === 'after'
      ? 1
      : cue.phase === 'before'
        ? 0
        : bound(cue.progress ?? 0)
    : (state.beat ?? 0) > 0
      ? 1
      : 0;
  const base = 2,
    code = 2.5,
    math = 1.5,
    codeScale = 0.6,
    mathScale = 0.4;
  const right = codeScale * (code - base),
    left = mathScale * (math - base);
  return {
    progress,
    base,
    code,
    math,
    codeScale,
    mathScale,
    right,
    left,
    position: base + right * Math.min(1, progress * 2) + left * Math.max(0, progress * 2 - 1),
    result: progress === 1 ? base + right + left : null,
  };
}
