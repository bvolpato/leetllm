import { mpClamp } from '../arithmetic.mjs';
import { parallelFooter, parallelRectangle, parallelText, parallelTile } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawCollectiveCount(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-collective-count-' + name,
      q = state.cues?.[id];
    if (state.cues && !q) throw Error('Missing model-parallel cue ' + id);
    return q
      ? {
          q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          q: currentBeat < index ? 0 : currentBeat > index ? 1 : smoothstep(progress),
          done: currentBeat > index || (currentBeat === index && progress >= 0.92),
        };
  };
  const Q = (name, index) => cue(name, index).q,
    resultComplete = (name, index) => cue(name, index).done;
  api.focus.target('mp-collective-count-mechanism', () => {
    if (currentBeat === 2) {
      const growth = Q('larger-batch', 2);
      const batch = 1 + Math.floor(7 * growth);
      const width = 4096,
        elementBytes = 2;
      parallelText(ctx, api, 'One batch decode iteration', 170, 300, 44);
      parallelText(ctx, api, 'In-layer all-reduces', 170, 458, 39, themeColors.muted);
      parallelText(ctx, api, String(80 * 2), 170, 640, 132, themeColors.yellow);
      parallelText(
        ctx,
        api,
        `Activation in each call   ·   ${batch} × 4096 BF16 values`,
        776,
        390,
        38,
        themeColors.cyan,
      );
      for (let i = 0; i < batch; i++) {
        api.rect(ctx, 780, 444 + i * 45, 850, 38, themeColors.cyan, undefined, 0);
      }
      parallelText(
        ctx,
        api,
        `${(batch * width * elementBytes) / 1024} KiB per activation`,
        780,
        884,
        46,
        themeColors.cyan,
      );
      parallelText(
        ctx,
        api,
        'Each strip carries one request’s hidden vector',
        170,
        990,
        34,
        themeColors.muted,
      );
      return;
    }
    parallelText(ctx, api, '80 dense layers × 2 reductions', 180, 300, 33, themeColors.ink);
    const q = Q('one-step', 0);
    for (let l = 0; l < 80; l++) {
      const x = 180 + (l % 20) * 78,
        y = 380 + Math.floor(l / 20) * 100;
      for (let k = 0; k < 2; k++)
        parallelRectangle(
          ctx,
          api,
          x + k * 31,
          y,
          25,
          62,
          2 * l + k < q * 160 ? themeColors.blue : themeColors.muted,
          2 * l + k < q * 160 ? themeColors.blue : themeColors.bg,
        );
    }
    const step = resultComplete('one-step', 0);
    parallelText(
      ctx,
      api,
      step ? '160 calls / batch decode iteration' : 'in-layer calls: ?',
      960,
      840,
      33,
      step ? themeColors.blue : themeColors.muted,
      'center',
    );
    if (currentBeat === 0 && resultComplete('iterations', 0))
      parallelText(
        ctx,
        api,
        '160 × 128 = 20,480 calls',
        960,
        935,
        34,
        themeColors.yellow,
        'center',
      );
    if (currentBeat > 0) {
      parallelTile(ctx, api, 'prefill → token 1', 180, 900, 410, 70, themeColors.cyan);
      parallelText(
        ctx,
        api,
        resultComplete('prefill', 1) ? '127 decode iterations' : 'decode iterations: ?',
        700,
        945,
        31,
        themeColors.muted,
      );
      if (resultComplete('decode-only', 1))
        parallelText(ctx, api, '20,320', 1530, 945, 36, themeColors.yellow);
    }
    parallelFooter(
      ctx,
      api,
      'One collective can advance a batch. Do not multiply the operation count by batch size.',
    );
  });
}
export default {
  id: 'collective-count',
  draw: drawCollectiveCount,
  cues: [
    'mp-collective-count-0',
    'mp-collective-count-one-step',
    'mp-collective-count-iterations',
    'mp-collective-count-1',
    'mp-collective-count-prefill',
    'mp-collective-count-decode-only',
    'mp-collective-count-2',
    'mp-collective-count-larger-batch',
    'mp-collective-count-profile',
  ],
};
