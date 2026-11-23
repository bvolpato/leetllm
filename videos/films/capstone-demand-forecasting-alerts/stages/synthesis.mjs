import { clip, metrics, peakDiagnostic, sampleModel, sum } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('synthesis', state);
  {
    api.focus.target('error-comparison', () =>
      teaching.bars({
        x: 180,
        y: 430,
        width: 650,
        height: 300,
        values: [metrics(14).baseline, metrics(14).mae],
        labels: ['Seasonal', 'Candidate'],
        colors: [themeColors.blue, themeColors.cyan],
        max: 9,
        showValues: true,
        format: (v) => v.toFixed(3),
        fontSize: 27,
        gap: 180,
      }),
    );
    text(ctx, api, 'Mean absolute error · parcels', 505, 300, 32, themeColors.cyan, 'center');
    api.focus.target('error-comparison', () =>
      text(
        ctx,
        api,
        `${metrics(14).baseline.toFixed(3)} → ${metrics(14).mae.toFixed(3)} parcels`,
        505,
        840,
        31,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.reveal('synthesis-peak-diagnostic', () => {
      const f = peakDiagnostic(),
        progress = api.focus.progress(
          'synthesis-peak-diagnostic',
          modelState.b ? 1 : clip((state.beatP ?? 0) / 0.2),
        ),
        count = Math.ceil(f.rows.length * progress),
        visible = f.rows.slice(0, count);
      text(
        ctx,
        api,
        'Peak diagnostic · fictional penalty units',
        1400,
        275,
        29,
        themeColors.yellow,
        'center',
      );
      api.focus.target('peak-rule', () =>
        api.math(
          ctx,
          String.raw`y\geq150:\quad3\max(y-\hat y,0)`,
          1400,
          355,
          34,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.target('peak-rows', () =>
        teaching.grid({
          x: 990,
          y: 430,
          width: 810,
          height: 340,
          rows: 4,
          columns: 3,
          labels: [
            ['Mature peak row', 'Seasonal penalty', 'Candidate penalty'],
            ...f.rows.map((row, i) => [
              `${row.date} · y=${row.actual}`,
              i < count
                ? `ŷ ${row.baseline.toFixed(3)}\n3 × ${row.baselineShortfall.toFixed(0)} = ${row.baselineUnits.toFixed(3)}`
                : 'pending',
              i < count
                ? `ŷ ${row.candidate.toFixed(3)}\n3 × ${row.candidateShortfall.toFixed(3)} ≈ ${row.candidateUnits.toFixed(3)}`
                : 'pending',
            ]),
          ],
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
          fontSize: 22,
          padding: 10,
          cellFocusTarget: (row, column) =>
            row === 0
              ? 'peak-rows'
              : column === 1
                ? 'peak-seasonal-terms'
                : column === 2
                  ? 'peak-candidate-terms'
                  : 'peak-identities',
        }),
      );
      api.focus.target('peak-totals', () => {
        text(
          ctx,
          api,
          `${count}/3 qualifying rows summed`,
          1400,
          830,
          25,
          themeColors.muted,
          'center',
        );
        text(
          ctx,
          api,
          `Seasonal ${sum(visible.map((row) => row.baselineUnits)).toFixed(3)} → candidate ${sum(visible.map((row) => row.candidateUnits)).toFixed(3)}`,
          1400,
          885,
          30,
          themeColors.yellow,
          'center',
        );
      });
      text(ctx, api, 'Sums use unrounded forecasts', 1400, 935, 23, themeColors.muted, 'center');
    });
    api.focus.target('tolerance-gate', () =>
      text(
        ctx,
        api,
        'Tolerance: 11/14 = 78.6% < required 85% · HOLD',
        960,
        1000,
        34,
        themeColors.pink,
        'center',
      ),
    );
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'synthesis-b1-1',
    'synthesis-peak-diagnostic',
    'synthesis-b1-2',
    'synthesis-b2-1',
    'synthesis-b2-2',
  ],
};
