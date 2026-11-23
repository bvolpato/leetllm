import { softmax } from '../arithmetic.mjs';
import { p, z } from '../fixtures.mjs';
import { phraseProgress, phraseStarted } from '../clock.mjs';
import { drawScoreOptions, rowY, shareBar } from '../score-rows.mjs';

export function drawUpdate(ctx, scene, state, api) {
  const { C } = api;
  const gradient = p.map((value, i) => value - Number(i === 1));
  const fraction = phraseProgress(state, api, 'take-step', 1, 0.04, 0.25);
  const scores = z.map((value, i) => value - 0.5 * gradient[i] * fraction);
  const probabilities = softmax(scores);
  const gradientKnown = phraseStarted(state, 'form-gradient', 0, 0.44);
  drawScoreOptions(ctx, api);
  api.text(ctx, 'Gradient', 795, 285, 35, C.muted, 'center');
  api.text(ctx, 'Score', 1140, 285, 35, C.muted, 'center');
  api.text(ctx, 'Option probability', 1350, 285, 35, C.muted);
  for (const [i, value] of probabilities.entries()) {
    const y = rowY(i);
    const color = i === 1 ? C.cyan : C.blue;
    api.focus.target('gradient', () => {
      const target = Number(i === 1);
      const g = gradient[i];
      const label = gradientKnown ? (g < 0 ? '−' : '+') + Math.abs(g).toFixed(3) : '?';
      api.text(ctx, label, 795, y, 51, i === 1 ? C.cyan : C.ink, 'center');
      if (gradientKnown)
        api.text(ctx, p[i].toFixed(3) + ' − ' + target, 795, y + 44, 30, C.muted, 'center');
    });
    api.focus.target('changing-scores', () =>
      api.text(ctx, scores[i].toFixed(3), 1140, y, 46, color, 'center'),
    );
    api.focus.target('probability', () => {
      shareBar(ctx, api, 1346, y, 296, value, { original: p[i], color });
      api.text(ctx, value.toFixed(3), 1813, y, 41, color, 'right');
    });
  }
  api.line(ctx, 110, 849, 1810, 849, C.muted, 2);
  api.focus.target('target-loss', () => {
    api.text(
      ctx,
      'Loss on B   −ln p(B) ≈ ' + (-Math.log(probabilities[1])).toFixed(3),
      110,
      942,
      42,
      C.cyan,
    );
  });
  api.focus.target('step', () =>
    api.text(ctx, 'Step   score − ½ × gradient', 1010, 942, 41, C.yellow),
  );
}
export default {
  id: 'update',
  draw: drawUpdate,
  cues: ['loss-target', 'form-gradient', 'step-question', 'take-step', 'after-step'],
};
