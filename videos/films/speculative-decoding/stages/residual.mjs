import { decomposition } from '../arithmetic.mjs';
import { WORDS } from '../fixtures.mjs';
import { residualSnapshot } from '../model.mjs';
import { originalBars, originalEquation, originalText } from '../defaults.mjs';
export function drawResidual(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const d = decomposition();
  {
    const current = residualSnapshot(currentBeat, progress, state.cues),
      result = current.result,
      matched = result.residual === null;
    api.focus.target('residual-only-the-positive-probability-deficit-needs-correction', () =>
      originalText(
        ctx,
        api,
        current.amount === 0
          ? 'Original example · target and proposer differ'
          : matched
            ? 'Matching distributions · p = q'
            : 'Comparison · move proposer q toward target p',
        960,
        265,
        35,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('matching-laws', () => {
      originalText(
        ctx,
        api,
        'p = [' + current.p.map((v) => v.toFixed(2)).join(', ') + ']',
        960,
        320,
        28,
        themeColors.blue,
        'center',
      );
      originalText(
        ctx,
        api,
        'q = [' + current.q.map((v) => v.toFixed(2)).join(', ') + ']',
        960,
        360,
        28,
        current.amount > 0 ? themeColors.cyan : themeColors.muted,
        'center',
      );
    });
    api.focus.target('positive-deficit', () =>
      originalBars(ctx, api, result.deficit, 260, 490, themeColors.yellow, 'Unnormalized [p − q]₊'),
    );
    api.focus.target('residual-residual-r-normalized', () =>
      originalText(
        ctx,
        api,
        matched ? 'Normalization skipped' : 'Residual r (normalized)',
        1380,
        425,
        34,
        matched ? themeColors.muted : themeColors.green,
        'center',
      ),
    );
    api.focus.target('residual-law', () => {
      if (result.residual)
        teaching.bars({
          x: 1080,
          y: 490,
          width: 600,
          height: 270,
          values: result.residual,
          labels: WORDS,
          color: themeColors.green,
          max: 1,
          showValues: true,
          format: (v) => v.toFixed(2),
          fontSize: 29,
          gap: 55,
        });
      else
        components.card({
          label: 'Rejection impossible · no correction draw',
          x: 1080,
          y: 570,
          width: 650,
          height: 90,
          fontSize: 27,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.muted,
        });
    });
    api.focus.target('residual-equation', () =>
      originalEquation(
        ctx,
        api,
        'Z=' + result.z.toFixed(2) + '=\\Pr(\\mathrm{reject})',
        960,
        925,
        48,
        matched ? themeColors.green : themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'residual',
  draw: drawResidual,
  cues: [
    'positive-deficit',
    'normalize-residual',
    'bird-deficit',
    'bird-correction',
    'rejection-mass',
    'zero-residual',
    'matching-laws',
  ],
};
