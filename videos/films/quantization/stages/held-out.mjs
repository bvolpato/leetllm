import { HELD_OUT, QUANT_WEIGHTS } from '../fixtures.mjs';
import { gptqFrame, squaredOutputError } from '../arithmetic.mjs';
import { spokenResult } from '../construction.mjs';
import { drawPair, drawOutputRows } from '../output-rulers.mjs';

const [nearest, compensated] = gptqFrame({ nearest: 1, first: 1, compensation: 1, last: 1 });
const inputs = HELD_OUT[0].map((_, column) => HELD_OUT.map((row) => row[column]));

export function drawHeldOut(ctx, scene, state, api) {
  const { C } = api;
  const matched = spokenResult(state, 'first-alone', 1, 0.05, 0.3);
  const isolated = spokenResult(state, 'second-alone', 1, 0.48, 0.7);
  const scored = spokenResult(state, 'fresh-score', 2, 0.03, 0.35);
  api.focus.target('fixed-pairs', () => {
    drawPair(ctx, api, 'Source weights', QUANT_WEIGHTS, 120, C.ink);
    drawPair(ctx, api, 'Round separately', nearest.weights, 685, C.blue);
    drawPair(ctx, api, 'Round in sequence', compensated.weights, 1295, C.cyan);
  });
  api.focus.target('fresh-inputs', () =>
    drawOutputRows(ctx, api, {
      inputs,
      nearest: nearest.weights,
      working: compensated.weights,
      showNearest: [matched, isolated],
      showWorking: [matched, isolated],
    }),
  );
  api.focus.target('fresh-evidence', () => {
    if (scored) {
      api.text(
        ctx,
        'Nearest    ' + squaredOutputError(nearest.weights, HELD_OUT).toFixed(4),
        480,
        945,
        47,
        C.blue,
        'center',
        'mono',
      );
      api.text(
        ctx,
        'Compensated    ' + squaredOutputError(compensated.weights, HELD_OUT).toFixed(4),
        1400,
        945,
        47,
        C.cyan,
        'center',
        'mono',
      );
      api.text(
        ctx,
        'Sum of squared output errors on the two held-out inputs',
        960,
        1012,
        33,
        C.muted,
        'center',
      );
    } else {
      const prompt = isolated
        ? 'Which pair has the smaller sum of squared gaps?'
        : 'Which pair stays closer when each input selects just one weight?';
      api.text(ctx, prompt, 960, 945, 43, C.yellow, 'center');
    }
  });
}

export default {
  id: 'held-out',
  draw: drawHeldOut,
  cues: ['keep-codes', 'isolate-channels', 'first-alone', 'second-alone', 'fresh-score'],
};
