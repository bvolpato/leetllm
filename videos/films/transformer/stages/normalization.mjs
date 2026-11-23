import { done, event } from '../arithmetic.mjs';
import { INPUT, normalizationFrame } from '../model.mjs';
import { caption, equation, row, target, text, withTransformerLegacyFrame } from '../defaults.mjs';
export function paintNormalization(ctx, scene, state, api, C, b, P, f) {
  const current = normalizationFrame(state),
    map = (v) => 260 + ((v + 2) / 4) * 1360;
  text(
    ctx,
    api,
    C,
    current.rescale > 0 ? 'divide by √(variance + ε)' : 'subtract the row mean',
    960,
    300,
    34,
    C.yellow,
    'center',
  );
  target(ctx, api, 'normalization-points', () =>
    current.points.forEach((v, i) => {
      const y = 405 + i * 72;
      api.line(ctx, 260, y, 1620, y, C.muted, 1);
      api.line(ctx, map(0), y - 20, map(0), y + 20, C.muted, 2);
      api.circle(ctx, map(v), y, 14, C.cyan);
      equation(ctx, api, C, 'x_{' + (i + 1) + '}', 210, y + 10, 27, C.muted, 'right');
      text(ctx, api, C, f(v, 3), 1710, y + 10, 30, C.cyan, 'center');
    }),
  );
  [-2, -1, 0, 1, 2].forEach((v) =>
    text(ctx, api, C, String(v), map(v), 735, 28, C.muted, 'center'),
  );
  const meanKnown = done(event(state, 0, 'norm-mean')),
    scaleKnown = done(event(state, 1, 'norm-statistic'));
  target(ctx, api, 'norm-statistics', () =>
    text(
      ctx,
      api,
      C,
      'mean ' +
        (meanKnown ? f(current.mean, 3) : '?') +
        ' · scale ' +
        (scaleKnown ? f(current.scale, 3) : '?') +
        ' · ε = 0.00001',
      960,
      805,
      29,
      C.yellow,
      'center',
    ),
  );
  target(ctx, api, 'original-branch', () => {
    text(ctx, api, C, 'original stays', 180, 914, 29, C.blue);
    row(ctx, api, C, f, INPUT[2], 570, 860, 1050, C.blue);
  });
  caption(
    ctx,
    api,
    C,
    'Unit learned scale, zero bias · fixed numeric axis throughout both transformations',
  );
}
export function drawNormalizationStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintNormalization);
}
export default {
  id: 'normalization',
  draw: drawNormalizationStage,
  cues: ['center-row', 'norm-mean', 'rescale-row', 'norm-statistic', 'norm-branch'],
};
