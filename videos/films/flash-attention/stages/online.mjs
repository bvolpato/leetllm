import { first, rowClock, scratch, reference, track, tileNote } from '../row-workspace.mjs';
import { SCORES, VALUES } from '../fixtures.mjs';

export function drawOnline(ctx, scene, state, api) {
  const clock = rowClock(scene, state);
  const firstWeight = Math.exp(SCORES[0] - first.m);
  const aReleased = clock.done('release-a'),
    arrived = clock.done('arrival-b');
  const weights = arrived
    ? []
    : [clock.done('first-weight') ? firstWeight : null, clock.done('unit-weight') ? 1 : null];
  scratch(ctx, api, {
    keys: arrived ? [2] : aReleased ? [] : [0, 1],
    weights,
    term: !aReleased,
    label: 'Query on chip  ·  test',
  });
  reference(ctx, api, clock.done('tile-reference') ? 'Reference  2' : 'Reference  ?');
  track(ctx, api, 'weight', {
    a: (clock.done('post-fix') ? firstWeight : 0) + (clock.done('weight-this') ? 1 : 0),
  });
  track(ctx, api, 'value', {
    a:
      (clock.done('value-fix') ? VALUES[0] * firstWeight : 0) +
      (clock.done('post-this') ? VALUES[1] : 0),
  });
  const note = arrived
    ? 'At reference 3, should both saved totals grow or shrink?'
    : clock.done('tile-average')
      ? 'First tile alone   ' + (first.u / first.l).toFixed(3)
      : 'Weight goes on the upper track. Weight × value goes on the lower track.';
  tileNote(ctx, api, note);
}

export default {
  id: 'online',
  draw: drawOnline,
  cues: [
    'tile-reference',
    'first-weight',
    'unit-weight',
    'post-fix',
    'value-fix',
    'weight-this',
    'post-this',
    'tile-average',
    'release-a',
    'arrival-b',
    'which-scale',
  ],
};
