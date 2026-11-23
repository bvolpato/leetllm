import { documents } from '../fixtures.mjs';
import { rankNetStep } from '../arithmetic.mjs';
import { cueProgress } from '../defaults.mjs';

const features = (id) => {
  const d = documents.find((page) => page.id === id);
  return [d.queryFit, d.reliability];
};
const guide = features('api-guide'),
  blog = features('blog-post');
const forward = rankNetStep(guide, blog);
const reverse = rankNetStep(blog, guide);
const number = (n) => String(Number(n.toFixed(5))).replace('-', '−');
const signed = (n) => (n > 0 ? '+' : '') + number(n);

export function paintPairUpdate(ctx, scene, state, api) {
  const { C } = api;
  const p = (id, beat, start, end) => cueProgress(state, api, id, beat, start, end);
  const beat = state.beat ?? 0;
  const reset = p('pair-reset', 3, 0.01, 0.19);
  const flipped = p('pair-reverse', 3, 0.36, 0.57) > 0;
  const next = flipped ? reverse : forward;
  const backstep = p('pair-backstep', 4, 0.11, 0.4);
  const backgap = p('pair-backgap', 4, 0.43, 0.64);
  const firstGap = p('pair-gap', 2, 0.7, 0.95);
  const displacement = forward.nextGap * firstGap * (1 - reset) - reverse.nextGap * backgap;
  const label = (v, x, y, size, color, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);

  label('Page features', 125, 256, 39, C.ink);
  label('Query fit', 530, 340, 31, C.muted, 'center');
  label('Reliability', 762, 340, 31, C.muted, 'center');
  for (const [i, [name, vals, color]] of [
    ['API guide', guide, C.cyan],
    ['general blog', blog, C.pink],
  ].entries()) {
    const y = 422 + 90 * i;
    label(name, 125, y, 42, color);
    vals.forEach((v, j) => label(v.toFixed(2), 530 + 232 * j, y, 42, color, 'center'));
  }

  api.focus.target('pair-calculation', () => {
    label('Training label', 1020, 256, 31, C.muted);
    label(flipped ? 'blog  >  guide' : 'guide  >  blog', 1020, 325, 49, flipped ? C.pink : C.cyan);
    if (beat === 0) {
      api.math(ctx, String.raw`p=1/(1+e^{-\Delta})\quad L=-\log p`, 1020, 432, 41, C.ink, 'left');
      label('Δ = preferred score − other score', 1020, 520, 32, C.muted);
      label(
        p('pair-half', 0, 0.77, 0.98) > 0 ? 'At a tie:  p − 1 = −0.5' : 'At a tie:  p = 0.5',
        1020,
        621,
        39,
        C.yellow,
      );
      return;
    }
    const showDifference = p('pair-difference', 1, 0.06, 0.29) > 0 && (reset === 0 || flipped);
    const showGradient = reset === 0 ? p('pair-gradient', 1, 0.57, 0.79) > 0 : backstep > 0;
    const showWeights = reset === 0 ? p('pair-step', 2, 0.02, 0.21) > 0 : backgap > 0;
    const rows = [
      ['Feature difference', showDifference ? next.difference : null],
      ['Weight gradient', showGradient ? next.gradient : null],
      ['Weights', showWeights ? next.next : [0, 0]],
    ];
    label('Fit', 1490, 373, 26, C.muted, 'center');
    label('Reliability', 1705, 373, 26, C.muted, 'center');
    rows.forEach(([name, vals], i) => {
      const y = 440 + 83 * i;
      label(name, 1020, y, 32, C.muted);
      for (const [j, x] of [1490, 1705].entries())
        label(vals ? signed(vals[j]) : '?', x, y, 38, i === 2 ? C.green : C.ink, 'center');
    });
    if (showWeights) {
      const deltas = forward.difference;
      label(
        'Guide − blog  =  (' +
          number(next.next[0]) +
          ' × ' +
          number(deltas[0]) +
          ') + (' +
          number(next.next[1]) +
          ' × ' +
          number(deltas[1]) +
          ')',
        125,
        678,
        35,
        C.ink,
      );
    }
  });
  api.focus.target('pair-ruler', () => {
    const x = (v) => 960 + v * 6000;
    const y = 845;
    label('Guide score minus blog score', 960, 770, 36, C.ink, 'center');
    api.line(ctx, x(-0.12), y, x(0.12), y, C.muted, 3);
    for (const v of [-0.1, -0.05, 0, 0.05, 0.1]) {
      api.line(ctx, x(v), y - 12, x(v), y + 15, C.muted, 3);
      label(signed(v), x(v), y + 58, 28, C.muted, 'center');
    }
    const color = displacement < 0 ? C.pink : displacement > 0 ? C.cyan : C.yellow;
    api.line(ctx, x(0), y, x(displacement), y, color, 6);
    api.circle(ctx, x(displacement), y, 14, color, C.bg, 2);
    label('Blog leads', x(-0.12), 991, 34, C.pink);
    label('Guide leads', x(0.12), 991, 34, C.cyan, 'right');
    const value = Math.abs(displacement) < 1e-8 ? 'Tie' : signed(displacement);
    label(
      beat === 3 && flipped ? 'Which way from zero?' : value,
      960,
      991,
      43,
      beat === 3 ? C.yellow : color,
      'center',
    );
  });
}
export default {
  id: 'pair-update',
  draw: paintPairUpdate,
  cues: [
    'pair-half',
    'pair-difference',
    'pair-gradient',
    'pair-step',
    'pair-gap',
    'pair-reset',
    'pair-reverse',
    'pair-backstep',
    'pair-backgap',
  ],
};
