import {
  drawCompleteBox,
  drawCompleteHead,
  drawCompleteNote,
  drawCompleteRow,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteClassNotPosition(
  ctx,
  scene,
  state,
  api,
  C,
  m,
  f,
  b,
  colors,
  xs,
  started,
  progress,
) {
  drawCompleteHead(
    ctx,
    api,
    C,
    b === 2
      ? 'Three masks act on three different objects'
      : 'Same docs target · separate vocabulary support',
  );
  if (b < 2) {
    const exclude = b === 1 && started('class-exclude'),
      v = exclude ? m.excluded : m.pad;
    ['bug', 'docs', 'padding'].forEach((w, i) => {
      drawCompleteText(ctx, api, C, w, xs[i], 365, 34, colors[i], 'center');
      drawCompleteBox(
        ctx,
        api,
        C,
        exclude && i === 2 ? '−∞' : String([0, 1, 10][i]),
        xs[i],
        465,
        300,
        90,
        exclude && i === 2 ? C.muted : colors[i],
        40,
      );
    });
    drawCompleteRow(ctx, api, C, colors, xs, v.probabilities, 595, ['bug', 'docs', 'padding'], 150);
    drawCompleteText(
      ctx,
      api,
      C,
      'target index 1 ≠ ignore index 2 → supervised',
      960,
      875,
      32,
      C.green,
      'center',
    );
    if (exclude ? started('class-excluded-result') : b === 1 || started('class-loss'))
      drawCompleteText(
        ctx,
        api,
        C,
        'docs loss ' + v.loss.toFixed(6) + ' · padding gradient ' + v.probabilities[2].toFixed(6),
        960,
        970,
        35,
        exclude ? C.yellow : C.pink,
        'center',
      );
    drawCompleteNote(
      ctx,
      api,
      C,
      exclude
        ? 'Only a task candidate exclusion changes this denominator.'
        : 'ignore index = 2 does not delete class 2 from the vocabulary.',
    );
  } else {
    const cols = [450, 960, 1470],
      ys = [400, 540, 680];
    drawCompleteText(ctx, api, C, 'target positions', 450, 340, 31, C.yellow, 'center');
    drawCompleteText(ctx, api, C, 'input access', 960, 340, 31, C.cyan, 'center');
    drawCompleteText(ctx, api, C, 'vocabulary support', 1470, 340, 31, C.pink, 'center');
    ys.forEach((y, i) => {
      drawCompleteBox(
        ctx,
        api,
        C,
        i === 2 ? 'ignored target' : 'supervised',
        cols[0],
        y,
        340,
        75,
        i === 2 ? C.muted : C.yellow,
        27,
      );
      for (let j = 0; j < 3; j++) {
        const allowed = j <= i;
        api.rect(
          ctx,
          850 + j * 75,
          y - 30,
          62,
          60,
          allowed ? C.cyan : C.panel,
          allowed ? C.cyan : C.muted,
          1,
        );
      }
      drawCompleteBox(
        ctx,
        api,
        C,
        i === 2 ? 'excluded class' : 'allowed class',
        cols[2],
        y,
        340,
        75,
        i === 2 ? C.muted : C.pink,
        27,
      );
    });
    if (started('class-soft-support')) {
      drawCompleteText(
        ctx,
        api,
        C,
        'smoothed target mass > 0 on an excluded class',
        960,
        860,
        34,
        C.yellow,
        'center',
      );
      drawCompleteText(ctx, api, C, 'cross-entropy = ∞', 960, 950, 42, C.pink, 'center');
    }
    drawCompleteNote(
      ctx,
      api,
      C,
      'A row mask, attention mask and class mask do not substitute for each other.',
    );
  }
}
export function drawClassNotPositionStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteClassNotPosition);
}
export default {
  id: 'class-not-position',
  draw: drawClassNotPositionStage,
  cues: [
    'class-not-position-0',
    'class-loss',
    'class-not-position-1',
    'class-exclude',
    'class-excluded-result',
    'class-not-position-2',
    'class-soft-support',
  ],
};
