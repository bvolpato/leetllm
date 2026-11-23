import { mean } from '../arithmetic.mjs';
import { x } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { motion } from '../timing.mjs';

export function drawCenter(ctx, scene, state, api) {
  const { C } = api;
  const offset = 3 * motion(state, 'center-offset', 2, 0.03, 0.22);
  const subtract = mean(x) * motion(state, 'center-subtract', 0, 0.42, 0.60) +
    3 * motion(state, 'center-again', 2, 0.36, 0.5);
  const input = x.map(v => v + offset);
  const values = input.map(v => v - subtract);
  const toX = value => 690 + value * 113;
  text(ctx, api, 'One token', 120, 282, 38, C.ink);
  text(ctx, api, 'Input', 290, 372, 30, C.muted, 'center');
  api.focus.target('input-feature-mean', () =>
    text(ctx, api, `Input mean    ${Number(mean(input).toFixed(2))}`, 995, 286, 42, C.yellow, 'center'));
  api.focus.target('centered-feature-pattern', () => {
    for (let i = 0; i < values.length; i++) {
      const y = 443 + i * 104;
      const color = i === 0 ? C.yellow : C.cyan;
      text(ctx, api, `f${i + 1}`, 118, y + 12, 31, C.muted);
      text(ctx, api, Number(input[i].toFixed(1)), 290, y + 12, 40, C.ink, 'center');
      api.line(ctx, toX(-3), y, toX(8), y, C.muted, 1);
      const currentX = toX(values[i]);
      if (subtract > 0) {
        api.circle(ctx, toX(input[i]), y, 10, C.bg, C.muted, 2);
        api.line(ctx, toX(input[i]), y, currentX, y, color, 4);
      }
      api.circle(ctx, currentX, y, 13, color);
      text(ctx, api, Number(values[i].toFixed(2)), currentX, y - 25, 32, color, 'center');
    }
    for (const value of [-3, 0, 3, 6, 8])
      text(ctx, api, value, toX(value), 849, 32, C.muted, 'center');
  });
  text(ctx, api, `Amount subtracted   ${Number(subtract.toFixed(2))}          Current mean   ${Number(mean(values).toFixed(2))}`, 960, 960, 38, C.ink, 'center');
}

export default { id: 'center', draw: drawCenter, cues: ['center-subtract', 'center-offset', 'center-again'] };
