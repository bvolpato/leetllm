import { withPretrainingMainFrame } from '../defaults.mjs';

const sets = [
  [1, 2, 3, 4],
  [1, 2, 3, 4, 5, 6],
  [3, 4, 5, 6],
];
const union = [...new Set(sets.flat())];
const probability = (similarity) => 1 - (1 - similarity ** 4) ** 8;

function graph(ctx, api, extent) {
  const { C } = api;
  const x = 964,
    y = 799,
    width = 715,
    height = 395;
  api.text(ctx, 'Chance of a candidate', x, y - height - 68, 36, C.ink);
  api.line(ctx, x, y, x + width, y, C.muted, 3);
  api.line(ctx, x, y, x, y - height, C.muted, 3);
  api.text(ctx, '100%', x - 15, y - height + 8, 27, C.muted, 'right');
  for (let i = 1; i <= Math.floor(extent * 80); i++) {
    const a = (i - 1) / 80,
      b = i / 80;
    api.line(
      ctx,
      x + width * a,
      y - probability(a) * height,
      x + width * b,
      y - probability(b) * height,
      C.cyan,
      5,
    );
  }
  for (const s of [0.25, 0.5, 0.75]) {
    const xx = x + s * width,
      yy = y - probability(s) * height;
    api.text(ctx, s.toFixed(2), xx, y + 48, 29, C.muted, 'center');
    if (extent >= s) {
      api.circle(ctx, xx, yy, 8, C.yellow);
      api.text(
        ctx,
        (100 * probability(s)).toFixed(1) + '%',
        xx - 6,
        yy - 26,
        29,
        C.yellow,
        'right',
      );
    }
  }
  api.text(ctx, 'Shingle similarity', x + width / 2, y + 110, 31, C.ink, 'center');
}

export function paintPretrainingMainLshChain(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  if (b === 0) {
    api.text(ctx, 'One band needs four matching rows', 140, 310, 35, C.ink);
    for (let band = 0; band < 8; band++) {
      const x = 155 + (band % 4) * 168,
        y = 385 + Math.floor(band / 4) * 90;
      api.rect(ctx, x, y, 148, 53, C.panel, C.muted, 6);
      for (let row = 0; row < 4; row++) api.circle(ctx, x + 25 + row * 33, y + 27, 8, C.blue);
    }
    if (beg('formula')) {
      api.text(ctx, 'One band matches with probability s⁴.', 145, 663, 32, C.blue);
      api.text(ctx, 'All eight miss with probability (1 − s⁴)⁸.', 145, 737, 32, C.blue);
      api.math(ctx, '1-(1-s^r)^b', 470, 876, 55, C.yellow, 'center');
    }
    graph(ctx, api, P('curve'));
    api.text(ctx, 'Assume independent ideal MinHash rows.', 960, 1007, 31, C.muted, 'center');
    return;
  }
  const centers = [375, 960, 1545],
    cardW = 402,
    y = 454;
  api.text(ctx, 'Verified edges require Jaccard ≥ 0.60', 155, 275, 36, C.ink);
  api.text(ctx, 'Keep the first ID in each connected group', 1765, 275, 33, C.muted, 'right');
  sets.forEach((members, i) => {
    const x = centers[i];
    const dim = D('component') && i > 0;
    const col = dim ? C.muted : i === 0 ? C.blue : C.cyan;
    api.rect(ctx, x - cardW / 2, y - 88, cardW, 213, C.panel, col, 12);
    api.text(ctx, String.fromCharCode(65 + i), x, y - 20, 59, col, 'center');
    union.forEach((n, j) => {
      const cell = x - 164 + 55 * j;
      const present = members.includes(n);
      api.rect(ctx, cell, y + 26, 47, 56, present ? col : C.bg, undefined, 4);
      if (present) api.text(ctx, String(n), cell + 23.5, y + 67, 32, C.bg, 'center');
    });
    if (D('component')) api.text(ctx, i === 0 ? 'Retain' : 'Remove', x, y + 190, 35, col, 'center');
  });
  if (D('pass')) {
    for (let i = 0; i < 2; i++) {
      const start = centers[i] + cardW / 2,
        end = centers[i + 1] - cardW / 2;
      api.line(ctx, start, y, end, y, C.green, 5);
      api.text(ctx, '2/3 ≥ .6', (start + end) / 2, y - 25, 29, C.green, 'center');
    }
  }
  if (D('fail'))
    api.text(ctx, 'A and C share 2 of 6. No direct edge.', 960, 763, 40, C.ink, 'center');
  if (beg('question')) {
    const kept = D('component');
    api.text(ctx, kept ? 'Retained in A' : 'Group inventory', 580, 857, 32, C.ink, 'right');
    union.forEach((value, i) => {
      const x = 630 + i * 105,
        present = !kept || sets[0].includes(value);
      api.rect(ctx, x, 804, 90, 73, present ? C.blue : C.panel, present ? C.blue : C.muted, 5);
      api.text(ctx, String(value), x + 45, 856, 38, present ? C.bg : C.muted, 'center');
      if (!present) api.line(ctx, x + 62, 820, x + 80, 820, C.pink, 4);
    });
  }
  let prompt = 'Each numbered tile represents one distinct shingle.';
  if (beg('question')) prompt = 'Which shingles will disappear from the retained group?';
  if (D('component')) prompt = 'Only the removed records contained shingles 5 and 6.';
  if (D('recipe')) prompt = 'FineWeb linked band matches directly, using 14 bands of 8 rows.';
  api.text(ctx, prompt, 960, 982, 37, D('component') ? C.yellow : C.ink, 'center');
}
export function drawLshChainStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainLshChain);
}
export default {
  id: 'lsh-chain',
  draw: drawLshChainStage,
  cues: [
    'pt-lsh-chain-formula',
    'pt-lsh-chain-curve',
    'pt-lsh-chain-pass',
    'pt-lsh-chain-fail',
    'pt-lsh-chain-question',
    'pt-lsh-chain-component',
    'pt-lsh-chain-recipe',
  ],
};
