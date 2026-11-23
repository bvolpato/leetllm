import { cueProgress } from '../construction.mjs';
import { focus, line, rectangle, text } from '../defaults.mjs';

const scores = [0.80, 0.82, 0.78, 0.81, 0.79, 0.80];
const labels = [1, 0, 1, 0, 1, 0];
const meanScore = scores.reduce((a, b) => a + b) / scores.length;
const observed = labels.reduce((a, b) => a + b) / labels.length;

export function drawCalibrationCheck(ctx, scene, state, api) {
  const { C } = api;
  const count = Math.floor(6 * cueProgress(state, 'bucket-labels', 0));
  const compare = cueProgress(state, 'bucket-count', 1);
  focus(api, 'calibration-bucket', () => {
    for (let i = 0; i < scores.length; i++) {
      const x = 188 + 260 * i;
      const color = labels[i] ? C.red : C.blue;
      rectangle(ctx, api, x, 294, 236, 229, C.panel);
      text(ctx, api, scores[i].toFixed(2), x + 118, 381, 55);
      if (i < count) {
        rectangle(ctx, api, x, 414, 236, 109, color);
        text(ctx, api, labels[i] ? 'abusive' : 'clean', x + 118, 486, 39, C.bg);
      }
    }
    const left = 220, width = 1460, base = 775;
    const predictedX = left + width * meanScore;
    const observedX = left + width * observed;
    line(ctx, api, left, base, left + width, base, C.muted, 3);
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      line(ctx, api, left + width * p, base, left + width * p, base + 14, C.muted, 3);
      text(ctx, api, (100 * p) + '%', left + width * p, base + 65, 31, C.muted);
    }
    text(ctx, api, 'Average score   ' + Math.round(100 * meanScore) + '%', predictedX, 672, 41, C.cyan);
    line(ctx, api, predictedX, 699, predictedX, base, C.cyan, 5);
    if (compare === 1) {
      text(ctx, api, 'Observed   3 / 6', observedX, 699, 43, C.yellow);
      line(ctx, api, observedX, 718, observedX, base, C.yellow, 5);
      line(ctx, api, observedX, base, predictedX, base, C.yellow, 8);
    }
    if (cueProgress(state, 'bucket-gap', 1) === 1)
      text(ctx, api, 'Gap in this bucket   ' + Math.round(100 * (meanScore - observed)) + ' percentage points', 960, 970, 48, C.yellow);
  });
}
export default { id: 'calibration-check', draw: drawCalibrationCheck, cues: ['bucket-labels', 'bucket-count', 'bucket-gap'] };
