import { clip, featureProducts, forecastChapterState, rowDigest } from '../model.mjs';
import {
  drawForecastChapterBox,
  drawForecastChapterHead,
  drawForecastChapterNote,
  drawForecastChapterText,
} from '../defaults.mjs';
export function drawLedgerContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = forecastChapterState(state),
    currentBeat = f.b,
    progress = f.p;
  api.focus.target('ledger-contract-operation', () => {
    if (currentBeat === 0) {
      drawForecastChapterHead(ctx, api, 'One forecast identity · distinct origin and target');
      const fields = [
        ['entity', 'FC-A / standard'],
        ['issue', '2026-02-01 08:00UTC'],
        ['target / horizon', '2026-02-06 / 5'],
        ['code / fit', 'ols-v1 / origin1'],
        ['values', 'ŷ163.283582 / C150'],
      ];
      fields.forEach(([k, v], i) => {
        const a = clip(f.progress('forecast-ledger-id') * 5 - i);
        if (a > 0) {
          drawForecastChapterText(ctx, api, k, 240, 410 + i * 105, 29, themeColors.blue);
          drawForecastChapterBox(ctx, api, v, 1200, 390 + i * 105, 1000, 80, themeColors.cyan);
        }
      });
      drawForecastChapterNote(
        ctx,
        api,
        'Schema consistency does not identify an authorized producer.',
      );
    } else if (currentBeat === 1) {
      drawForecastChapterHead(ctx, api, 'Observation key and forecast key have different jobs');
      drawForecastChapterBox(
        ctx,
        api,
        'Origin1 → target day d',
        440,
        420,
        600,
        90,
        themeColors.blue,
      );
      drawForecastChapterBox(ctx, api, 'Origin2 → same day d', 440, 650, 600, 90, themeColors.cyan);
      drawForecastChapterBox(
        ctx,
        api,
        'Actual:entity+tier+day d',
        1400,
        540,
        650,
        105,
        themeColors.pink,
      );
      const q = f.progress('forecast-ledger-join');
      [
        [440, 465],
        [440, 605],
      ].forEach(([x, y]) =>
        api.path(
          ctx,
          [
            {
              x: x + 300,
              y,
            },
            {
              x: 1060,
              y,
            },
            {
              x: 1060,
              y: 540,
            },
            {
              x: 1075,
              y: 540,
            },
          ],
          {
            color: themeColors.muted,
            width: 3,
          },
        ),
      );
      if (q > 0) {
        api.circle(ctx, api.lerp(740, 1040, q), 540, 15, themeColors.yellow);
        drawForecastChapterText(
          ctx,
          api,
          'Retain each forecast ID / horizon',
          960,
          830,
          34,
          themeColors.green,
          'center',
        );
      }
      drawForecastChapterNote(
        ctx,
        api,
        'Date-only join is scoped to one entity · multi-entity systems must include entity keys.',
      );
    } else {
      const edit = f.started('forecast-ledger-edit'),
        lost = f.started('forecast-ledger-reference'),
        v = edit ? 176 : featureProducts().forecast;
      drawForecastChapterHead(
        ctx,
        api,
        lost
          ? 'Both editable values can agree after a rewrite'
          : 'A protected expected digest anchors the original bytes',
      );
      drawForecastChapterBox(
        ctx,
        api,
        'One illustrative issued-row byte record',
        960,
        385,
        1350,
        85,
        themeColors.blue,
      );
      drawForecastChapterText(
        ctx,
        api,
        `candidate:${v.toFixed(6)}`,
        960,
        515,
        44,
        edit ? themeColors.pink : themeColors.cyan,
        'center',
      );
      drawForecastChapterText(
        ctx,
        api,
        'Current row digest:' + rowDigest(v).slice(0, 20),
        960,
        630,
        31,
        themeColors.cyan,
        'center',
      );
      drawForecastChapterText(
        ctx,
        api,
        (lost ? 'Editable expected:' : 'Protected expected:') +
          rowDigest(lost ? v : featureProducts().forecast).slice(0, 20),
        960,
        740,
        31,
        themeColors.yellow,
        'center',
      );
      if (edit)
        drawForecastChapterText(
          ctx,
          api,
          lost
            ? 'Replace expected reference too → authenticity lost'
            : 'Mismatch → changed bytes detected',
          960,
          880,
          36,
          lost ? themeColors.pink : themeColors.green,
          'center',
        );
      drawForecastChapterNote(
        ctx,
        api,
        'Exclusive creation and frozen records do not prevent later disk edits.',
      );
    }
  });
}
export default {
  id: 'ledger-contract',
  draw: drawLedgerContract,
  cues: [
    'ledger-contract-0',
    'forecast-ledger-id',
    'ledger-contract-1',
    'forecast-ledger-join',
    'ledger-contract-2',
    'forecast-ledger-edit',
    'forecast-ledger-reference',
  ],
};
