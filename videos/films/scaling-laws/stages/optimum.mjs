import { comparePlans } from '../allocation-comparison.mjs';
import { spoken } from '../cue.mjs';

export function drawOptimum(ctx, scene, state, api) {
  const first = spoken(scene, state, 'optimum-square');
  const change = spoken(scene, state, 'optimum-coefficient');
  const answer = spoken(scene, state, 'optimum-tall');
  const move = spoken(scene, state, 'optimum-shift');
  const changed = change.phase !== 'before';
  const resolved = answer.phase === 'after';
  const b = 2 + 2 * api.ease(change.progress);
  let conclusion = 'Which shape has the lower fitted loss?';
  if (first.phase === 'after') conclusion = 'Lowest fitted loss at 10 × 10';
  if (changed) conclusion = 'With the new data penalty, which shape would you choose?';
  if (resolved) conclusion = 'Lowest fitted loss at 5 × 20';
  comparePlans(ctx, api, {
    n: 10 - 5 * api.ease(move.progress),
    b,
    showSquare: true,
    totals: changed ? resolved : first.phase === 'after',
    conclusion,
  });
}

export default {
  id: 'optimum',
  draw: drawOptimum,
  cues: ['optimum-square', 'optimum-coefficient', 'optimum-tall', 'optimum-shift'],
};
