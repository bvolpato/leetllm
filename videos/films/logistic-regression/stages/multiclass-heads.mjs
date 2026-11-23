import { multiclassSnapshot } from '../model.mjs';
import { cueAmount, equation, rectangle, text } from '../defaults.mjs';
export function drawMulticlassHeads(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-multiclass-heads-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-multiclass-heads-mechanism', () => {
    const step =
        currentBeat === 0
          ? 0
          : currentBeat === 1
            ? resultComplete('lr-multiclass-fit')
              ? 1000
              : Math.min(999, Math.floor(Math.expm1(op * Math.log(1001))))
            : 1000,
      s = multiclassSnapshot(step);
    if (currentBeat < 2) {
      text(
        ctx,
        api,
        'Separate six-row, three-class training fixture',
        960,
        270,
        33,
        themeColors.muted,
      );
      ['auto', 'review', 'escalate'].forEach((v, k) =>
        text(
          ctx,
          api,
          v,
          1000 + k * 270,
          350,
          30,
          [themeColors.blue, themeColors.yellow, themeColors.pink][k],
        ),
      );
      s.rows.forEach((r, i) => {
        const y = 410 + i * 77;
        text(
          ctx,
          api,
          r.id + ' · [' + r.x.slice(1).join(', ') + ']',
          390,
          y + 28,
          29,
          themeColors.muted,
        );
        for (let k = 0; k < 3; k++) {
          const x = 875 + k * 270;
          rectangle(ctx, api, x, y, 220, 42, themeColors.panel, themeColors.muted);
          rectangle(
            ctx,
            api,
            x,
            y,
            220 * r.probabilities[k],
            42,
            [themeColors.blue, themeColors.yellow, themeColors.pink][k],
          );
          if (
            (currentBeat === 0 && cueAmount(ctx, api, 'lr-class-distribution') > 0) ||
            currentBeat === 1
          )
            text(ctx, api, r.probabilities[k].toFixed(3), x + 110, y + 32, 28, themeColors.ink);
        }
      });
      if (currentBeat === 0)
        equation(
          ctx,
          api,
          'Z=XW\\quad P_{ik}=\\frac{e^{Z_{ik}}}{\\sum_j e^{Z_{ij}}}',
          960,
          965,
          43,
          themeColors.cyan,
        );
      else {
        equation(ctx, api, '\\nabla_W L=\\frac16 X^T(P-Y)', 650, 965, 42, themeColors.yellow);
        text(
          ctx,
          api,
          resultComplete('lr-multiclass-fit')
            ? 'Step1000 · loss ' + s.loss.toFixed(4)
            : 'Actual fit step ' + step,
          1480,
          965,
          35,
          themeColors.cyan,
        );
      }
    } else {
      const row = s.rows[2],
        shift = 3 * cueAmount(ctx, api, 'lr-shared-head-shift'),
        z = row.logits.map((v) => v + shift);
      text(
        ctx,
        api,
        'M3 retains the same three-class distribution',
        960,
        280,
        35,
        themeColors.muted,
      );
      z.forEach((v, k) => {
        const x = 360 + k * 580;
        text(
          ctx,
          api,
          ['auto', 'review', 'escalate'][k],
          x,
          390,
          34,
          [themeColors.blue, themeColors.yellow, themeColors.pink][k],
        );
        text(ctx, api, 'logit ' + v.toFixed(3), x, 535, 39, themeColors.yellow);
        rectangle(ctx, api, x - 100, 650, 200, 210 * row.probabilities[k], themeColors.cyan);
        text(ctx, api, row.probabilities[k].toFixed(4), x, 945, 34, themeColors.cyan);
      });
      equation(
        ctx,
        api,
        '\\operatorname{softmax}(z+c\\mathbf1)=\\operatorname{softmax}(z)',
        960,
        1008,
        40,
        themeColors.muted,
      );
    }
  });
}
export default {
  id: 'multiclass-heads',
  draw: drawMulticlassHeads,
  cues: [
    'lr-multiclass-heads-step-0',
    'lr-softmax-heads',
    'lr-class-distribution',
    'lr-multiclass-heads-step-1',
    'lr-class-residual',
    'lr-multiclass-fit',
    'lr-multiclass-heads-step-2',
    'lr-shared-head-shift',
  ],
};
