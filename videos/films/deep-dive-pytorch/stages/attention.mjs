import { cueFraction } from '../cues.mjs';

const keys = [
  [1, 0],
  [0, 1],
];
const query = [1, 0],
  values = [
    [10, 0],
    [0, 20],
  ];
const dots = keys.map((key) => key.reduce((s, k, i) => s + k * query[i], 0));
const scores = dots.map((dot) => dot / Math.sqrt(query.length));
function mixture(keepSecond) {
  const weights = scores.map((s, i) => (i === 0 || keepSecond ? Math.exp(s - scores[0]) : 0));
  const total = weights[0] + weights[1];
  const p = weights.map((w) => w / total);
  return { p, out: query.map((_, j) => p.reduce((n, w, i) => n + w * values[i][j], 0)) };
}
const open = mixture(true),
  firstOnly = mixture(false);

export function drawAttention(ctx, scene, state, api) {
  const { C } = api;
  const step = (id, beat, a, b) => cueFraction(state, id, beat, a, b);
  const rightOpen = !(
    step('block-second', 1, 0.2, 0.4) > 0 && step('attention-cached-position', 3, 0, 0.12) === 0
  );
  const mix = rightOpen ? open : firstOnly;
  const sharesReady = step('mix-shares', 0, 0.5, 0.65) > 0;
  const recomputing = state.beat === 1 && !rightOpen && step('remix-one', 1, 0.4, 0.58) === 0;
  const requested = step('cached-question', 2, 0.58, 0.78);
  const bothCached = state.beat >= 3 && rightOpen;
  api.focus.target('key-strip', () => {
    api.text(ctx, 'Query   [1, 0]', 110, state.beat >= 2 ? 218 : 258, 43, C.ink);
    if (state.beat >= 2) {
      const qx = 325 + requested * 465;
      api.text(ctx, 'Query position', qx, 269, 33, C.yellow, 'center');
      api.path(
        ctx,
        [
          { x: qx - 13, y: 285 },
          { x: qx + 13, y: 285 },
          { x: qx, y: 312 },
        ],
        { closed: true, fill: C.yellow, width: 0 },
      );
    }
    for (const [i, key] of keys.entries()) {
      const x = 110 + i * 465,
        enabled = !i || rightOpen;
      const color = i === 0 ? C.blue : C.pink;
      api.rect(ctx, x, 326, 430, 210, C.panel, enabled ? color : C.muted, 8);
      api.text(
        ctx,
        'Key ' + i + '    [' + key.join(', ') + ']',
        x + 22,
        384,
        42,
        enabled ? color : C.muted,
      );
      api.text(ctx, 'Value    [' + values[i].join(', ') + ']', x + 22, 445, 37, C.ink);
      const dotsIn = step('dot-pair', 0, 0.21, 0.37) > 0;
      const scaleIn = step('scale-pair', 0, 0.38, 0.5) > 0;
      if (dotsIn)
        api.text(
          ctx,
          'q · k = ' + dots[i] + (scaleIn ? '     ÷ √2 = ' + scores[i].toFixed(3) : ''),
          x + 22,
          505,
          30,
          C.muted,
        );
      api.text(
        ctx,
        enabled ? 'True   •   pass' : 'False   ×   block',
        x + 215,
        599,
        35,
        enabled ? color : C.muted,
        'center',
      );
    }
    if (state.beat >= 2)
      api.text(
        ctx,
        bothCached ? 'Mask for cached position 1' : 'Call under test: upper-left causal',
        560,
        654,
        30,
        C.yellow,
        'center',
      );
  });
  api.focus.target('share', () => {
    const x = 115,
      y = 763,
      w = 885,
      h = 53;
    api.text(ctx, 'Attention weight', x, y - 28, 35, C.ink);
    api.rect(ctx, x, y, w, h, C.panel, C.muted, 4);
    if (sharesReady && !recomputing) {
      api.rect(ctx, x, y, w * mix.p[0], h, C.blue, undefined, 2);
      if (mix.p[1] > 0) api.rect(ctx, x + w * mix.p[0], y, w * mix.p[1], h, C.pink, undefined, 2);
      api.text(ctx, 'Key 0    ' + mix.p[0].toFixed(4), x, 878, 38, C.blue);
      api.text(ctx, 'Key 1    ' + mix.p[1].toFixed(4), x + w, 878, 38, C.pink, 'right');
    }
    if (state.beat === 2)
      api.text(
        ctx,
        'Earlier, both open:   ' + open.p.map((v) => v.toFixed(4)).join('   /   '),
        x,
        986,
        31,
        C.muted,
      );
  });
  api.focus.target('vector', () => {
    const x = 1170,
      y = 775,
      scale = 51;
    api.text(ctx, 'Weighted output', 1470, 258, 44, C.ink, 'center');
    api.line(ctx, x, y, x + 562, y, C.muted, 3);
    api.line(ctx, x, y, x, y - 437, C.muted, 3);
    api.text(ctx, '0', x - 14, y + 39, 29, C.muted, 'right');
    api.text(ctx, '10', x + 10 * scale, y + 43, 29, C.muted, 'center');
    api.text(ctx, '5', x - 17, y - 5 * scale + 9, 29, C.muted, 'right');
    api.line(ctx, x - 8, y - 5 * scale, x + 8, y - 5 * scale, C.muted, 2);
    api.text(ctx, 'Output coordinate 1', x + 5 * scale, y + 56, 27, C.muted, 'center');
    api.text(ctx, 'Output coordinate 2', x, y - 454, 27, C.muted);
    const changeMask = state.beat === 1 && !rightOpen;
    const horizontal = step('horizontal-value', 0, 0.62, 0.72);
    const vertical = step('vertical-value', 0, 0.73, 0.82);
    const [vx, vy] = mix.out;
    let dx = vx * scale * horizontal,
      dy = vy * scale * vertical;
    let settled = horizontal >= 1 && vertical >= 1;
    if (changeMask || bothCached) {
      const previous = changeMask ? open : firstOnly;
      const progress = changeMask
        ? step('axis-output', 1, 0.53, 0.7)
        : step('cached-mix', 3, 0.12, 0.28);
      const [oldX, oldY] = previous.out;
      const markX = x + oldX * scale,
        markY = y - oldY * scale;
      api.circle(ctx, markX, markY, 13, C.bg, C.muted, 3);
      api.text(ctx, 'Previous', markX + 22, markY - 19, 26, C.muted);
      dx = (oldX + (vx - oldX) * progress) * scale;
      dy = (oldY + (vy - oldY) * progress) * scale;
      settled = progress >= 1;
    }
    if (dx > 2) api.arrow(ctx, x, y, x + dx, y, C.blue, 8);
    if (dy > 2) api.arrow(ctx, x + dx, y, x + dx, y - dy, C.pink, 8);
    if (settled) {
      api.circle(ctx, x + dx, y - dy, 11, C.yellow);
      api.text(
        ctx,
        '[' + mix.out.map((n) => n.toFixed(3)).join(',  ') + ']',
        1460,
        925,
        56,
        C.yellow,
        'center',
      );
    }
    if (state.beat === 2 && requested > 0)
      api.text(ctx, 'Which keys can position 1 read?', 1460, 995, 30, C.ink, 'center');
  });
}
export default {
  id: 'attention',
  draw: drawAttention,
  cues: [
    'dot-pair',
    'scale-pair',
    'mix-shares',
    'mix-vectors',
    'horizontal-value',
    'vertical-value',
    'block-second',
    'remix-one',
    'axis-output',
    'cached-question',
    'attention-cached-position',
    'cached-mix',
  ],
};
