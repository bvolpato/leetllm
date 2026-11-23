import { decodeSupport } from '../arithmetic.mjs';
import { coreText } from '../defaults.mjs';
import { heard, movement } from '../spoken.mjs';

const rows = [
  [0.72, 0.2, 0.05, 0.02, 0.01],
  [0.4, 0.2, 0.15, 0.115, 0.035, ...Array(10).fill(0.01)],
];
const percent = (v) => Number((100 * v).toFixed(1)) + '%';

export function drawAdaptiveSupport(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const topK = heard(state, 'dec-adaptive-k-three', 1, 0.17);
  const topP = [
    heard(state, 'dec-adaptive-peak', 1, 0.48),
    heard(state, 'dec-adaptive-flat', 1, 0.74),
  ];
  const floorLines = movement(state, 'dec-adaptive-floors', 2, 0.2, 0.55);
  const aboveFloor = [
    heard(state, 'dec-adaptive-minp', 2, 0.68),
    heard(state, 'dec-adaptive-minp-flat', 2, 0.84),
  ];

  api.focus.target('dec-adaptive-support-mechanism', () => {
    rows.forEach((row, r) => {
      const baseline = 505 + r * 360;
      const x = 290;
      const step = 90;
      const scale = 300;
      const floor = 0.1 * row[0];
      const rule = beat === 2 ? (aboveFloor[r] ? 'min' : null) : topP[r] ? 'p' : topK ? 'k' : null;
      const threshold = { k: 3, p: 0.9, min: 0.1 }[rule];
      const result = rule && decodeSupport(row, rule, threshold);
      const name = r ? 'Flatter row' : 'Peaked row';
      coreText(ctx, api, name, 115, baseline - 165, 30, C.ink, 'left');

      row.forEach((p, i) => {
        const left = x + i * step;
        const height = p * scale;
        const kept = result?.ids.includes(i);
        api.rect(
          ctx,
          left,
          baseline - height,
          step - 12,
          height,
          kept ? C.cyan : result ? C.muted : C.blue,
          undefined,
          1,
        );
        if (i < 5) coreText(ctx, api, percent(p), left + (step - 12) / 2, baseline + 43, 26, C.ink);
      });
      if (r) {
        const tailX = x + 5 * step;
        const tailEnd = tailX + 10 * step - 12;
        api.line(ctx, tailX, baseline + 24, tailEnd, baseline + 24, C.muted, 2);
        coreText(
          ctx,
          api,
          '10 tokens at 1% each',
          (tailX + tailEnd) / 2,
          baseline + 72,
          29,
          C.muted,
        );
      }

      if (beat === 2 && floorLines > 0) {
        const y = baseline - floor * scale;
        api.line(ctx, x - 12, y, x - 12 + (row.length * step + 8) * floorLines, y, C.yellow, 3);
        if (floorLines === 1)
          coreText(ctx, api, percent(floor) + ' cutoff', x - 28, y + 9, 29, C.yellow, 'right');
      }
      if (result) {
        const method = { k: 'Top-k 3', p: 'Top-p 90%', min: 'Min-p 0.1' }[rule];
        const label = method + ' keeps ' + result.ids.length + ' tokens';
        const details = rule === 'p' ? label + '  ·  ' + percent(result.mass) + ' total' : label;
        coreText(ctx, api, details, 1705, baseline - 178, 34, C.cyan, 'right');
      }
    });
  });
}
export default {
  id: 'adaptive-support',
  draw: drawAdaptiveSupport,
  cues: [
    'dec-adaptive-support-1',
    'dec-adaptive-support-2',
    'dec-adaptive-peak',
    'dec-adaptive-flat',
    'dec-adaptive-k-three',
    'dec-adaptive-support-3',
    'dec-adaptive-floors',
    'dec-adaptive-minp',
    'dec-adaptive-minp-flat',
  ],
};
