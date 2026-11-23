import { mix } from '../arithmetic.mjs';
import { onlineCueProgress } from '../construction.mjs';
import { mixtureReadout } from '../model.mjs';
import { text as constructionText, rectangle } from '../defaults.mjs';
export function drawMixReweight(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'mix-reweight'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-mix-reweight-mechanism', () => {
    const r = mixtureReadout(),
      p = cueProgress('move', 1),
      wa = r.weightsA.map((v) => mix(v, 500, p)),
      wb = r.weightsB.map((v) => mix(v, 500, p));
    constructionText(
      ctx,
      api,
      'Case count and resolution rate by device',
      330,
      310,
      38,
      themeColors.cyan,
    );
    constructionText(ctx, api, 'Observed', 1450, 310, 34, themeColors.muted, 'center');
    if (p > 0) constructionText(ctx, api, '50/50 mix', 1690, 310, 34, themeColors.yellow, 'center');
    const rr = [r.ratesA, r.ratesB],
      ww = [wa, wb];
    rr.forEach((rates, arm) => {
      const y = 390 + arm * 250;
      constructionText(
        ctx,
        api,
        arm ? 'B' : 'A',
        210,
        y + 55,
        38,
        arm ? themeColors.cyan : themeColors.blue,
      );
      let cursor = 330;
      rates.forEach((rate, i) => {
        const width = (ww[arm][i] / 1000) * 980;
        rectangle(
          ctx,
          api,
          cursor,
          y,
          width,
          100,
          i ? themeColors.panel : themeColors.bg,
          arm ? themeColors.cyan : themeColors.blue,
        );
        if (width > 180) {
          constructionText(
            ctx,
            api,
            (i ? 'desktop' : 'mobile') + ' ' + Math.round(ww[arm][i]),
            cursor + width / 2,
            y + 37,
            27,
            themeColors.muted,
            'center',
          );
          constructionText(
            ctx,
            api,
            (rate * 100).toFixed(0) + '% resolved',
            cursor + width / 2,
            y + 78,
            29,
            arm ? themeColors.cyan : themeColors.blue,
            'center',
          );
        }
        cursor += width;
      });
      if (resultComplete('total', 0))
        constructionText(
          ctx,
          api,
          ((arm ? r.b : r.a) * 100).toFixed(0) + '%',
          1450,
          y + 65,
          40,
          arm ? themeColors.cyan : themeColors.blue,
          'center',
        );
      if (resultComplete('standard', 1))
        constructionText(
          ctx,
          api,
          ((arm ? r.standardB : r.standardA) * 100).toFixed(1) + '%',
          1690,
          y + 65,
          43,
          themeColors.yellow,
          'center',
        );
    });
    if (B === 2)
      constructionText(
        ctx,
        api,
        'Check the device mix at assignment and again at follow-up.',
        960,
        920,
        36,
        themeColors.ink,
        'center',
      );
  });
}
export default {
  id: 'mix-reweight',
  draw: drawMixReweight,
  cues: [
    'oa-mix-reweight-0',
    'oa-mix-reweight-counts',
    'oa-mix-reweight-total',
    'oa-mix-reweight-1',
    'oa-mix-reweight-move',
    'oa-mix-reweight-standard',
    'oa-mix-reweight-2',
  ],
};
