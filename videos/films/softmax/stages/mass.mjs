import { WORDS } from '../fixtures.mjs';
import { massState } from '../model.mjs';
import {
  card,
  drawText,
  equation,
  header,
  strip,
  target,
  withSoftmaxOriginalFrame,
} from '../defaults.mjs';
export function paintSoftmaxOriginalMass(
  ctx,
  scene,
  state,
  api,
  C,
  b,
  p,
  cues,
  colors,
  xs,
  amount,
  starts,
) {
  const v = massState(b, p, cues);
  header(ctx, api, C, 'Every share uses one denominator');
  WORDS.forEach((word, i) => {
    drawText(ctx, api, C, word, xs[i], 350, 39, colors[i], 'center');
    drawText(ctx, api, C, 'score ' + v.logits[i].toFixed(2), xs[i], 415, 29, C.muted, 'center');
    card(ctx, api, C, v.weights[i].toFixed(3), xs[i], 500, colors[i], 300, 90, 37);
    if (i < v.assigned)
      equation(
        ctx,
        api,
        C,
        `\\frac{${v.weights[i].toFixed(3)}}{${v.total.toFixed(3)}}\\approx${v.probabilities[i].toFixed(3)}`,
        xs[i],
        655,
        36,
        colors[i],
      );
  });
  target(ctx, api, 'normalizing-denominator', () => {
    drawText(
      ctx,
      api,
      C,
      (v.additions.every((x) => x === 1) ? 'Shared denominator: ' : 'Running total: ') +
        v.partial.toFixed(3),
      960,
      300,
      29,
      C.cyan,
      'center',
    );
    let left = 510;
    v.weights.forEach((w, i) => {
      const width = w * v.additions[i] * 600;
      api.rect(ctx, left, 573, width, 24, colors[i]);
      left += width;
    });
    api.line(ctx, 510, 605, 1410, 605, C.muted, 1);
    drawText(ctx, api, C, '0', 490, 607, 19, C.muted, 'right');
    drawText(ctx, api, C, '1.5 weight units', 1430, 607, 19, C.muted);
  });
  target(ctx, api, 'mass-distribution', () =>
    strip(ctx, api, C, colors, v.probabilities, 750, v.assigned),
  );
  const gaps = [v.logits[0] - v.logits[1], v.logits[1] - v.logits[2]];
  gaps.forEach((gap, i) => {
    const x = i ? 1050 : 580;
    api.line(ctx, x, 895, x + 160 * gap, 895, C.muted, 3);
    drawText(
      ctx,
      api,
      C,
      (i ? 'slept − ate = ' : 'ran − slept = ') + gap.toFixed(2),
      x + 80 * gap,
      876,
      22,
      C.muted,
      'center',
    );
  });
  WORDS.forEach((_, i) => {
    if (i < v.assigned)
      drawText(
        ctx,
        api,
        C,
        (100 * v.probabilities[i]).toFixed(1) + '%',
        xs[i],
        930,
        43,
        colors[i],
        'center',
      );
  });
  drawText(
    ctx,
    api,
    C,
    b === 2
      ? 'Which observed word costs more: ran or slept?'
      : v.assigned === 3
        ? 'Total probability = 1'
        : 'One budget · shares pending',
    960,
    1030,
    31,
    C.ink,
    'center',
  );
}
export function drawMassStage(ctx, scene, state, api) {
  withSoftmaxOriginalFrame(ctx, scene, state, api, paintSoftmaxOriginalMass);
}
export default {
  id: 'mass',
  draw: drawMassStage,
  cues: [
    'mass-add-0',
    'mass-add-1',
    'mass-add-2',
    'mass-share-0',
    'mass-share-1',
    'mass-share-2',
    'mass-raise',
    'mass-restore',
  ],
};
