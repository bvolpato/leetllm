import { clamp } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { agreementReadout } from '../model.mjs';
import { box, text as constructionText } from '../defaults.mjs';
export function drawCalibrationAudit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'calibration-audit'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1,
    N = (n, p) => Math.min(n, Math.floor(clamp(p) * n + 1e-8));
  api.focus.target('oa-calibration-audit-mechanism', () => {
    if (B < 2) {
      const r = agreementReadout(),
        n = N(8, cueProgress('pairs', 0));
      constructionText(ctx, api, 'Held-out audit row', 200, 300, 30, themeColors.muted);
      constructionText(ctx, api, 'Human', 680, 300, 30, themeColors.blue, 'center');
      constructionText(ctx, api, 'Judge', 1040, 300, 30, themeColors.cyan, 'center');
      constructionText(ctx, api, 'Exact match', 1480, 300, 30, themeColors.muted, 'center');
      r.human.forEach((v, i) => {
        const y = 360 + i * 55;
        if (B === 1 && !r.matches[i])
          api.rect(ctx, 195, y - 37, 1370, 50, themeColors.panel, themeColors.pink, 8);
        constructionText(ctx, api, i + 1, 260, y, 28, themeColors.muted);
        constructionText(ctx, api, v, 680, y, 31, themeColors.blue, 'center');
        constructionText(ctx, api, r.judge[i], 1040, y, 31, themeColors.cyan, 'center');
        if (i < n)
          constructionText(
            ctx,
            api,
            r.matches[i] ? 'yes' : 'no',
            1480,
            y,
            29,
            r.matches[i] ? themeColors.green : themeColors.pink,
            'center',
          );
      });
      if (resultComplete('agreement', 0))
        constructionText(ctx, api, '6 / 8 = 75%', 500, 865, 39, themeColors.cyan, 'center');
      if (resultComplete('threshold', 0))
        constructionText(ctx, api, 'Required: 80%', 1100, 865, 35, themeColors.yellow, 'center');
      if (resultComplete('verdict', 0))
        constructionText(ctx, api, 'Recalibrate', 1580, 865, 32, themeColors.pink, 'center');
    }
    if (B === 2) {
      ['judge version', 'judge prompt', 'rubric', 'source context'].forEach((v, i) =>
        box(
          ctx,
          api,
          v,
          225 + (i % 2) * 800,
          390 + Math.floor(i / 2) * 200,
          700,
          125,
          resultComplete('version', 2) ? themeColors.cyan : themeColors.muted,
          32,
        ),
      );
    }
  });
}
export default {
  id: 'calibration-audit',
  draw: drawCalibrationAudit,
  cues: [
    'oa-calibration-audit-0',
    'oa-calibration-audit-pairs',
    'oa-calibration-audit-agreement',
    'oa-calibration-audit-threshold',
    'oa-calibration-audit-verdict',
    'oa-calibration-audit-1',
    'oa-calibration-audit-2',
    'oa-calibration-audit-version',
  ],
};
