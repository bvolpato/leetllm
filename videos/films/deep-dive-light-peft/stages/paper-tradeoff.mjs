import { TABLE1 } from '../fixtures.mjs';
import { beatCue } from '../model.mjs';

const floor = 92;
const fastestEligible = TABLE1.filter((row) => row.average >= floor).reduce((best, row) =>
  row.speed > best.speed ? row : best,
);

export function drawPaperTradeoff(ctx, scene, state, api) {
  const { C } = api;
  const reveal = [
    beatCue(state, 0, 'lp-table-base', 0.1, 0.25),
    beatCue(state, 0, 'lp-table-72', 0.3, 0.5),
    beatCue(state, 0, 'lp-table-67', 0.55, 0.7),
  ];
  const losses = beatCue(state, 0, 'lp-table-loss', 0.74, 0.88);
  const gate = beatCue(state, 1, 'lp-table-floor', 0.15, 0.5);
  const chosen = beatCue(state, 2, 'lp-table-choice', 0.05, 0.28);
  const y = (v) => 740 - (v - 91) * 178;
  const xs = [620, 1050, 1475];
  api.text(ctx, 'Mean accuracy (%)  ·  MNLI, QNLI, QQP, SST-2', 170, 246, 37, C.ink);
  api.focus.target('lp-table1', () => {
    [91, 92, 93].forEach((v) => {
      api.text(ctx, String(v), 253, y(v) + 12, 31, C.muted, 'right');
      api.line(ctx, 275, y(v), 1720, y(v), C.muted, 1);
    });
    for (const [i, row] of TABLE1.entries()) {
      const x = xs[i],
        color = i ? C.cyan : C.blue;
      api.text(ctx, row.retained + '% retained', x, 818, 39, color, 'center');
      if (!reveal[i]) continue;
      api.circle(ctx, x, y(row.average), 12, color);
      // The two pruned scores straddle the floor; keep their labels on their own side.
      api.text(
        ctx,
        row.average.toFixed(1),
        x,
        y(row.average) + (i === 2 ? 70 : -37),
        49,
        color,
        'center',
      );
      api.text(ctx, row.speed.toFixed(1) + '× training speed', x, 880, 33, color, 'center');
    }
  });
  api.focus.target('lp-table-floor', () => {
    if (gate > 0) api.line(ctx, 278, y(floor), 278 + 1442 * gate, y(floor), C.yellow, 6);
    const msg =
      chosen === 1
        ? 'Try the ' + fastestEligible.retained + '% row  ·  fastest above the example floor'
        : gate > 0
          ? 'Example floor: 92.0%   ·   Which eligible row ran fastest?'
          : losses === 1
            ? 'The two cuts cost 1.1 and 1.4 average accuracy points.'
            : 'Table 1  ·  estimation included';
    api.text(ctx, msg, 960, 990, 37, gate > 0 ? C.yellow : C.muted, 'center');
  });
}
export default {
  id: 'paper-tradeoff',
  draw: drawPaperTradeoff,
  cues: [
    'lp-table-base',
    'lp-table-72',
    'lp-table-67',
    'lp-table-loss',
    'lp-table-floor',
    'lp-table-choice',
  ],
};
