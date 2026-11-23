import { rlvrClipped } from '../arithmetic.mjs';
import { signed, spokenProgress } from '../drawing.mjs';

const samples = [
  { name: 'First response', old: 0.5, current: 0.65, advantage: 1, length: 2 },
  { name: 'Second response', old: 0.5, current: 0.35, advantage: -1, length: 3 },
];
const product = (s) => rlvrClipped(s.current / s.old, s.advantage);
const fmt = (v) => signed(v, 2);

function drawReduction(ctx, api, showLoss) {
  const { C } = api;
  const means = [];
  api.focus.target('token-rows', () => {
    api.text(ctx, 'Selected term at each generated token', 180, 300, 40, C.ink);
    api.text(ctx, 'Response mean', 1520, 300, 33, C.muted, 'center');
    samples.forEach((s, i) => {
      const y = 450 + i * 168;
      const terms = Array.from({ length: s.length }, (_, t) =>
        t === 0 ? product(s).surrogate : s.advantage,
      );
      const mean = terms.reduce((a, b) => a + b, 0) / terms.length;
      means.push(mean);
      api.text(ctx, s.name, 180, y, 34, C.ink);
      for (let t = 0; t < 3; t++) {
        const x = 655 + t * 219;
        const color = t === 0 ? C.yellow : C.muted;
        api.rect(ctx, x - 90, y - 62, 180, 90, C.panel, color, 6);
        api.text(ctx, t < terms.length ? fmt(terms[t]) : 'padding', x, y, 34, color, 'center');
      }
      api.text(ctx, '÷ ' + terms.length, 1295, y, 38, C.cyan, 'center');
      api.text(ctx, fmt(mean), 1520, y, 43, C.ink, 'center');
    });
  });
  api.focus.target('reduced-loss', () => {
    api.text(
      ctx,
      showLoss
        ? 'Reward loss   ≈   −(' +
            means[0].toFixed(3) +
            ' − ' +
            Math.abs(means[1]).toFixed(3) +
            ') / 2   ≈   ' +
            signed(-(means[0] + means[1]) / 2, 4)
        : 'One mean per response',
      960,
      850,
      42,
      C.cyan,
      'center',
    );
  });
}

export function drawTokenSurrogate(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  if (state.beat === 4) {
    drawReduction(ctx, api, p('clip-average', 4, 0.51, 0.75) > 0);
    return;
  }
  const negative = state.beat >= 2;
  const s = samples[Number(negative)],
    terms = product(s);
  const ratio = negative ? p('clip-negative-raw', 2, 0.5, 0.64) : p('clip-ratio', 0, 0.6, 0.75);
  const raw = negative ? ratio : p('clip-raw', 1, 0.18, 0.36);
  const clipped = negative
    ? p('clip-negative-bound', 2, 0.65, 0.86)
    : p('clip-bound', 1, 0.4, 0.58);
  const pick = negative
    ? p('clip-negative-select', 3, 0.02, 0.15)
    : p('clip-select', 1, 0.65, 0.79);
  api.focus.target('token-input', () => {
    api.text(ctx, s.name + '    ·    advantage ' + signed(s.advantage, 0), 175, 277, 43, C.ink);
    api.text(ctx, 'Current / rollout', 175, 371, 31, C.muted);
    api.text(
      ctx,
      s.current.toFixed(2) +
        ' / ' +
        s.old.toFixed(2) +
        ' = ' +
        (ratio > 0 ? terms.ratio.toFixed(2) : '?'),
      570,
      378,
      47,
      C.blue,
    );
    if (state.beat >= 1) api.text(ctx, 'Ratio clip   [0.8, 1.2]', 1220, 376, 37, C.yellow);
  });
  const x = (v) => 1055 + v * 425;
  api.line(ctx, x(-1.55), 655, x(1.55), 655, C.muted, 2);
  [-1.5, -1, -0.5, 0, 0.5, 1, 1.5].forEach((tick) => {
    api.line(ctx, x(tick), 647, x(tick), 666, C.muted, 2);
    api.text(ctx, String(tick).replace('-', '−'), x(tick), 707, 28, C.muted, 'center');
  });
  api.focus.target('raw-product', () => {
    api.text(ctx, 'Raw', 175, 540, 36, C.blue);
    if (raw > 0) {
      const end = x(terms.raw * raw);
      api.line(ctx, x(0), 530, end, 530, C.blue, 7);
      api.circle(ctx, end, 530, 10, C.blue);
      if (raw >= 1) api.text(ctx, fmt(terms.raw), end, 496, 38, C.blue, 'center');
    }
  });
  api.focus.target('clipped-product', () => {
    api.text(ctx, 'Clipped', 175, 605, 36, C.cyan);
    if (clipped > 0) {
      const end = x(terms.alternative * clipped);
      api.line(ctx, x(0), 595, end, 595, C.cyan, 7);
      api.circle(ctx, end, 595, 10, C.cyan);
      if (clipped >= 1) api.text(ctx, fmt(terms.alternative), end, 642, 36, C.cyan, 'center');
    }
  });
  api.focus.target('selected-term', () => {
    const label =
      pick > 0
        ? 'Selected term   ' + fmt(terms.surrogate)
        : clipped >= 1
          ? 'Which product is smaller?'
          : 'Signed product = ratio × advantage';
    api.text(ctx, label, 960, 874, 48, pick > 0 ? C.yellow : C.ink, 'center');
  });
}
export default {
  id: 'token-surrogate',
  draw: drawTokenSurrogate,
  cues: [
    'clip-ratio',
    'clip-raw',
    'clip-bound',
    'clip-select',
    'clip-next',
    'clip-negative-raw',
    'clip-negative-bound',
    'clip-negative-select',
    'clip-reduce',
    'clip-average',
  ],
};
