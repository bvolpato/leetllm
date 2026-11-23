import { expectedYield } from '../arithmetic.mjs';
import { heard, movement } from '../construction.mjs';

export function drawCost(ctx, scene, state, api) {
  const { C } = api;
  const depth = 5, alpha = 0.8, drafting = 0.1 * depth;
  const yieldValue = expectedYield(alpha, depth);
  const flat = 1, longer = flat + 0.05 * depth;
  const text = (s, x, y, z, color = C.ink, align = 'left') => api.text(ctx, s, x, y, z, color, align);
  if (state.beat === 4) {
    api.focus.target('timing-runs', () => {
      text('Same costs per guess   ·   same 80% conditional acceptance', 145, 270, 39, C.ink);
      for (const [i, k] of [5, 10].entries()) {
        const y = 434 + 257 * i;
        const draft = 0.1 * k, verify = 1 + 0.05 * k;
        const yieldK = expectedYield(alpha, k);
        text(k + ' guesses', 145, y + 42, 42, C.ink);
        api.rect(ctx, 448, y, draft * 390, 59, C.cyan, undefined, 2);
        api.rect(ctx, 448 + draft * 390, y, verify * 390, 59, C.blue, undefined, 2);
        text('Draft ' + draft.toFixed(2), 448, y + 122, 32, C.cyan);
        text('Verify ' + verify.toFixed(2), 448 + draft * 390, y + 122, 32, C.blue);
        if (i === 0 || heard(state, 4, 'longer-yield', 0.60))
          text(yieldK.toFixed(2) + ' tokens', 1780, y + 38, 38, C.ink, 'right');
        if (i === 0 || heard(state, 4, 'depth-result', 0.85))
          text((yieldK / (draft + verify)).toFixed(2) + '×', 1780, y + 120, 49, C.yellow, 'right');
      }
      text('Time in ordinary target steps', 145, 996, 32, C.muted);
    });
    return;
  }
  const yieldReady = heard(state, 0, 'yield-value', 0.93);
  api.focus.target('cost-yield', () => {
    text('5 draft guesses   ·   80% acceptance at each reached test', 145, 265, 36, C.cyan);
    const progress = movement(state, 0, 'yield-terms', 0.40, 0.72);
    let x = 150;
    for (let i = 0; i <= depth; i++) {
      const width = alpha ** i * 240;
      if (i === 0 || progress >= i / depth) {
        api.rect(ctx, x, 319, width, 48, i === 0 ? C.yellow : C.cyan, undefined, 2);
        text(['1', '0.8', '0.8²', '0.8³', '0.8⁴', '0.8⁵'][i], x + width / 2, 354, 28, C.bg, 'center');
      }
      x += width + 6;
    }
    text('1 bonus or correction', 150, 421, 28, C.yellow);
    text('Accepted prefix', 460, 421, 28, C.cyan);
    if (yieldReady) text(yieldValue.toFixed(2) + ' tokens / round', 1735, 367, 46, C.ink, 'right');
  });
  if ((state.beat ?? 0) === 0) return;
  api.focus.target('timing-runs', () => {
    const left = 410, unit = 550;
    const draft = movement(state, 1, 'draft-time', 0.22, 0.40);
    const verify = movement(state, 1, 'flat-time', 0.50, 0.67);
    const change = movement(state, 2, 'longer-verify', 0.10, 0.43);
    const flatReady = heard(state, 1, 'flat-speed', 0.92);
    const slowReady = heard(state, 3, 'slow-speed', 0.12);
    for (const [i, row] of [flat, longer].entries()) {
      if (i === 1 && (state.beat ?? 0) < 2) continue;
      const y = 578 + i * 230;
      text(i ? 'Longer pass' : 'First pass', 145, y + 51, 39);
      const v = i ? flat + (row - flat) * change : flat * verify;
      if (draft > 0) api.rect(ctx, left, y, unit * drafting * draft, 58, C.cyan, undefined, 3);
      if (v > 0) api.rect(ctx, left + drafting * unit, y, v * unit, 58, C.blue, undefined, 3);
      if (draft >= 1) text('Draft ' + drafting.toFixed(2), left, y + 119, 33, C.cyan);
      if (i ? change >= 1 : verify >= 1)
        text('Verify ' + row.toFixed(2), left + drafting * unit + 24, y + 119, 33, C.blue);
      if (i ? slowReady : flatReady)
        text((yieldValue / (drafting + row)).toFixed(2) + '×', 1765, y + 58, 62, C.yellow, 'right');
      else if (i) text('?', 1765, y + 58, 62, C.yellow, 'right');
    }
    text('Time in ordinary target steps', 145, 1004, 31, C.muted);
    if (heard(state, 2, 'longer-verify', 0.43))
      text(yieldValue.toFixed(2) + ' ÷ ' + (drafting + longer).toFixed(2) + ' = ' +
        (slowReady ? (yieldValue / (drafting + longer)).toFixed(2) + '×' : '?'), 1765, 1004, 35, C.ink, 'right');
  });
}
export default {
  id: 'cost', draw: drawCost,
  cues: ['yield-terms', 'yield-value', 'draft-time', 'flat-time', 'flat-speed', 'longer-verify',
    'speed-question', 'slow-speed', 'measure-round', 'depth-ten', 'longer-yield', 'depth-result'],
};
