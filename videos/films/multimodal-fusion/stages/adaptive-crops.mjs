import { cue } from '../arithmetic.mjs';
import { drawExpandedChart } from '../defaults.mjs';
import { cropSelection } from '../model.mjs';
import { CROP_CANDIDATES, VISUAL_TOKENS_336 } from '../fixtures.mjs';

export function drawAdaptiveCrops(ctx, scene, state, api) {
  const { C } = api,
    beat = state.beat ?? 0;
  const at = (id, index, from, to) => cue(state, id, index, from, to);
  api.focus.target('crop-policy', () => {
    if (beat < 3) {
      const cap = beat === 2 ? 2 : 3;
      const selected = cropSelection(cap);
      const ranked = at('crop-ranked', 1, 0.06, 0.28) === 1;
      drawExpandedChart(ctx, api, 120, 332, 780, 456);
      api.rect(ctx, 671, 412, 164, 60, C.panel, C.pink, 7);
      api.text(ctx, 'PAGE', 753, 453, 31, C.pink, 'center');
      api.rect(ctx, 147, 730, 744, 52, 'transparent', C.yellow, 4);
      api.text(ctx, 'Source screenshot', 126, 292, 34, C.ink);
      api.text(ctx, 'Candidate crop', 981, 292, 34, C.ink);
      api.text(ctx, 'Score', 1468, 292, 31, C.muted, 'center');
      api.text(ctx, ranked ? 'Admitted view' : 'View slot', 1697, 292, 31, C.muted, 'center');
      CROP_CANDIDATES.forEach(({ name, label, score, tone }, i) => {
        const y = 410 + i * 121;
        const rank = selected.indexOf(name);
        api.text(ctx, label, 990, y, 35, C[tone]);
        api.text(ctx, score.toFixed(2), 1468, y, 34, C.ink, 'center');
        if (!ranked || rank < 0) {
          const slot = name === 'global' ? '1 · reserved' : ranked ? 'out' : '?';
          api.text(ctx, slot, 1697, y, 35, rank < 0 && ranked ? C.muted : C[tone], 'center');
        } else {
          api.rect(ctx, 1595, y - 48, 210, 67, C.panel, C[tone], 5);
          if (name === 'global') {
            api.path(
              ctx,
              [
                { x: 1613, y: y + 3 },
                { x: 1685, y: y + 3 },
                { x: 1715, y: y - 21 },
                { x: 1785, y: y - 26 },
              ],
              { color: C.green, width: 3 },
            );
            api.rect(ctx, 1764, y - 42, 28, 9, C.pink, undefined, 0);
          } else {
            api.text(ctx, name === 'axis' ? '14:03' : 'PAGE', 1700, y + 1, 38, C[tone], 'center');
          }
        }
      });
      const count = selected.length * VISUAL_TOKENS_336;
      const prompt =
        beat === 0
          ? 'Three views in total. Which two details get a slot?'
          : beat === 1
            ? 'With only two views, can the reader still check the badge?'
            : 'Read the badge on a slower route, or abstain.';
      api.text(ctx, prompt, 960, 916, 42, beat === 2 ? C.pink : C.yellow, 'center');
      if (ranked)
        api.text(
          ctx,
          `${selected.length} views × 576 = ${count.toLocaleString('en-US')} encoder features`,
          960,
          994,
          31,
          C.ink,
          'center',
        );
      return;
    }
    const frames = 1 + Math.floor(3 * at('crop-more-frames', 3, 0.42, 0.67));
    for (let i = 0; i < frames; i++) {
      const x = 155 + 420 * i;
      api.text(ctx, `Frame ${i + 1}`, x + 161, 380, 37, C.blue, 'center');
      for (let j = 0; j < 32; j++)
        api.rect(ctx, x + (j % 8) * 41, 440 + Math.floor(j / 8) * 48, 32, 38, C.cyan, undefined, 2);
      api.text(ctx, '32 output states', x + 161, 704, 32, C.cyan, 'center');
    }
    api.text(
      ctx,
      `${frames} frames × 32 states = ${frames * 32} states for this clip`,
      960,
      854,
      46,
      C.ink,
      'center',
    );
    api.text(
      ctx,
      'Bound the admitted frames or use a trained clip-level reducer.',
      960,
      959,
      34,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'adaptive-crops',
  draw: drawAdaptiveCrops,
  cues: ['crop-rank-question', 'crop-ranked', 'crop-two-slots', 'crop-more-frames'],
};
