import { spokenProgress } from '../drawing.mjs';

const gains = [21.4, 29.1];

export function drawSpuriousRewards(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  const random = p('vr-random-spurious-rewards', 0, 0.4, 0.56);
  const truth = p('vr-truth-spurious-rewards', 0, 0.65, 0.8);
  const gap = p('vr-scope-spurious-rewards', 1, 0.09, 0.32);
  const other = p('vr-other-spurious-rewards', 1, 0.69, 0.93);
  const control = p('vr-control-spurious-rewards', 2, 0.6, 0.86);
  const start = 515;
  const scale = 34;
  api.focus.target('spurious-rewards-mechanism', () => {
    api.text(ctx, 'Qwen2.5-Math-7B', 154, 284, 49, C.ink);
    api.text(ctx, 'Gain on MATH-500 in percentage points', start, 402, 36, C.muted);
    gains.forEach((value, i) => {
      const y = 500 + 148 * i;
      const progress = i ? truth : random;
      const color = i ? C.green : C.yellow;
      api.text(ctx, i ? 'Ground truth' : 'Random reward', 154, y + 14, 41, C.ink);
      if (progress > 0)
        api.rect(ctx, start, y - 30, scale * value * progress, 48, color, undefined, 4);
      if (progress === 1)
        api.text(ctx, '+' + value.toFixed(1), start + scale * value + 22, y + 12, 42, color);
    });
    if (gap > 0) {
      const x1 = start + scale * gains[0];
      const x2 = start + scale * gains[1];
      const right = api.lerp(x1, x2, gap);
      const y = 743;
      api.line(ctx, x1, y - 12, x1, y + 12, C.cyan, 4);
      api.line(ctx, x1, y, right, y, C.cyan, 4);
      if (gap === 1) {
        api.line(ctx, x2, y - 12, x2, y + 12, C.cyan, 4);
        api.text(
          ctx,
          (gains[1] - gains[0]).toFixed(1) + ' points',
          (x1 + x2) / 2,
          y + 62,
          40,
          C.cyan,
          'center',
        );
      }
    }
    if (other > 0)
      api.text(
        ctx,
        'Random rewards on tested Llama 3 and OLMo 2 variants: little gain or harm',
        154,
        892,
        34,
        C.ink,
      );
    if (control > 0)
      api.text(ctx, 'Compare both runs on the same held-out questions.', 154, 981, 34, C.cyan);
  });
}

export default {
  id: 'spurious-rewards',
  draw: drawSpuriousRewards,
  cues: [
    'vr-spurious-rewards-b0',
    'vr-random-spurious-rewards',
    'vr-truth-spurious-rewards',
    'vr-spurious-rewards-b1',
    'vr-scope-spurious-rewards',
    'vr-other-spurious-rewards',
    'vr-spurious-rewards-b2',
    'vr-control-spurious-rewards',
  ],
};
