import { validationScores } from '../fixtures.mjs';
import { mix, phase, progress, smooth } from '../construction.mjs';
import { M, T, mark, token } from '../defaults.mjs';
export function drawDenominators(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress2 = progress(
      state,
      currentBeat === 0 ? 'precision-cohort' : 'recall-cohort',
      currentBeat,
    ),
    f1 = progress(state, 'f1-receipt', 1),
    selected =
      currentBeat === 0
        ? validationScores.filter((v) => v.p >= 0.2)
        : validationScores.filter((v) => v.label),
    positives = selected.filter((v) => v.label).length;
  T(
    ctx,
    api,
    currentBeat === 0
      ? 'Start with every request sent to review'
      : 'Start with every request that required review',
    960,
    280,
    36,
  );
  const id = currentBeat === 0 ? 'precision-cohort' : 'recall-cohort';
  mark(api, id, () => {
    if (progress2 === 1)
      api.rect(
        ctx,
        340,
        410,
        1240,
        240,
        api.C.panel,
        currentBeat === 0 ? api.C.yellow : api.C.pink,
        12,
      );
    selected.forEach((v, i) => {
      const q = smooth(phase(progress2, i * 0.1, 0.3 + i * 0.1));
      token(
        ctx,
        api,
        v,
        mix(250 + i * 250, 960 + (i - (selected.length - 1) / 2) * 165, q),
        mix(335, 530, q),
      );
    });
  });
  if (progress2 === 1) {
    M(
      ctx,
      api,
      currentBeat === 0
        ? '\\mathrm{precision}=\\frac{TP}{TP+FP}=\\frac{4}{6}'
        : '\\mathrm{recall}=\\frac{TP}{TP+FN}=\\frac{4}{4}',
      960,
      790,
      54,
      api.C.cyan,
    );
    T(
      ctx,
      api,
      positives + ' required reviews / ' + selected.length + ' cases in this group',
      960,
      885,
      34,
      api.C.muted,
    );
  } else T(ctx, api, 'Collect the denominator before dividing', 960, 790, 36, api.C.muted);
  if (currentBeat === 1 && f1 === 1)
    M(ctx, api, 'F_1=\\frac{2PR}{P+R}=0.8', 960, 995, 43, api.C.green);
}
export default {
  id: 'denominators',
  draw: drawDenominators,
  cues: ['precision-cohort', 'recall-cohort', 'f1-receipt'],
};
