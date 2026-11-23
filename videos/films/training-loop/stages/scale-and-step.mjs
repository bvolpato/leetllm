import { loopAmpOrder } from '../arithmetic.mjs';
import { text, vectorLabel } from '../defaults.mjs';
import { finished, progressDuring } from '../scene-clock.mjs';

const result = loopAmpOrder();
const bound = result.correctNorm;

export function drawScaleAndStep(ctx, scene, state, api) {
  const { C } = api;
  const inputSeen = finished(state, 'scale-input', 0, 0.64);
  const wrong = finished(state, 'scale-wrong', 2, 0.09);
  const divided = finished(state, 'scale-divide', 2, 0.48);
  const correct = finished(state, 'scale-correct', 2, 0.59);
  api.focus.target('scale-operation', () => {
    text(ctx, api, 'True gradient   ' + vectorLabel(result.gradient), 170, 267, 42, C.cyan);
    text(ctx, api, 'Loss scale   ×8', 960, 267, 39, C.ink, 'center');
    if (inputSeen)
      text(ctx, api, 'Stored   ' + vectorLabel(result.scaled), 1740, 267, 42, C.yellow, 'right');
    const label =
      state.beat === 0
        ? inputSeen
          ? 'True norm 5   ×   8   =   scaled norm 40'
          : 'True norm   √(3² + 4²) = 5'
        : state.beat === 1
          ? 'Upper run   ·   clip the scaled norm to 2, then divide by 8'
          : state.beat === 2
            ? 'Lower run   ·   divide by 8, then clip the unscaled norm to 2'
            : progressDuring(state, 'scale-growth', 3, 0.66, 0.73) > 0
              ? 'Nonfinite → halve scale     |     2,000 consecutive successes → double scale'
              : 'Nonfinite gradients → skip step     |     finite gradients → optimizer step';
    text(ctx, api, label, 960, 397, 37, C.ink, 'center');
  });
  api.focus.target('scale-rulers', () => {
    const x = (norm) => 530 + 223 * norm;
    text(ctx, api, 'Gradient norm in optimizer units', 1635, 507, 30, C.muted, 'right');
    for (const [i, y] of [630, 810].entries()) {
      const col = i ? C.cyan : C.pink;
      text(ctx, api, i ? 'Divide first' : 'Clip first', 165, y + 12, 40, col);
      api.line(ctx, x(0), y, x(5), y, C.muted, 3);
      for (let tick = 0; tick <= 5; tick++) {
        api.line(ctx, x(tick), y + 6, x(tick), y + 19, C.muted, 2);
        text(ctx, api, String(tick), x(tick), y + 49, 26, C.muted, 'center');
      }
      const norm = i
        ? correct
          ? result.correctNorm
          : divided
            ? Math.hypot(...result.gradient)
            : null
        : wrong
          ? result.wrongNorm
          : null;
      if (norm !== null) {
        api.line(ctx, x(0), y, x(norm), y, col, 11);
        api.circle(ctx, x(norm), y, 13, col);
        text(ctx, api, String(norm), x(norm), y - 36, 39, col, 'center');
      }
      api.line(ctx, x(bound), y - 22, x(bound), y - 8, C.yellow, 3);
    }
    text(
      ctx,
      api,
      state.beat === 1
        ? 'After dividing by eight, where does the upper mark land?'
        : 'Intended bound  2   ·   same true gradient and scale in both runs',
      960,
      988,
      35,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'scale-and-step',
  draw: drawScaleAndStep,
  cues: [
    'scale-input',
    'scale-upper',
    'scale-ask',
    'scale-wrong',
    'scale-divide',
    'scale-correct',
    'scale-step',
    'scale-growth',
  ],
};
