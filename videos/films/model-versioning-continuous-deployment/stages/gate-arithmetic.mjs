import { clamp, routeF1 } from '../arithmetic.mjs';
import { chapterText, footer, formatDecimal, pill, rectangle } from '../defaults.mjs';
export function drawGateArithmetic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cue = (k) => state.cues?.['mv-gate-arithmetic-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('gate-arithmetic-mechanism', () => {
    const a = routeF1(90, 5, 10);
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Route decision versus supplied support label',
        960,
        295,
        35,
        themeColors.yellow,
      );
      ['supported', 'unsupported'].forEach((v, i) =>
        chapterText(ctx, api, v, 820 + i * 530, 400, 32, themeColors.muted),
      );
      ['SERVE', 'ABSTAIN'].forEach((v, i) =>
        chapterText(ctx, api, v, 330, 550 + i * 220, 33, themeColors.yellow),
      );
      [
        ['TP', 'FP'],
        ['FN', 'TN'],
      ].forEach((row, i) =>
        row.forEach((v, j) => {
          const x = 600 + j * 530,
            y = 465 + i * 220,
            show =
              v === 'TP'
                ? B('positive')
                : v === 'FP'
                  ? B('false')
                  : v === 'FN'
                    ? B('negative')
                    : true;
          rectangle(
            ctx,
            api,
            x,
            y,
            440,
            165,
            themeColors.panel,
            v === 'FP' ? themeColors.pink : themeColors.blue,
          );
          if (show)
            chapterText(
              ctx,
              api,
              v,
              x + 220,
              y + 100,
              48,
              v === 'FP' ? themeColors.pink : themeColors.cyan,
            );
        }),
      );
      if (B('formula'))
        chapterText(ctx, api, 'F1 = 2TP / (2TP + FP + FN)', 960, 970, 39, themeColors.cyan);
      footer(ctx, api, 'A correct route still needs generated-claim support review');
    } else if (currentBeat === 1) {
      chapterText(ctx, api, 'Separate supplied worksheet', 960, 295, 36, themeColors.yellow);
      ['TP', 'FP', 'FN'].forEach((v, i) =>
        pill(
          ctx,
          api,
          v + (resultComplete('counts') ? ' = ' + [90, 5, 10][i] : ''),
          420 + i * 540,
          445,
          430,
          i === 1 ? themeColors.pink : themeColors.blue,
        ),
      );
      if (resultComplete('numerator'))
        chapterText(ctx, api, '2 × 90 = ' + a.numerator, 960, 610, 43, themeColors.cyan);
      if (resultComplete('denominator'))
        chapterText(ctx, api, '180 + 5 + 10 = ' + a.denominator, 960, 710, 43, themeColors.cyan);
      if (resultComplete('f1'))
        chapterText(
          ctx,
          api,
          'F1 = 12 / 13 = ' + formatDecimal(ctx, api, a.f1) + ' ≥ .92',
          960,
          825,
          43,
          themeColors.green,
        );
      if (resultComplete('safety'))
        pill(ctx, api, 'FP = 5 violates zero unsupported serves', 960, 940, 1300, themeColors.pink);
      footer(ctx, api, 'Average route score and critical support gate remain separate');
    } else {
      chapterText(ctx, api, 'Frozen offline evidence contract', 960, 295, 36, themeColors.yellow);
      const rows = [
        ['case/support/latency', '200 / 200 / 200'],
        ['route / rollback F1', '≥ .92 / ≥ .90'],
        ['report age', '0 through 24 hours'],
        ['p95 population', '≤ 500 ms'],
      ];
      rows.forEach(([k, v], i) => {
        chapterText(ctx, api, k, 550, 445 + i * 125, 31, themeColors.muted);
        chapterText(ctx, api, v, 1370, 445 + i * 125, 34, themeColors.cyan);
      });
      if (B('missing'))
        pill(
          ctx,
          api,
          'missing / future / timezone-free → REJECT',
          960,
          900,
          1350,
          themeColors.pink,
        );
      if (B('errors')) footer(ctx, api, 'Latency population includes terminal errors and timeouts');
      else footer(ctx, api, 'Release, suite, evaluator and schema must match first');
    }
  });
}
export default {
  id: 'gate-arithmetic',
  draw: drawGateArithmetic,
  cues: [
    'mv-gate-arithmetic-positive',
    'mv-gate-arithmetic-false',
    'mv-gate-arithmetic-negative',
    'mv-gate-arithmetic-formula',
    'mv-gate-arithmetic-counts',
    'mv-gate-arithmetic-numerator',
    'mv-gate-arithmetic-denominator',
    'mv-gate-arithmetic-f1',
    'mv-gate-arithmetic-safety',
    'mv-gate-arithmetic-limits',
    'mv-gate-arithmetic-missing',
    'mv-gate-arithmetic-errors',
  ],
};
