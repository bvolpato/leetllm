import { spokenProgress } from '../defaults.mjs';
import { momentumReceipt } from '../model.mjs';
import { drawWeightScale } from '../weight-scale.mjs';

const full = momentumReceipt(2, 0.4, 1, 1);
const reset = momentumReceipt(2, 0, 1, 1);

export function drawResumeState(ctx, scene, state, api) {
  const { C } = api;
  const a = spokenProgress(state, api, 'resume-full-step', 1, 0.36, 0.52);
  const b = spokenProgress(state, api, 'resume-reset-step', 1, 0.58, 0.7);
  api.text(ctx, 'Momentum SGD', 130, 270, 36, C.muted);
  api.text(
    ctx,
    'Starting weight   ' + full.weight + '       Gradient   ' + full.gradient,
    960,
    398,
    56,
    C.ink,
    'center',
  );
  api.text(ctx, 'New velocity = 0.5 × old velocity + gradient', 960, 494, 42, C.ink, 'center');
  api.text(
    ctx,
    'Next weight = starting weight - 0.1 × new velocity',
    960,
    563,
    42,
    C.ink,
    'center',
  );
  drawWeightScale(ctx, api, {
    min: 1.84,
    step: 0.04,
    ticks: 6,
    saved: full.weight,
    lanes: [
      {
        label: 'Saved velocity',
        detail: 'old v = 0.4' + (a === 1 ? '     new v = 1.2' : ''),
        color: C.cyan,
        next: full.nextWeight,
        progress: a,
      },
      {
        label: 'Velocity reset',
        detail: 'old v = 0' + (b === 1 ? '     new v = 1' : ''),
        color: C.pink,
        next: reset.nextWeight,
        progress: b,
      },
    ],
  });
}

export default {
  id: 'resume-state',
  draw: drawResumeState,
  cues: ['resume-old-motion', 'resume-zero-motion', 'resume-full-step', 'resume-reset-step'],
};
