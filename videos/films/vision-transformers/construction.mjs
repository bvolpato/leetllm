import { visionProject } from './arithmetic.mjs';
import { E, patches, tokens } from './fixtures.mjs';
import { logits, weights } from './model.mjs';
import { weightedVectorState, stableSoftmax, dotProduct } from 'vizmatic';
export function projectionSnapshot(beat, beatP, cues) {
  const firstCue = cues?.['projection-patch-column-products-b2-1'];
  let count = 0;
  if (beat > 1) {
    count = 4;
  } else if (beat === 1) {
    if (cues?.['projection-five']) {
      const ids = [
        'projection-patch-column-products-b2-1',
        'projection-one',
        'projection-four',
        'projection-five',
      ];
      count = ids.filter((id) => visionCueStarted(cues, id, false)).length;
    } else if (firstCue) {
      count = Math.min(4, Math.floor(4 * visionBound(firstCue.progress) + 1e-9));
    } else {
      count = Math.min(4, Math.floor(Math.max(0, beatP - 0.08) / 0.18));
    }
  }
  const products = patches[0].map((value, i) => E[i].map((weight) => value * weight));
  return {
    count,
    products,
    partial: [0, 1].map((j) => products.slice(0, count).reduce((total, row) => total + row[j], 0)),
  };
}
export function attentionSnapshot(beat) {
  const causal = beat === 2;
  const currentWeights = causal ? [1, 0, 0] : weights;
  return {
    causal,
    weights: currentWeights,
    output: [0, 1].map((i) =>
      dotProduct(
        currentWeights,
        tokens.map((v) => v[i]),
      ),
    ),
  };
}
export function contributionSnapshot(beat, progress) {
  const current = attentionSnapshot(beat),
    elapsed = progress * 18.17;
  const count =
    beat < 1 ? 0 : beat > 1 ? 1 : [4.75, 5.5, 6.8].filter((time) => elapsed >= time).length;
  const products = tokens.map((vector, i) => vector.map((value) => value * current.weights[i]));
  return {
    ...current,
    count,
    products,
    partial: [0, 1].map((d) => products.slice(0, count).reduce((sum, row) => sum + row[d], 0)),
  };
}
export function alignmentSnapshot(beat, progress, cues) {
  const elapsed = progress * 19.562;
  const mode =
    beat < 1
      ? 'scores'
      : beat > 1 || (cues ? visionCueStarted(cues, 'alignment-column', false) : elapsed >= 3.775)
        ? 'column'
        : 'row';
  const values =
    mode === 'scores'
      ? logits
      : mode === 'row'
        ? logits.map((row) => stableSoftmax(row))
        : logits.map((row, r) =>
            row.map((_, c) => stableSoftmax(logits.map((item) => item[c]))[r]),
          );
  return {
    mode,
    values,
    objectiveVisible:
      beat > 1 ||
      (beat === 1 &&
        (cues ? visionCueStarted(cues, 'alignment-objective', false) : elapsed >= 7.475)),
    lossVisible:
      beat > 1 ||
      (beat === 1 &&
        (cues ? visionCueStarted(cues, 'alignment-computed', false) : elapsed >= 11.5)),
  };
}
export function budgetSnapshot(beat, progress, cues) {
  const phase = (a, z) => Math.max(0, Math.min(1, (progress - a) / (z - a)));
  const cue = cues?.['budget-attention-block-count-b2-1'];
  const measuredPhase = (a, z) => Math.max(0, Math.min(1, ((cue?.progress ?? 0) - a) / (z - a)));
  return {
    refinement:
      beat === 0 ? 0 : beat === 1 ? visionCueProgress(cues, 'budget-refine', phase(0, 0.13)) : 1,
    keyGroups:
      beat === 0 ? 1 : beat === 1 ? 1 + 3 * (cue ? measuredPhase(0, 0.4) : phase(0.06, 0.4)) : 4,
    queryGroups:
      beat === 0 ? 1 : beat === 1 ? 1 + 3 * (cue ? measuredPhase(0.5, 0.88) : phase(0.44, 0.8)) : 4,
    coarseTokens: (224 / 16) ** 2,
    fineTokens: (224 / 8) ** 2,
  };
}
export const visionBound = (x) => Math.max(0, Math.min(1, x));
export const visionCueProgress = (cues, id, fallback) =>
  !cues?.[id]
    ? fallback
    : cues[id].phase === 'before'
      ? 0
      : cues[id].phase === 'after'
        ? 1
        : cues[id].progress;
export const visionCueStarted = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;
export function visionFreshState(beat, progress, cues) {
  const reveal =
      beat > 1 ||
      (beat === 1 && visionCueStarted(cues, 'fresh-projection-equality', progress > 0.05)),
    repair = beat === 2 && visionCueStarted(cues, 'fresh-third-coordinate', progress > 0.2),
    showThird = beat === 2 && visionCueStarted(cues, 'fresh-distinguishable', progress > 0.45),
    a = [2, 3, 6, 7],
    b = [3, 3, 5, 7];
  return {
    a,
    b,
    reveal,
    repair,
    showThird,
    outA: visionProject(a, repair),
    outB: visionProject(b, repair),
  };
}
export function visionMixture(beat, progress, cues) {
  const current = attentionSnapshot(beat),
    advance =
      beat === 0 ? 0 : beat > 1 ? 1 : visionCueProgress(cues, 'attention-build-mixture', progress),
    terms = tokens.map((values, i) => ({
      id: 'weighted-patch-value-' + i,
      label: 'V' + i,
      values,
      weight: current.weights[i],
    }));
  return {
    ...current,
    advance,
    terms,
    accumulation: weightedVectorState({
      terms,
      progress: advance,
    }),
  };
}

// The delivered film uses the spoken cue. Storyboards use progress within the beat.
export function cueMotion(state, beat, id, start = 0.1, end = 0.65) {
  if (state.beat < beat) return 0;
  if (state.beat > beat) return 1;
  return visionCueProgress(
    state.cues,
    id,
    visionBound(((state.beatP ?? 0) - start) / (end - start)),
  );
}
