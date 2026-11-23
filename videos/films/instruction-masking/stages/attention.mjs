import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { attentionFrame } from '../model.mjs';
import { instructionF, instructionFoot, instructionMatrix, instructionT } from '../defaults.mjs';
export function drawAttention(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['attention'] ?? [], () =>
    instructionF(ctx, api, 'attention-construction', () => {
      const f = attentionFrame(state),
        positions = ['A0', 'A1', 'A2', 'B0', 'B1', 'B2'];
      for (const [j, mask, name] of [
        [0, f.causal, 'Ordinary causal'],
        [1, f.isolated, 'Segment-isolated'],
      ]) {
        const x = 250 + j * 900;
        instructionT(ctx, api, name, x, 310, 34, j ? themeColors.green : themeColors.blue);
        positions.forEach((v, i) => {
          instructionT(ctx, api, v, x + 36 + i * 65, 350, 24, themeColors.muted, 'center');
          instructionT(
            ctx,
            api,
            v,
            x - 35,
            397 + i * 65,
            24,
            i === 4 ? themeColors.yellow : themeColors.muted,
            'center',
          );
        });
        instructionF(ctx, api, j ? 'im-isolate-mask' : 'attention-simulation-26', () =>
          instructionMatrix(ctx, api, mask, x, 365, {
            step: 65,
            color: j ? themeColors.green : themeColors.blue,
            visible: () => j === 0 || f.maskProgress > 0,
            selected: (r, k) => r === 4 && mask[r][k],
          }),
        );
        if (beat === 1) {
          const selected = f.values.filter((_v, k) => mask[4][k]),
            p = j ? f.isolatedProgress : f.ordinaryProgress,
            n = Math.floor(p * selected.length + 1e-8),
            added = selected.slice(0, n),
            reveal = j ? f.isolatedRevealed : f.ordinaryRevealed;
          instructionF(
            ctx,
            api,
            j ? 'im-isolated-result' : 'attention-object-b-mean-equal-attention-scores-22',
            () => {
              instructionT(
                ctx,
                api,
                added.length ? added.join(' + ') : 'waiting for B1 contributions',
                x,
                845,
                30,
                themeColors.yellow,
              );
              instructionT(
                ctx,
                api,
                `allowed keys: ${selected.length} · each weight 1/${selected.length}`,
                x,
                905,
                28,
                themeColors.muted,
              );
              instructionT(
                ctx,
                api,
                reveal
                  ? `${selected.reduce((s, n) => s + n, 0)} / ${selected.length} = ${j ? 15 : 7.2}`
                  : 'output ?',
                x,
                965,
                38,
                reveal ? themeColors.green : themeColors.muted,
              );
            },
          );
        }
      }
      instructionFoot(
        ctx,
        api,
        'Both views persist · query B1 reads earlier permitted keys; future B2 stays blocked',
      );
    }),
  );
  function drawExtended() {
    throw Error('Unknown instruction-masking scene attention');
  }
}
export default {
  id: 'attention',
  draw: drawAttention,
  cues: [
    'attention-beat-1-focus-1',
    'im-isolate-mask',
    'attention-beat-2-focus-1',
    'attention-beat-2-focus-2',
    'im-ordinary-values',
    'im-ordinary-result',
    'im-isolated-result',
  ],
};
