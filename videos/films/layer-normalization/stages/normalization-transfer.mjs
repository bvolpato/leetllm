import { ln, mean, rms, variance } from '../arithmetic.mjs';
import { epsilon } from '../fixtures.mjs';
import { normalizationTransfer } from '../model.mjs';
import { text } from '../defaults.mjs';
import { motion, landed } from '../timing.mjs';

export function drawNormalizationTransfer(ctx, scene, state, api) {
  const { C } = api;
  const data = normalizationTransfer();
  const offset = motion(state, 'transfer-offset', 0, 0.46, 0.65);
  const second = offset > 0;
  const center = motion(state, 'head-center', 1, 0.12, 0.22);
  const divide = motion(state, 'head-divide', 1, 0.5, 0.61);
  const connected = landed(state, 'head-compare', 1, 0.65, 0.76);
  const trial = landed(state, 'try-rms', 2, 0.05, 0.16) && !landed(state, 'restore-head', 2, 0.45, 0.59);
  const mode = trial ? 'rms' : landed(state, 'fit-final-norm', 1, 0.01, 0.1) ? 'ln' : 'raw';
  const operation = { raw: 'Direct wire', ln: 'Final LayerNorm', rms: 'Final RMSNorm' }[mode];
  const wireColor = { raw: C.blue, ln: C.green, rms: C.pink }[mode];
  const inputB = data.input.map((v, i) => v + offset * (data.shifted[i] - v));
  text(ctx, api, 'Fixed probe head     ·     logit = first feature of its input', 960, 258, 39, C.ink, 'center');

  text(ctx, api, 'Both runs    ·    gain 1    ·    shift 0    ·    ε = 0.00001', 960, 323, 29, C.muted, 'center');
  const headings = [[320, 'Last residual vector'], [840, operation], [1320, 'Port logit'], [1650, 'Reference logit']];
  headings.forEach(([x, label], i) => {
    const paint = () => text(ctx, api, label, x, 398, 38, i === 1 ? wireColor : C.ink, 'center');
    if (i === 1) api.focus.target('port-operation', paint);
    else paint();
  });
  for (const [i, row] of [data.input, inputB].entries()) {
    if (i && !second) continue;
    const y = 562 + 232 * i;
    const input = () => {
      text(ctx, api, i ? 'Offset input' : 'Original input', 125, y - 67, 28, C.muted);
      row.forEach((v, j) => {
        const x = 165 + j * 109;
        text(ctx, api, Number.isInteger(v) ? String(v) : v.toFixed(1), x, y + 13, 45, j === 0 ? C.yellow : C.ink, 'center');
      });
    };
    if (i) api.focus.target('shifted-input', input);
    else input();

    const reference = ln(row)[0];
    const score = mode === 'raw' ? row[0] : trial ? rms(row)[0] : reference;
    const deliver = mode !== 'ln' || connected;
    api.focus.target('port-operation', () => {
      api.arrow(ctx, 550, y, 642, y, C.muted, 3);
      if (mode === 'raw') {
        api.line(ctx, 670, y, 1020, y, wireColor, 6);
        text(ctx, api, 'read feature 1', 845, y - 34, 30, wireColor, 'center');
      } else {
        const scale = trial ? Math.sqrt(mean(row.map(v => v * v)) + epsilon) : Math.sqrt(variance(row) + epsilon);
        const numerator = trial ? String(row[0]) : `(${row[0]} − ${mean(row)})`;
        const calculation = trial || divide > 0 ? `${numerator} / ${scale.toFixed(3)}` :
          center > 0 ? `${numerator} = ${row[0] - mean(row)}` : 'Find the row mean';
        text(ctx, api, calculation, 845, y + 11, 37, wireColor, 'center');
      }
      api.arrow(ctx, 1055, y, 1160, y, wireColor, 4);
      const mark = trial ? score : mode === 'raw' ? row[0] :
        (row[0] - center * mean(row)) / (1 + divide * (Math.sqrt(variance(row) + epsilon) - 1));
      const axis = v => 692 + (v + 4) * 23;
      const axisY = y + 78;
      api.line(ctx, axis(-4), axisY, axis(13), axisY, C.muted, 2);
      api.line(ctx, axis(0), axisY - 9, axis(0), axisY + 9, C.muted, 2);
      text(ctx, api, '0', axis(0), axisY + 39, 25, C.muted, 'center');
      api.circle(ctx, axis(mark), axisY, 11, C.yellow);

    });
    api.focus.target('port-scores', () =>
      text(ctx, api, deliver ? score.toFixed(3) : '?', 1320, y + 22, 63, wireColor, 'center'));
    text(ctx, api, reference.toFixed(3), 1650, y + 22, 63, C.ink, 'center');
  }
  // Keep the second run addressable during the first frame of its cue.
  if (!second) api.focus.target('shifted-input', () => text(ctx, api, 'Second run   +5 on all four features', 125, 740, 30, C.muted));
  const footer = mode === 'raw'
    ? 'Which operation belongs between the last addition and the head?'
    : mode === 'rms' ? 'RMSNorm divides the uncentered feature in each row.'
    : connected ? 'Both first-feature logits match the checkpoint.' : 'Gold marks follow feature 1 on the same scale.';
  text(ctx, api, footer, 960, 982, 38, mode === 'raw' ? C.yellow : C.ink, 'center');
}
export default { id: 'normalization-transfer', draw: drawNormalizationTransfer, cues: ['transfer-offset', 'fit-final-norm', 'head-center', 'head-divide', 'head-compare', 'try-rms', 'restore-head'] };
