import { CALIBRATION, QUANT_WEIGHTS } from '../fixtures.mjs';
import { gptqFrame, squaredOutputError } from '../arithmetic.mjs';
import { spokenProgress, spokenResult } from '../construction.mjs';
import { drawPair, drawOutputRows, outputOn } from '../output-rulers.mjs';

const inputs = CALIBRATION[0].map((_, column) => CALIBRATION.map((row) => row[column]));
const closest = QUANT_WEIGHTS.map(Math.round);

export function drawGptq(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const { C } = api;
  const round = spokenProgress(state, 'nearest-rounding', 0, 0.45, 0.68);
  const first = spokenProgress(state, 'round-first-weight', 1, 0.08, 0.28);
  const shift = spokenProgress(state, 'compensate-free-weight', 2, 0.02, 0.3);
  const last = spokenProgress(state, 'round-adjusted-weight', 3, 0.01, 0.18);
  const [nearest, working] = gptqFrame({ nearest: round, first, compensation: shift, last });
  const scored = spokenResult(state, 'compare-output-errors', 3, 0.54, 0.78);

  api.focus.target('weight-pairs', () => {
    drawPair(ctx, api, 'Source weights', QUANT_WEIGHTS, 120, C.ink);
    if (round > 0) drawPair(ctx, api, 'Round separately', nearest.weights, 685, C.blue);
    if (beat >= 1)
      drawPair(
        ctx,
        api,
        last === 1 ? 'Both codes fixed' : 'Round in sequence',
        working.weights,
        1295,
        C.cyan,
      );
  });
  api.focus.target('calibration-outputs', () =>
    drawOutputRows(ctx, api, {
      inputs,
      nearest: nearest.weights,
      working: working.weights,
      showNearest: round > 0,
      showWorking: beat >= 1,
    }),
  );
  api.focus.target('gptq-decision', () => {
    if (scored) {
      const score = (frame) =>
        frame.residuals.map((n) => Math.abs(n).toFixed(2) + '²').join(' + ') +
        ' = ' +
        frame.error.toFixed(4);
      api.text(ctx, score(nearest), 495, 942, 44, C.blue, 'center', 'mono');
      api.text(ctx, score(working), 1430, 942, 44, C.cyan, 'center', 'mono');
      api.text(
        ctx,
        'Sum of squared output errors on the two calibration inputs',
        960,
        1010,
        33,
        C.muted,
        'center',
      );
    } else if (beat === 3) {
      api.text(
        ctx,
        'Square each output gap and add the two squares.',
        960,
        945,
        43,
        C.ink,
        'center',
      );
    } else if (beat === 2 && shift === 1) {
      api.text(
        ctx,
        'Free weight   ' + working.weights[1].toFixed(2) + '     →     code 1 or 2?',
        960,
        945,
        50,
        C.yellow,
        'center',
      );
    } else if (beat >= 1 && first === 1) {
      const firstOnly = [closest[0], QUANT_WEIGHTS[1]];
      const losses = inputs.map(
        (input) => outputOn(QUANT_WEIGHTS, input) - outputOn(firstOnly, input),
      );
      api.text(
        ctx,
        'Same shift on both rows    (' + losses.map((n) => n.toFixed(2)).join(' + ') + ') / 2 = ?',
        960,
        945,
        45,
        C.yellow,
        'center',
      );
    } else if (round === 1) {
      api.text(
        ctx,
        'Nearest codes   ·   sum of squared gaps = ' + squaredOutputError(closest).toFixed(4),
        960,
        945,
        43,
        C.blue,
        'center',
      );
    } else {
      api.text(
        ctx,
        'Layer output = first weight × first input + second weight × second input',
        960,
        945,
        37,
        C.muted,
        'center',
      );
    }
  });
}

export default {
  id: 'gptq',
  draw: drawGptq,
  cues: [
    'source-products',
    'nearest-rounding',
    'round-first-weight',
    'two-shortfalls',
    'compensate-free-weight',
    'nearest-free-code',
    'round-adjusted-weight',
    'compare-output-errors',
  ],
};
