import { cases } from '../fixtures.mjs';
import { pairedResults } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawRegressionEvaluation(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  {
    const progress =
      beat === 1 ? api.focus.progress('inspect-case-pairs', state.beatP) : Number(beat > 1);
    const r = pairedResults(Math.ceil(cases.length * progress));
    api.focus.target('prompt-evaluation-header', () =>
      teaching.grid({
        x: 250,
        y: 345,
        width: 1400,
        height: 78,
        rows: 1,
        columns: 3,
        labels: [['Paired incident', 'Old prompt', 'Revised prompt']],
        fontSize: 26,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        textColor: themeColors.ink,
      }),
    );
    r.rows.forEach((row, i) => {
      const y = 445 + i * 68;
      api.focus.target('prompt-case-' + row.name.replaceAll(' ', '-'), () =>
        card(
          ctx,
          api,
          row.name,
          250,
          y,
          650,
          54,
          row.old !== row.next &&
            (beat === 2 || api.focus.progress(row.next ? 'fixed-pair' : 'lost-pair') > 0)
            ? themeColors.yellow
            : themeColors.blue,
          23,
        ),
      );
      api.focus.target('old-prompt-result-' + row.name.replaceAll(' ', '-'), () =>
        card(
          ctx,
          api,
          row.old ? 'PASS' : 'FAIL',
          950,
          y,
          300,
          54,
          row.old ? themeColors.green : themeColors.pink,
          23,
        ),
      );
      api.focus.target('new-prompt-result-' + row.name.replaceAll(' ', '-'), () =>
        card(
          ctx,
          api,
          row.next ? 'PASS' : 'FAIL',
          1350,
          y,
          300,
          54,
          row.next ? themeColors.green : themeColors.pink,
          23,
        ),
      );
    });
    api.focus.target('paired-prompt-totals', () =>
      card(
        ctx,
        api,
        r.inspected
          ? `Full decisions correct · old ${r.oldTotal}/${r.inspected} · revised ${r.newTotal}/${r.inspected}`
          : 'Six paired incidents · waiting for results',
        370,
        910,
        1180,
        75,
        themeColors.yellow,
        28,
      ),
    );
    if (beat === 2)
      text(
        ctx,
        api,
        'Fixed: prior page · Regressed: overdue',
        960,
        1040,
        26,
        themeColors.yellow,
        'center',
      );
  }
}
export default {
  id: 'regression-evaluation',
  draw: drawRegressionEvaluation,
  cues: [
    'prompt-evaluation-header-b1-1',
    'inspect-case-pairs',
    'paired-prompt-totals-b2-1',
    'fixed-pair',
    'lost-pair',
    'prompt-case-overdue-b3-1',
  ],
};
