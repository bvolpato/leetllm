import { policyValueFixture } from '../model.mjs';
import { box, code, datum, focusProgress, footer, label, line } from '../defaults.mjs';
export function drawDrCorrection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const pc = (v, d = 1) => Number((100 * v).toFixed(d)) + '%',
    num = (v, d = 3) => Number(v.toFixed(d));
  api.focus.target('cau-dr-correction-mechanism', () => {
    const restore = done('dr-reward-restore'),
      wrong = done('dr-wrong-propensity'),
      f = policyValueFixture({
        rewardShift: restore ? 0 : 0.05,
        estimatedPropensity: wrong ? 0.4 : null,
      }),
      earned = restore || wrong ? done('dr-wrong-result') || restore : done('dr-matched-result');
    label(
      ctx,
      api,
      'Same ticket IDs and rewards · change only nuisance predictions',
      960,
      275,
      themeColors.ink,
      31,
    );
    box(
      ctx,
      api,
      'Reward-model baseline',
      [
        `Q low ${pc(restore ? 0.9 : 0.95)} / high ${pc(restore ? 0.5 : 0.55)}`,
        done('dr-shifted-baseline') || restore ? 'target mean ' + pc(f.baseline) : 'target mean ?',
      ],
      180,
      350,
      750,
      205,
      themeColors.blue,
    );
    const residualEarned = restore || done(wrong ? 'dr-wrong-correction' : 'dr-residuals');
    box(
      ctx,
      api,
      'Assignment weights',
      [
        wrong ? 'estimated e: 0.4 / 0.4' : 'estimated e: 0.1 / 0.9',
        `weighted residual sum ${residualEarned ? num(f.correction * 200, 3) : '?'}`,
      ],
      1050,
      350,
      690,
      205,
      themeColors.yellow,
    );
    code(ctx, api, 'baseline + residual sum / 200', 960, 685, 37, themeColors.ink, 'center');
    const x = 380,
      scale = 1350;
    if (done('dr-shifted-baseline') || restore)
      api.rect(ctx, x, 760, f.baseline * scale, 55, themeColors.blue, undefined, 5);
    const left = x + (f.baseline + Math.min(0, f.correction)) * scale;
    if (residualEarned) {
      api.rect(ctx, left, 845, Math.abs(f.correction) * scale, 42, themeColors.pink, undefined, 4);
      line(ctx, api, left, 810, left, 900, themeColors.yellow, 3);
    }
    datum(ctx, api, pc(f.dr, 1), 1510, 895, earned, themeColors.green, 48);
    footer(
      ctx,
      api,
      restore
        ? 'Reward model restored: 70%; the earlier both-wrong case gave 68.8%.'
        : wrong && done('dr-wrong-result')
          ? 'Both nuisance models wrong: 68.8% here. Empirical algebra is not identification.'
          : 'The correction uses the observed reward minus its prediction for the action actually logged.',
    );
  });
}
export default {
  id: 'dr-correction',
  draw: drawDrCorrection,
  cues: [
    'cau-dr-correction-0',
    'cau-dr-correction-1',
    'cau-dr-shifted-baseline',
    'cau-dr-matched-result',
    'cau-dr-residuals',
    'cau-dr-correction-2',
    'cau-dr-wrong-propensity',
    'cau-dr-wrong-result',
    'cau-dr-reward-restore',
    'cau-dr-wrong-correction',
  ],
};
