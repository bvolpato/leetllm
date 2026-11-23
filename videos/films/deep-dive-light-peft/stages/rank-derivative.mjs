import { beatCue } from '../model.mjs';
import { clamp01 } from '../arithmetic.mjs';

const groups = [
  { name: 'A row', products: [2, -2], center: 505 },
  { name: 'Matching B column', products: [1, -1], center: 1415 },
];
const paperScore = groups.reduce((s, g) => s + g.products.reduce((v, p) => v + Math.abs(p), 0), 0);
const codeScore = groups.reduce(
  (s, g) => s + Math.abs(g.products.reduce((v, p) => v + p, 0) / g.products.length),
  0,
);

export function drawRankDerivative(ctx, scene, state, api) {
  const { C } = api;
  const signed = (state.beat ?? 0) > 0;
  const signedMove = beatCue(state, 1, 'lp-code-reduce', 0.1, 0.55);
  const paperMoves = [
    beatCue(state, 0, 'lp-paper-reduce', 0.37, 0.6),
    beatCue(state, 0, 'lp-paper-column', 0.6, 0.76),
  ];
  const answer = signed
    ? beatCue(state, 1, 'lp-code-score', 0.57, 0.72)
    : beatCue(state, 0, 'lp-paper-score', 0.78, 0.95);
  api.focus.target('lp-taylor', () => {
    api.text(
      ctx,
      'Deleting a weight   ·   first-order change in loss',
      960,
      249,
      36,
      C.ink,
      'center',
    );
    api.math(
      ctx,
      String.raw`\Delta w=-w\qquad |\Delta\ell|\approx|w\,\partial\ell/\partial w|`,
      960,
      340,
      43,
      C.yellow,
      'center',
    );
  });
  api.focus.target('lp-rank-reduce', () => {
    for (const [index, { name, products, center }] of groups.entries()) {
      const move = signed ? signedMove : paperMoves[index];
      const [a, b] = products;
      const origin = center - 236,
        unit = 112;
      const firstStep = signed ? 1 : clamp01(move * 2);
      const secondStep = signed ? move : clamp01(move * 2 - 1);
      const first = origin + unit * a * firstStep;
      const final = first + unit * (signed ? b : Math.abs(b)) * secondStep;
      api.text(ctx, name + '    +' + a + '    −' + Math.abs(b), center, 446, 41, C.ink, 'center');
      [0, 1, 2, 3, 4].forEach((v) => {
        const x = origin + unit * v;
        api.line(ctx, x, 518, x, 648, C.muted, 1);
        api.text(ctx, String(v), x, 697, 29, C.muted, 'center');
      });
      if (firstStep > 0) api.arrow(ctx, origin, 547, first, 547, C.cyan, 8);
      if (secondStep > 0) {
        api.line(ctx, first, 550, first, 607, C.cyan, 2);
        api.arrow(ctx, first, 615, final, 615, signed ? C.pink : C.cyan, 8);
      }
      if (move === 1) {
        const line = signed
          ? '|(' + a + ' − ' + Math.abs(b) + ') / 2| = 0'
          : '|' + a + '| + |−' + Math.abs(b) + '| = ' + (a + Math.abs(b));
        api.text(ctx, line, center, 793, 43, C.ink, 'center');
      }
    }
    const method = signed
      ? 'Pinned trainer  ·  add the absolute means'
      : 'Paper  ·  sum the magnitudes';
    api.text(ctx, method, 960, 912, 38, C.blue, 'center');
    if (signed)
      api.text(ctx, 'Paper score = ' + paperScore, groups[0].center, 995, 46, C.blue, 'center');
    const label = signed ? 'Trainer score' : 'Paper score';
    const score = signed ? codeScore : paperScore;
    api.text(
      ctx,
      label + ' = ' + (answer === 1 ? score : '?'),
      signed ? groups[1].center : 960,
      995,
      46,
      C.yellow,
      'center',
    );
  });
}
export default {
  id: 'rank-derivative',
  draw: drawRankDerivative,
  cues: [
    'lp-taylor',
    'lp-paper-reduce',
    'lp-paper-column',
    'lp-paper-score',
    'lp-code-reduce',
    'lp-code-score',
  ],
};
