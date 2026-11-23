import { first, rowClock, scratch, reference, track, tileNote } from '../row-workspace.mjs';
import { rescaledFirstTile, transferPrediction } from '../model.mjs';
import { VALUES } from '../fixtures.mjs';

export function drawRescale(ctx, scene, state, api) {
  const clock = rowClock(scene, state);
  const ref = Number(rescaledFirstTile(clock.progress('new-reference')).reference.toFixed(3));
  const scale = Math.exp(first.m - ref);
  const addedWeight = clock.done('add-weight'),
    addedValue = clock.done('add-value');
  scratch(ctx, api, {
    keys: [2],
    weights: addedWeight ? [1] : [],
    label: 'Query on chip  ·  test',
  });
  reference(ctx, api, 'Reference ' + ref.toFixed(3));
  track(ctx, api, 'weight', { a: first.l * scale, b: addedWeight ? 1 : 0, previous: first.l });
  track(ctx, api, 'value', {
    a: first.u * scale,
    b: addedValue ? VALUES[2] : 0,
    previous: first.u,
  });
  api.text(
    ctx,
    'Current scale: exp(2 − ' + ref.toFixed(3) + ') ≈ ' + scale.toFixed(4),
    116,
    810,
    31,
    api.C.cyan,
  );
  const merged = transferPrediction(VALUES[2]);
  const note = clock.done('merge-output')
    ? 'Tiled output  ≈  ' +
      (merged.tiled.u / merged.tiled.l).toFixed(3) +
      '     ·     Dense output  ≈  ' +
      merged.dense.toFixed(3)
    : addedValue
      ? 'Row output  =  weighted value sum ÷ total weight'
      : clock.done('same-mean')
        ? 'First tile alone   ' + (first.u / first.l).toFixed(3)
        : clock.done('common-factor')
          ? 'Both old sums × exp(2 − 3)'
          : 'The new key sets the target reference to 3.';
  tileNote(ctx, api, note);
}

export default {
  id: 'rescale',
  draw: drawRescale,
  cues: [
    'reference-three',
    'common-factor',
    'new-reference',
    'same-mean',
    'add-weight',
    'add-value',
    'merge-output',
  ],
};
