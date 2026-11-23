import { VALUES } from '../fixtures.mjs';
import { transferPrediction } from '../model.mjs';
import { first, rowClock, scratch, reference, track, tileNote } from '../row-workspace.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const { C } = api,
    clock = rowClock(scene, state);
  const old = transferPrediction(VALUES[2]),
    next = transferPrediction(4);
  const changed = clock.done('swap-value'),
    replaced = clock.done('replace-term');
  const released = clock.done('finish-row');
  scratch(ctx, api, {
    keys: released ? [] : [2],
    values: changed ? next.values : old.values,
    weights: [1],
    label: 'Replay  ·  final key',
  });
  reference(
    ctx,
    api,
    'Reference  ' + old.tiled.m,
    replaced
      ? 'Revised row state'
      : clock.started('replace-term')
        ? 'Updating the last term'
        : 'Original row state',
  );
  const oldL = first.l * Math.exp(first.m - old.tiled.m);
  track(ctx, api, 'weight', { a: oldL, b: 1 });
  track(ctx, api, 'value', {
    a: old.firstOnFinalScale,
    b: api.lerp(old.lastContribution, next.lastContribution, clock.progress('replace-term')),
    previous: clock.started('replace-term') ? old.tiled.u : undefined,
    readout: replaced
      ? 'u = ' + next.tiled.u.toFixed(3)
      : clock.started('replace-term')
        ? 'Last term   40 → 4'
        : 'u = ' + old.tiled.u.toFixed(3),
  });
  const note = clock.done('replay-output')
    ? 'Tiled  ' +
      (next.tiled.u / next.tiled.l).toFixed(3) +
      '     ·     Dense  ' +
      next.dense.toFixed(3)
    : replaced
      ? 'New row output  =  ' + next.tiled.u.toFixed(3) + ' ÷ ' + next.tiled.l.toFixed(3)
      : clock.done('changed-sum')
        ? 'Only the value carried by the last key changed.'
        : changed
          ? 'After the change, which saved quantity must move?'
          : 'Original row output  ≈  ' + old.dense.toFixed(3);
  tileNote(ctx, api, note, clock.done('replay-output') ? C.green : C.ink);
}

export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'swap-value',
    'predict-state',
    'changed-sum',
    'replace-term',
    'unchanged-weight',
    'replay-output',
    'finish-row',
  ],
};
