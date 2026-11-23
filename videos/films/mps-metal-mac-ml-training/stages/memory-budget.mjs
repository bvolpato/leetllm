import { foot, math, target, text, withMpsRootFrame } from '../defaults.mjs';
export function paintMemoryBudget(ctx, scene, state, api, C, c, t, s) {
  const width = 1340,
    shown = (width * s.inputMiB) / 12;
  text(ctx, api, C, 'Scale the same ticket pipeline', 960, 280, 42, C.cyan, 'center');
  target(ctx, api, 'input-shape', () =>
    math(
      ctx,
      api,
      C,
      s.shrink > 0 && s.shrink < 1
        ? 'B:32\\to16\\quad T=128\\quad D=768'
        : `(${s.batch},128,768)\\times 4\\text{ bytes}`,
      960,
      415,
      56,
      C.yellow,
    ),
  );
  api.rect(ctx, 290, 515, width, 145, C.panel, C.muted, 2, 16);
  target(ctx, api, 'input-allocation', () => {
    api.rect(
      ctx,
      290,
      515,
      shown,
      145,
      s.step ? C.green : C.cyan,
      s.step ? C.green : C.cyan,
      0,
      16,
    );
    text(ctx, api, C, s.inputMiB.toFixed(1) + ' MiB', 290 + shown / 2, 605, 49, C.bg, 'center');
  });
  text(ctx, api, C, 'Input features only', 960, 720, 36, C.ink, 'center');
  target(ctx, api, 'other-allocations', () =>
    text(
      ctx,
      api,
      C,
      '+ weights + activations + gradients + temporary storage + optimizer state, if any',
      960,
      815,
      32,
      C.yellow,
      'center',
    ),
  );
  if (s.step === 0)
    text(
      ctx,
      api,
      C,
      'Predict the input cost of halving the batch',
      960,
      940,
      40,
      C.yellow,
      'center',
    );
  else
    target(ctx, api, 'batch-choice', () =>
      text(
        ctx,
        api,
        C,
        s.shrink === 1
          ? '16 tickets · same sequence length · 6 MiB inputs'
          : 'Reduce the batch · keep sequence length fixed',
        960,
        940,
        39,
        C.green,
        'center',
      ),
    );
  foot(ctx, api, C, 'The shared physical pool also serves macOS and other applications');
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  paintMemoryBudget(ctx, scene, state, api, C, c, t, s);
}
export function drawMemoryBudgetStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'memory-budget',
  draw: drawMemoryBudgetStage,
  cues: ['baseline-input', 'additional-state', 'halve-batch'],
};
