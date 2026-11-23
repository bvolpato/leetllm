import { validMetric } from '../model.mjs';
import { chapterText, footer, pill, rectangle } from '../defaults.mjs';
export function drawReportIntegrity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['mv-report-integrity-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('report-integrity-mechanism', () => {
    if (currentBeat <= 1) {
      pill(ctx, api, 'report says: 200 / 200 checks', 960, 300, 1140, themeColors.yellow);
      const ids = ['case-001', 'case-002', 'case-002', 'case-004', 'case-005'];
      const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
      const duplicate = ids.lastIndexOf(repeated);
      const expected = ['case-001', 'case-002', 'case-003', 'case-004', 'case-005'];
      const missing = expected.find((id) => !ids.includes(id));
      const revealed = resultComplete('verify');
      ids.forEach((id, i) => {
        const x = 200 + i * 330;
        pill(
          ctx,
          api,
          id,
          x + 100,
          500,
          320,
          revealed && id === repeated ? themeColors.pink : themeColors.blue,
        );
        if (revealed)
          chapterText(
            ctx,
            api,
            i === duplicate ? 'duplicate' : 'retained',
            x + 100,
            620,
            27,
            i === duplicate ? themeColors.pink : themeColors.green,
          );
      });
      if (revealed) {
        pill(ctx, api, missing + ' · missing observation', 960, 785, 1050, themeColors.pink);
        chapterText(
          ctx,
          api,
          'Match each expected case to its result',
          960,
          920,
          32,
          themeColors.pink,
        );
      }
      footer(
        ctx,
        api,
        B('trust')
          ? 'Verify the report and evaluator before passing totals to the gate'
          : 'Sorted by case ID · expected 001 through 005',
      );
    } else if (currentBeat === 2) {
      chapterText(
        ctx,
        api,
        'Check applicability before numerical thresholds',
        960,
        295,
        36,
        themeColors.yellow,
      );
      pill(ctx, api, 'evaluator v2 expected', 470, 440, 660, themeColors.blue);
      pill(
        ctx,
        api,
        B('contract') ? 'evaluator v3 reported' : 'evaluator v2 reported',
        1410,
        440,
        710,
        B('contract') ? themeColors.pink : themeColors.cyan,
      );
      const vals = [
        ['missing', undefined],
        ['Boolean', true],
        ['string', '0.93'],
        ['negative', -1],
        ['NaN', NaN],
        ['infinity', Infinity],
        ['huge', Infinity],
      ];
      vals.forEach(([name, value], i) => {
        const x = 310 + (i % 4) * 440,
          y = 630 + Math.floor(i / 4) * 170;
        pill(ctx, api, name, x, y, 350, themeColors.muted);
        if (i === 6 ? resultComplete('huge') : resultComplete('invalid'))
          chapterText(
            ctx,
            api,
            validMetric(value) ? 'VALID' : 'REJECT',
            x,
            y + 80,
            27,
            themeColors.pink,
          );
      });
      footer(
        ctx,
        api,
        resultComplete('huge')
          ? 'Reference safely rejects enormous integer-to-float overflow'
          : 'Validate finite numeric inputs before applying thresholds',
      );
    } else {
      const stages = ['REGISTERED', 'OFFLINE ELIGIBLE', 'CANARY POINTER', 'ACTUAL REQUEST'],
        show = [true, B('eligible'), B('eligible'), B('router')];
      stages.forEach((v, i) => {
        const x = 345 + i * 410;
        rectangle(
          ctx,
          api,
          x - 180,
          425,
          360,
          200,
          themeColors.panel,
          show[i] ? themeColors.cyan : themeColors.border,
        );
        chapterText(ctx, api, v, x, 505, 25, show[i] ? themeColors.cyan : themeColors.muted);
        chapterText(
          ctx,
          api,
          ['addressable', 'next experiment', 'zero requests yet', 'resolved release'][i],
          x,
          570,
          26,
          themeColors.muted,
        );
      });
      if (B('router')) {
        for (let i = 0; i < 5; i++) api.circle(ctx, 1620 + i * 24, 775, 7, themeColors.cyan);
        chapterText(ctx, api, 'Router admitted traffic', 1450, 870, 34, themeColors.cyan);
      }
      footer(ctx, api, 'Four distinct events need four distinct observations');
    }
  });
}
export default {
  id: 'report-integrity',
  draw: drawReportIntegrity,
  cues: [
    'mv-report-integrity-claims',
    'mv-report-integrity-verify',
    'mv-report-integrity-trust',
    'mv-report-integrity-contract',
    'mv-report-integrity-invalid',
    'mv-report-integrity-huge',
    'mv-report-integrity-register',
    'mv-report-integrity-eligible',
    'mv-report-integrity-router',
  ],
};
