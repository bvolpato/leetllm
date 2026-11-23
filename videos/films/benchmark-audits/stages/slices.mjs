import { mix, pct } from '../arithmetic.mjs';
import { CASES } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { auditFocusApi, card, caseGrid, text, visualFocus } from '../defaults.mjs';
export function drawSlices(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  const { C: themeColors, components: components, teaching: teaching } = api;
  const modelState = sampleModel('slices', state),
    currentBeat = modelState.step,
    progress = modelState.p;
  {
    modelState.scores.forEach((row, i) => {
      const x = 165 + i * 870;
      const opening = false;
      const lift = 1;
      const reveal = 1;
      visualFocus(ctx, api, `benchmark-score-${row.model.toLowerCase()}`, () =>
        text(
          ctx,
          api,
          lift < 1
            ? `${row.model} · ${pct(row.rate)}`
            : `Assistant ${row.model} · ${row.correct}/${row.total}`,
          x + 320,
          mix(480, 300, lift),
          mix(72, 35, lift),
          i ? themeColors.cyan : themeColors.blue,
          'center',
        ),
      );
      const peel = currentBeat >= 1 ? (currentBeat > 1 ? 1 : progress) : 0;
      components.fade(1 - peel, () => {
        components.fade(reveal, () => {
          if (currentBeat === 0)
            visualFocus(ctx, api, 'benchmark-case-results', () =>
              caseGrid(ctx, api, row.model, x, 365, 640, 370, Math.floor(100 * reveal)),
            );
          if (currentBeat === 0) api.line(ctx, x + 576, 365, x + 576, 735, themeColors.yellow, 3);
          visualFocus(ctx, api, 'intro-object-90-ordinary-1', () =>
            text(ctx, api, '90 ordinary', x + 260, 795, 28, themeColors.muted, 'center'),
          );
          text(ctx, api, '10 renewals', x + 600, 845, 26, themeColors.yellow, 'center');
        });
      });
      if (currentBeat >= 1) {
        const renewalRows = CASES.filter((test) => test.category === 'renewal');
        visualFocus(ctx, api, 'benchmark-renewal-cases', () =>
          teaching.grid({
            x: mix(x + 576, x + 190, peel),
            y: 365,
            width: mix(64, 280, peel),
            height: 370,
            rows: 10,
            columns: 1,
            fill: '#8cdeb52b',
            stroke: themeColors.yellow,
            lineWidth: 1,
            labels: renewalRows.map((test) => [
              peel > 0.78 ? `${test.id} · ${test[row.model] ? 'pass' : 'fail'}` : test.id,
            ]),
            highlights: renewalRows.flatMap((test, index) =>
              test[row.model]
                ? []
                : [
                    {
                      row: index,
                      column: 0,
                      fill: '#ef9ac84d',
                    },
                  ],
            ),
            fontSize: mix(17, 24, peel),
            textColor: themeColors.ink,
            padding: 4,
          }),
        );
      }
    });
    if (currentBeat >= 1) {
      visualFocus(ctx, api, 'slices-simulation-3', () =>
        modelState.scores.forEach((row, i) => {
          const x = 180 + i * 870;
          components.fade(currentBeat > 1 ? 1 : progress, () => {
            visualFocus(ctx, api, 'slices-object-renewals-4', () =>
              card(
                ctx,
                api,
                `Renewals: ${row.renewal.correct}/${row.renewal.total} · ${pct(row.renewal.rate)}`,
                x,
                885,
                610,
                row.renewal.rate >= 0.8 ? themeColors.green : themeColors.pink,
                80,
                30,
              ),
            );
          });
        }),
      );
    } else {
      text(
        ctx,
        api,
        'Same overall score · different questions failed',
        960,
        925,
        32,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Keep IDs Q91 · Q92 · Q99 attached to the renewal cases',
        960,
        985,
        26,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2) {
      text(
        ctx,
        api,
        'Renewal requirement: at least 80% · A misses · B clears',
        960,
        345,
        28,
        themeColors.yellow,
        'center',
      );
      for (let i = 0; i < 2; i++) {
        const x = 165 + i * 870 + 190;
        api.line(ctx, x - 12, 661, x + 292, 661, themeColors.yellow, 4);
      }
      text(
        ctx,
        api,
        'Q93: renewal permission required · A omitted it · B retained it',
        960,
        1005,
        25,
        themeColors.yellow,
        'center',
      );
    }
  }
}
export default {
  id: 'slices',
  draw: drawSlices,
  cues: [
    'slices-beat-1-focus-1',
    'slices-beat-1-focus-2',
    'slices-beat-2-focus-1',
    'ba-slices-renewals',
    'slices-beat-3-focus-1',
    'ba-slices-cutoff',
  ],
};
