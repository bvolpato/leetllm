import { beatCue } from '../arithmetic.mjs';
import { center, collapseCodes, lower } from '../fixtures.mjs';
import { decode } from '../model.mjs';
import { chapterGrid, line, point, text } from '../defaults.mjs';

export function drawInterpolation(ctx, scene, state, api) {
  const { C } = api;
  const halfway = beatCue(state, 0, 'vae-interpolation-0-build', 0.42, 0.62);
  const answer = beatCue(state, 1, 'vae-interpolation-1-build', 0, 0.12);
  const finish = beatCue(state, 2, 'finish-slide', 0.1, 0.3);
  const alpha = (halfway + finish) / 2;
  const [left, right] = collapseCodes;
  const code = left.map((v, i) => v * (1 - alpha) + right[i] * alpha);
  const pair = (values) => '[' + values.map((v) => Number(v.toFixed(3))).join(',  ') + ']';
  const columns = [342, 960, 1578];
  const side = 71;
  const halfWidth = (side * 5 - 5) / 2;

  for (const [i, label] of ['Badge', 'Decoder output at α', 'Lower strip'].entries())
    text(ctx, api, label, columns[i], 275, 39, [C.cyan, C.yellow, C.pink][i], 'center');

  for (const [i, endpoint] of [left, code, right].entries()) {
    const x = columns[i];
    if (i === 1 && answer === 0) {
      api.rect(ctx, x - halfWidth, 335, 2 * halfWidth, 2 * halfWidth, C.panel, C.muted, 6);
      text(ctx, api, '?', x, 549, 80, C.ink, 'center');
    } else {
      const row = decode(endpoint);
      chapterGrid(ctx, api, row, x - halfWidth, 335, side);
      if (i === 1 && finish === 0)
        text(
          ctx,
          api,
          'Badge ' + row[center[0]].toFixed(3) + '    Strip ' + row[lower[0]].toFixed(3),
          x,
          747,
          35,
          C.yellow,
          'center',
        );
    }
    if (i !== 1) text(ctx, api, pair(endpoint), x, 747, 35, C.ink, 'center');
  }

  const y = 836;
  line(ctx, api, columns[0], y, columns[2], y, C.muted, 3);
  for (const x of columns) line(ctx, api, x, y - 10, x, y + 10, C.muted, 2);
  point(ctx, api, columns[0] + alpha * (columns[2] - columns[0]), y, C.yellow, 14);
  text(ctx, api, 'z = (1 − α) × left + α × right', 960, 928, 38, C.ink, 'center');
  text(ctx, api, 'α = ' + Number(alpha.toFixed(2)), 340, 928, 36, C.yellow, 'center');
  text(ctx, api, pair(code), 1578, 928, 35, C.yellow, 'center');
}

export default {
  id: 'interpolation',
  draw: drawInterpolation,
  cues: ['vae-interpolation-0-build', 'vae-interpolation-1-build', 'finish-slide'],
};
