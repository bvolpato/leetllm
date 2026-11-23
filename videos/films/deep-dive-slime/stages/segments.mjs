import { sum } from '../arithmetic.mjs';
import { mask, tokens } from '../fixtures.mjs';
import { segmentState } from '../model.mjs';
import { progress } from '../phrase-clock.mjs';
import { drawSlimeBrace } from '../defaults.mjs';

export function drawSegments(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  const s = segmentState(state.beat, state.beatP, p('segments-move-boundary'));
  const local = p('local-means') === 1 && p('restore-shared') < 1;
  const showAmount = state.beat === 0 ? p('even-shares') === 1 : p('uneven-shares') === 1;
  return api.focus.target('segment-terms', () => {
    api.text(ctx, 'ROLLOUT 7', 115, 270, 35, C.ink);
    api.text(ctx, 'Policy v11   /   4 selected tokens', 1810, 270, 34, C.blue, 'right');
    api.line(ctx, 115, 306, 1810, 306, C.muted, 2);
    const x = (i) => 398 + i * 365;
    const boundary = x(s.boundary) - 182;
    api.text(ctx, 'Split', boundary, 390, 30, C.yellow, 'center');
    api.line(ctx, boundary, 411, boundary, 646, C.yellow, 4);
    s.terms.forEach((value, i) => {
      const col = i < s.split ? C.blue : C.cyan;
      api.text(
        ctx,
        'ID ' + tokens.filter((_, index) => mask[index])[i],
        x(i),
        465,
        31,
        col,
        'center',
      );
      api.rect(ctx, x(i) - 120, 490, 240, 120, C.panel, col, 8);
      api.text(ctx, String(value), x(i), 578, 67, C.ink, 'center');
    });
    s.parts.forEach((part, i) => {
      const start = i ? s.split : 0;
      const left = x(start) - 120,
        right = x(start + part.length - 1) + 120;
      const color = i ? C.cyan : C.blue;
      drawSlimeBrace(ctx, api, left, right, 655, 'Segment ' + (i ? 'B' : 'A'), color);
      const d = local ? part.length : s.denominator;
      const compute = local ? p(i ? 'local-b' : 'local-a') === 1 : showAmount;
      const result = compute ? ' = ' + sum(part) / d : '';
      api.text(
        ctx,
        `${sum(part)} / ${d}${result}`,
        (left + right) / 2,
        800,
        50,
        local ? C.pink : color,
        'center',
      );
    });
    const message = local
      ? p('local-total') === 1
        ? `Local means add to ${s.wrongIndependent}   /   intended mean ${s.result}`
        : 'Each segment now divides by its own count.'
      : state.beat === 0 && p('predict-share') > 0
        ? 'If A keeps only ID 11, how much will A contribute?'
        : showAmount
          ? `One execution   /   ${s.contributions.join(' + ')} = ${s.result}`
          : 'One execution   /   four fixed loss terms';
    api.text(ctx, message, 960, 923, 40, local ? C.pink : C.yellow, 'center');
    if (p('extra-scale') === 1)
      api.text(
        ctx,
        `Halving the correctly weighted advantages would give ${s.result} / 2 = ${s.wrongHalved}.`,
        960,
        1004,
        29,
        C.muted,
        'center',
      );
  });
}
export default {
  id: 'segments',
  draw: drawSegments,
  cues: [
    'even-shares',
    'predict-share',
    'segments-move-boundary',
    'uneven-shares',
    'local-means',
    'local-a',
    'local-b',
    'local-total',
    'restore-shared',
    'extra-scale',
  ],
};
