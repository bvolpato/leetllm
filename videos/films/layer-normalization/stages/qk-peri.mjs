import { F, ln } from '../arithmetic.mjs';
import { start } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { motion, landed } from '../timing.mjs';

export function drawQkPeri(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 0) {
    const twice = landed(state, 'norm-write', 0, 0.25, 0.39);
    const branch = F(ln(start));
    const write = twice ? ln(branch) : branch;
    const out = start.map((v, i) => v + write[i]);
    const nodes = [['Input', start], ['Norm in', ln(start)], ['Branch F', branch], [twice ? 'Norm out' : 'Write', write], ['Add skip', out]];
    text(ctx, api, 'Same block input    ·    F(z) = 0.2z + 0.1', 960, 285, 36, C.muted, 'center');
    api.path(ctx, [{x: 230, y: 487}, {x: 230, y: 400}, {x: 1690, y: 400}, {x: 1690, y: 487}], {color: C.blue, width: 4});
    text(ctx, api, 'original token', 960, 380, 32, C.blue, 'center');
    nodes.forEach(([label, v], i) => {
      const x = 230 + i * 365;
      const color = i === 3 ? C.green : C.ink;
      api.focus.target(i === 3 ? 'branch-output' : 'branch-stage-' + i, () => {
        text(ctx, api, label, x, 575, 44, color, 'center');
        text(ctx, api, v[0].toFixed(3), x, 720, 51, i === 0 || i === 4 ? C.yellow : color, 'center');
      });
      if (i < 4) api.arrow(ctx, x + 130, 560, x + 240, 560, C.muted, 3);
    });
    text(ctx, api, 'First feature at each step    ·    each norm receives all four features', 960, 912, 37, C.ink, 'center');
    return;
  }
  if (state.beat === 1) {
    const score = 1000 + 800 * motion(state, 'equal-shift', 1, 0.25, 0.38);
    text(ctx, api, 'One query, two visible keys', 960, 325, 42, C.ink, 'center');
    api.focus.target('score-pair', () => {
      [0, 1].forEach(i => {
        const x = 555 + i * 810;
        text(ctx, api, i ? 'Key B score' : 'Key A score', x, 435, 35, C.muted, 'center');
        text(ctx, api, Math.round(score), x, 555, 88, i ? C.pink : C.cyan, 'center');
      });
    });
    api.rect(ctx, 250, 694, 710, 85, C.cyan, undefined, 2);
    api.rect(ctx, 960, 694, 710, 85, C.pink, undefined, 2);
    text(ctx, api, '50%', 605, 860, 50, C.cyan, 'center');
    text(ctx, api, '50%', 1315, 860, 50, C.pink, 'center');
    text(ctx, api, 'Attention probability', 960, 982, 38, C.ink, 'center');
    return;
  }
  const count = Math.floor(4 * motion(state, 'qk-dot-bound', 2, 0.23, 0.4));
  const second = motion(state, 'qk-opposite', 2, 0.57, 0.69);
  const probability = 1 / (1 + Math.exp(-4));
  const heading = (s, x, y) => text(ctx, api, s, x, y, 34, C.muted, 'center');
  text(ctx, api, 'Head width 4    ·    unit RMS    ·    no affine gains', 960, 285, 37, C.ink, 'center');
  heading('Feature products', 820, 390);
  heading('Sum / √4', 1360, 390);
  heading('Score', 1680, 390);
  for (let i = 0; i < 2; i++) {
    const y = 515 + i * 165;
    const k = i === 0 ? 1 : -1;
    const filled = i === 0 ? count : Math.floor(4 * second);
    const color = i ? C.pink : C.cyan;
    api.focus.target(i === 0 ? 'qk-dot' : 'opposite-key', () => {
      text(ctx, api, i ? 'Opposite key' : 'Aligned key', 120, y, 38, color);
      for (let j = 0; j < 4; j++) {
        const x = 495 + j * 212;
        text(ctx, api, i ? '1 × (−1)' : '1 × 1', x, y, 39, j < filled ? color : C.muted, 'center');
      }
      text(ctx, api, filled === 4 ? `${k * 4} / 2` : '?', 1360, y, 45, color, 'center');
      text(ctx, api, filled === 4 ? k * 2 : '?', 1680, y, 54, color, 'center');
    });
  }
  const show = motion(state, 'qk-peaked', 2, 0.72, 0.85) > 0;
  api.focus.target('qk-shares', () => {
    if (show) {
      api.rect(ctx, 230, 823, 1460 * probability, 61, C.cyan, undefined, 2);
      api.rect(ctx, 230 + 1460 * probability, 823, 1460 * (1 - probability), 61, C.pink, undefined, 2);
      text(ctx, api, `Aligned   ${(100 * probability).toFixed(1)}%`, 230, 962, 39, C.cyan);
      text(ctx, api, `Opposite   ${(100 * (1 - probability)).toFixed(1)}%`, 1690, 962, 39, C.pink, 'right');
    } else {
      text(ctx, api, 'Attention probabilities', 960, 920, 38, C.muted, 'center');
    }
  });
}
export default { id: 'qk-peri', draw: drawQkPeri, cues: ['norm-write', 'equal-shift', 'qk-dot-bound', 'qk-opposite', 'qk-peaked'] };
