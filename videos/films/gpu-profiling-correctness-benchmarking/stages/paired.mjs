import { spoken } from '../arithmetic.mjs';
import { pairedRounds } from '../fixtures.mjs';
import { interpolatedQuantile } from '../model.mjs';

export function drawPaired(ctx, scene, state, api) {
  const { C, text, rect, line, circle } = api;
  api.focus.target('paired-rounds', () => {
    text(ctx, 'Synthetic event intervals   /   µs', 145, 252, 35, C.ink);
    const left = 445, dx = 176;
    ['A', 'B', 'B', 'A'].forEach((arm, i) => text(ctx, arm, left + i * dx, 360, 42, arm === 'A' ? C.blue : C.cyan, 'center'));
    text(ctx, 'A median', 1190, 353, 32, C.blue, 'center');
    text(ctx, 'B median', 1470, 353, 32, C.cyan, 'center');
    text(ctx, 'A / B', 1730, 353, 32, C.ink, 'center');
    const ratios = [];
    pairedRounds.forEach((round, r) => {
      const y = 465 + r * 175;
      const acquired = spoken(state, r === 0 ? 'first-round' : 'next-round', r);
      const visible = Math.floor(4 * acquired);
      const result = spoken(state, r === 0 ? 'first-ratio' : 'next-ratio', r === 0 ? 0 : 2) > 0;
      text(ctx, 'Round ' + (r + 1), 145, y + 19, 37, C.ink);
      round.forEach(([arm, time], i) => {
        const color = arm === 'A' ? C.blue : C.cyan;
        rect(ctx, left + dx * i - 64, y - 44, 128, 87, C.panel, i < visible ? color : C.muted, 2);
        if (i < visible) text(ctx, String(time), left + dx * i, y + 18, 43, color, 'center');
      });
      if (visible < 4) return;
      const median = (arm) => interpolatedQuantile(round.filter(([name]) => name === arm).map(([, us]) => us), 0.5).value;
      const a = median('A'), b = median('B');
      text(ctx, String(a), 1190, y + 18, 46, C.blue, 'center');
      text(ctx, String(b), 1470, y + 18, 46, C.cyan, 'center');
      text(ctx, result ? (a / b).toFixed(1) + '×' : '?', 1730, y + 18, 47, result ? C.ink : C.yellow, 'center');
      if (result) ratios.push(a / b);
    });
    const x = (ratio) => 440 + (ratio - 0.8) * 2140;
    line(ctx, x(0.8), 829, x(1.3), 829, C.muted, 3);
    line(ctx, x(1), 772, x(1), 875, C.yellow, 3);
    text(ctx, '1×  tie', x(1), 926, 31, C.yellow, 'center');
    ratios.forEach((ratio, i) => {
      circle(ctx, x(ratio), 829, 14, i ? C.pink : C.green);
      text(ctx, 'Round ' + (i + 1), x(ratio), 793, 30, i ? C.pink : C.green, 'center');
    });
  });
}
export default { id: 'paired', draw: drawPaired, cues: ['first-round', 'first-ratio', 'next-round', 'next-ratio'] };
