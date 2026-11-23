import { STATUS_ROW, STATUS_IDS } from '../fixtures.mjs';
import { decodeSoftmax } from '../arithmetic.mjs';
import { coreText } from '../defaults.mjs';
import { heard, movement } from '../spoken.mjs';

const baseLogits = STATUS_ROW.map(Math.log);
const tailCount = STATUS_ROW.length - 4;
const groupFirst = [...STATUS_ROW.slice(0, 4), STATUS_ROW.slice(4).reduce((a, b) => a + b, 0)];
const entropy = (T) =>
  -decodeSoftmax(baseLogits, T).reduce((total, p) => total + p * Math.log2(p), 0);
const percent = (p) => (p * 100).toFixed(p < 0.0001 ? 4 : 2) + '%';

export function drawTemperatureTail(ctx, scene, state, api) {
  const b = state.beat ?? 0;
  const cold = movement(state, 'dec-tail-cold', 1, 0.05, 0.28);
  const hot = movement(state, 'dec-tail-hot', 1, 0.36, 0.61);
  const T = Math.round((1 - 0.7 * cold + 1.2 * hot) * 100) / 100;
  const row = decodeSoftmax(baseLogits, T);
  const tail = row.slice(4).reduce((sum, v) => sum + v, 0);
  const pooled = heard(state, 'dec-tail-total', 1, 0.85);
  const comparison = heard(state, 'dec-tail-wrong', 2, 0.65);
  const { C } = api;
  api.focus.target('temperature-tail-mass', () => {
    coreText(ctx, api, 'The canary status is …', 135, 265, 45, C.ink, 'left');
    coreText(ctx, api, 'Temperature   ' + T.toFixed(2), 1760, 265, 39, C.yellow, 'right');
    const names = [...STATUS_IDS.slice(0, 4), 'eight others'];
    [...row.slice(0, 4), tail].forEach((p, i) => {
      const y = 405 + i * 112;
      coreText(ctx, api, names[i], 135, y, 37, i === 4 ? C.cyan : C.ink, 'left');
      const canSum = i < 4 || b === 0 || pooled;
      const width = 680 * p;
      if (canSum) {
        api.rect(ctx, 385, y - 31, width, 40, i === 4 ? C.cyan : C.blue, undefined, 0);
        if (i === 4 && width / tailCount >= 6) {
          for (let j = 1; j < tailCount; j++) {
            const x = 385 + (width * j) / tailCount;
            api.line(ctx, x, y - 31, x, y + 9, C.bg, 3);
          }
        }
      }
      coreText(
        ctx,
        api,
        canSum ? percent(p) : 'sum?',
        1110,
        y,
        33,
        i === 4 ? C.cyan : C.ink,
        'right',
      );
    });
    if (b < 2) {
      coreText(ctx, api, 'Eight individual tail tokens', 1488, 366, 37, C.cyan);
      row.slice(4).forEach((p, i) => {
        const x = 1208 + (i % 4) * 144,
          y = 421 + Math.floor(i / 4) * 133;
        api.rect(ctx, x, y, 130, 111, C.panel, C.cyan, 5);
        coreText(ctx, api, 'ID ' + (i + 4), x + 65, y + 37, 27, C.muted);
        coreText(ctx, api, percent(p), x + 65, y + 83, 24, C.ink);
      });
      coreText(
        ctx,
        api,
        pooled ? 'Tail display total = ' + percent(tail) : 'Scale each token, then add.',
        1492,
        783,
        33,
        C.cyan,
      );
      coreText(
        ctx,
        api,
        'Each weight = p raised to 1/T. Divide by the sum of all twelve weights.',
        960,
        996,
        33,
        C.ink,
      );
    } else {
      const wrong = decodeSoftmax(groupFirst.map(Math.log), T).at(-1);
      coreText(ctx, api, 'If the eight were merged first', 1200, 430, 34, C.ink, 'left');
      coreText(ctx, api, 'One input of 8%', 1200, 522, 35, C.muted, 'left');
      if (comparison)
        coreText(ctx, api, 'One output of ' + percent(wrong), 1200, 610, 38, C.pink, 'left');
      coreText(ctx, api, 'Actual tail  ' + percent(tail), 1200, 752, 40, C.cyan, 'left');
      coreText(ctx, api, 'Entropy of 12 tokens', 145, 1000, 32, C.ink, 'left');
      [0.3, 1, 1.5].forEach((temp, i) =>
        coreText(
          ctx,
          api,
          'T ' + temp + '    ' + entropy(temp).toFixed(2) + ' bits',
          650 + i * 410,
          1000,
          31,
          C.muted,
        ),
      );
    }
  });
}
export default {
  id: 'temperature-tail',
  draw: drawTemperatureTail,
  cues: ['dec-tail-inputs', 'dec-tail-cold', 'dec-tail-hot', 'dec-tail-total', 'dec-tail-wrong'],
};
