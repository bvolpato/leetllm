import { phraseProgress } from '../construction.mjs';
import { mixtureReduction, replayGradient } from '../model.mjs';

export function drawTargetWeighting(ctx, scene, state, api) {
  const { C } = api;
  const example = mixtureReduction();
  const mask = phraseProgress(state, 'weight-mask', 0, 0.25, 0.7);
  const pool = phraseProgress(state, 'weight-pool', 1);
  const sources = phraseProgress(state, 'weight-sources', 2);
  const pooled = pool * (1 - sources);
  const share = example.blockShare * (1 - pooled) + example.targetShare * pooled;
  const x = 170,
    width = 1580;
  const counts = [example.domainBlocks, example.replayBlocks];
  const widths = [(width * (1 - share)) / counts[0], (width * share) / counts[1]];
  const colors = [C.cyan, C.yellow];
  const edge = x + width * (1 - share);
  api.text(ctx, 'Same twenty blocks on every pass', x, 268, 39, C.ink);
  api.focus.target('scored-blocks', () => {
    for (let source = 0; source < 2; source++) {
      const left = source === 0 ? x : edge;
      api.text(ctx, source === 0 ? 'Domain' : 'Replay', left, 365, 36, colors[source]);
      for (let i = 0; i < counts[source]; i++) {
        const column = widths[source];
        const start = left + column * i;
        api.text(ctx, String(i + 1), start + column / 2, 419, 24, C.muted, 'center');
        for (let t = 0; t < 6; t++) {
          const y = 447 + t * 30;
          const masked = source === 1 && t >= 2 && mask > (t - 2) / 4;
          if (masked) {
            api.line(ctx, start + 8, y + 10, start + column - 8, y + 10, C.muted, 2);
          } else {
            api.rect(ctx, start + 4, y, column - 8, 21, colors[source], undefined, 2);
          }
        }
      }
    }
    api.text(ctx, 'Each colored cell is one scored target.', x, 684, 31, C.muted);
  });
  api.focus.target('replay-weight', () => {
    api.rect(ctx, x, 757, edge - x, 27, C.cyan, undefined, 0);
    api.rect(ctx, edge, 757, x + width - edge, 27, C.yellow, undefined, 0);
    const showGradient =
      phraseProgress(state, 'weight-gradient', 1, 0.75, 0.95) >= 1 &&
      (sources === 0 || phraseProgress(state, 'weight-restored', 2, 0.34, 0.53) >= 1);
    const name =
      state.beat === 0 || (state.beat === 1 && pool === 0)
        ? 'Each block gets equal weight'
        : sources > 0
          ? 'Weight the two source means'
          : 'Each scored target gets equal weight';
    api.text(ctx, name, x, 846, 37, C.ink);
    api.text(
      ctx,
      'Replay weight   ' + (share * 100).toFixed(0) + '%',
      x + width,
      846,
      43,
      C.yellow,
      'right',
    );
    if (state.beat === 0) {
      if (mask > 0)
        api.text(
          ctx,
          'With equal weight per target, what share will replay get?',
          x,
          965,
          40,
          C.ink,
        );
    } else {
      const equation =
        sources > 0 ? '¾ × (−0.5) + ¼ × (+0.5)' : '[90 × (−0.5) + 10 × (+0.5)] / 100';
      api.text(ctx, equation, x, 951, 39, C.ink);
      api.text(
        ctx,
        'Gradient at zero   ' +
          (showGradient ? replayGradient(share).toFixed(2).replace('-', '−') : '?'),
        x + width,
        951,
        37,
        C.ink,
        'right',
      );
    }
  });
}

export default {
  id: 'target-weighting',
  draw: drawTargetWeighting,
  cues: [
    'weight-mask',
    'weight-count',
    'weight-pool',
    'weight-gradient',
    'weight-sources',
    'weight-restored',
  ],
};
