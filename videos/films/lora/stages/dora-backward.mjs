import { doraRow } from '../model.mjs';
import { cueMotion, resultAfter } from '../construction.mjs';
import { point, num } from '../geometry.mjs';
import { text, line, arrow, circle } from '../defaults.mjs';

const v = [3, 4],
  x = [1, 0],
  magnitude = 5;
const derivative = doraRow(v, magnitude, x);
const pair = (values) => '[' + values.map(num).join(', ') + ']';
const radial = (gradient) => gradient.reduce((total, g, i) => total + g * v[i], 0);

function forwardPicture(ctx, state, api) {
  const { C } = api;
  const stretch =
    cueMotion(state, 'dora-stretch', 0, 0.45, 0.7) *
    (1 - cueMotion(state, 'dora-rewind', 1, 0.67, 0.82));
  const current = v.map((value) => (1 + stretch) * value);
  const row = doraRow(current, magnitude, x);
  const toPlot = ([a, b]) => point(260 + a * 68, 900 - b * 68);
  const origin = toPlot([0, 0]);
  const secondOutput = resultAfter(state, 'dora-same', 1, 0.26);
  api.focus.target('dora-row', () => {
    line(ctx, api, origin, toPlot([7.3, 0]), C.muted, 2);
    line(ctx, api, origin, toPlot([0, 8.9]), C.muted, 2);
    for (const tick of [3, 6]) {
      const p = toPlot([tick, 0]);
      text(ctx, api, String(tick), p.x, p.y + 47, 29, C.muted, 'center');
    }
    arrow(ctx, api, origin, toPlot(current), C.yellow, 8);
    circle(ctx, api, toPlot(v).x, toPlot(v).y, 10, C.cyan);
    text(ctx, api, 'Original tip [3, 4]', 175, 263, 32, C.cyan);
    text(ctx, api, 'Directional row V', 510, 263, 32, C.yellow);
    if (stretch === 1)
      text(ctx, api, '[6, 8]', toPlot(current).x + 25, toPlot(current).y, 34, C.yellow);
  });
  api.focus.target('dora-forward-readout', () => {
    text(ctx, api, 'Learned magnitude  5     Input  [1, 0]', 920, 285, 36, C.ink);
    text(ctx, api, 'Directional row V', 920, 405, 32, C.muted);
    text(ctx, api, pair(current), 920, 478, 59, C.yellow, 'left', 'mono');
    text(ctx, api, 'First coordinate × magnitude / row length', 920, 608, 33, C.muted);
    const canRead = secondOutput || (stretch === 0 && resultAfter(state, 'dora-start', 0, 0.38));
    const equation =
      stretch > 0 && stretch < 1
        ? 'V₁ × 5 / ‖V‖'
        : num(current[0]) + ' × 5 / ' + num(row.norm) + ' = ' + (canRead ? num(row.output) : '?');
    text(ctx, api, equation, 920, 695, 51, C.ink, 'left', 'mono');
    if (secondOutput) text(ctx, api, 'Effective row  ' + pair(row.weight), 920, 832, 41, C.cyan);
  });
}

function backwardPicture(ctx, state, api) {
  const { C } = api;
  const unit = 474;
  const plot = ([a, b]) => point(275 + a * unit, 480 - b * unit);
  const o = plot([0, 0]);
  const direct = derivative.detached;
  const full = derivative.full;
  const step = cueMotion(state, 'dora-subtract', 2, 0.4, 0.66);
  const fullReady = resultAfter(state, 'dora-full', 2, 0.81);
  const detachedReady = resultAfter(state, 'dora-direct', 2, 0.28);
  const endpoint = plot(direct.map((n, i) => n + step * (full[i] - n)));
  api.focus.target('dora-gradients', () => {
    text(ctx, api, 'Derivative at V = [3, 4]', 170, 277, 37, C.ink);
    line(ctx, api, plot([-0.1, 0]), plot([1.17, 0]), C.muted, 2);
    line(ctx, api, plot([0, 0.17]), plot([0, -0.73]), C.muted, 2);
    arrow(ctx, api, o, plot(direct), C.cyan, 6);
    if (step > 0) arrow(ctx, api, plot(direct), endpoint, C.pink, 6);
    if (fullReady) arrow(ctx, api, o, plot(full), C.yellow, 6);
    text(ctx, api, '0', o.x - 20, o.y + 46, 28, C.muted);
    text(ctx, api, '1', plot(direct).x, o.y - 30, 28, C.muted, 'center');
    text(ctx, api, 'Detached denominator', 950, 354, 33, C.cyan);
    text(
      ctx,
      api,
      'mx / n  =  ' + (detachedReady ? pair(direct) : '?'),
      950,
      432,
      48,
      C.cyan,
      'left',
      'mono',
    );
    text(ctx, api, 'Differentiate the denominator too', 950, 552, 33, C.pink);
    text(ctx, api, 'Subtract  m(V·x)V / n³', 950, 620, 40, C.pink);
    text(
      ctx,
      api,
      fullReady ? 'Full gradient  ' + pair(full) : 'Full gradient  ?',
      950,
      731,
      45,
      C.yellow,
    );
  });
  api.focus.target('dora-radial', () => {
    const checked = resultAfter(state, 'dora-radial-check', 3, 0.58);
    if (state.beat < 3) {
      text(
        ctx,
        api,
        'One forward value. Trace each path that contributes a derivative.',
        170,
        941,
        36,
        C.ink,
      );
    } else if (state.beat === 3) {
      text(ctx, api, 'Stretch V along [3, 4] at its starting length', 170, 880, 35, C.ink);
      text(
        ctx,
        api,
        pair(direct) + ' · [3, 4] = ' + (checked ? num(radial(direct)) : '?'),
        170,
        967,
        40,
        C.cyan,
      );
      text(
        ctx,
        api,
        pair(full) + ' · [3, 4] = ' + (checked ? num(radial(full)) : '?'),
        950,
        967,
        40,
        C.yellow,
      );
    } else {
      text(
        ctx,
        api,
        'VL-BART study  ·  magnitude-change / direction-change correlations',
        170,
        875,
        32,
        C.muted,
      );
      text(ctx, api, 'Full tuning  −0.62', 170, 951, 37, C.ink);
      text(ctx, api, 'LoRA  +0.83', 770, 951, 37, C.ink);
      text(ctx, api, 'DoRA  −0.31', 1325, 951, 37, C.ink);
    }
  });
}

export function drawDoraBackward(ctx, scene, state, api) {
  if (state.beat < 2) forwardPicture(ctx, state, api);
  else backwardPicture(ctx, state, api);
}
export default {
  id: 'dora-backward',
  draw: drawDoraBackward,
  cues: [
    'dora-start',
    'dora-stretch',
    'dora-same',
    'dora-rewind',
    'dora-direct',
    'dora-subtract',
    'dora-full',
    'dora-radial-check',
    'dora-study',
  ],
};
