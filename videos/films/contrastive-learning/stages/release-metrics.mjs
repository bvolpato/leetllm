import { formatValue, shortlistMetrics } from '../arithmetic.mjs';
import { drawNote, drawPill, drawText } from '../defaults.mjs';
export function drawReleaseMetrics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-release-metrics-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('release-metrics-mechanism', () => {
    const rankings =
        currentBeat === 1 && resultComplete('add')
          ? [
              ['P1', 'P2'],
              ['P3', 'X'],
              ['X', 'Y'],
            ]
          : currentBeat === 1 && resultComplete('move')
            ? [
                ['P1', 'X'],
                ['P3', 'X'],
                ['X', 'Y'],
              ]
            : [
                ['X', 'P1'],
                ['P3', 'X'],
                ['X', 'Y'],
              ],
      rel = [['P1', 'P2'], ['P3'], ['P4']];
    drawText(ctx, api, 'Fixed judged universe · cutoff 2', 960, 295, 36, themeColors.yellow);
    rankings.forEach((row, i) => {
      const y = 435 + i * 155;
      drawText(ctx, api, 'Q' + (i + 1), 260, y + 35, 31, themeColors.blue);
      row.forEach((v, j) =>
        drawPill(
          ctx,
          api,
          v,
          530 + j * 300,
          y + 20,
          250,
          rel[i].includes(v) ? themeColors.green : themeColors.muted,
        ),
      );
      drawText(ctx, api, 'relevant: ' + rel[i].join('/'), 1330, y + 35, 29, themeColors.green);
      if (
        currentBeat > 0 &&
        (resultComplete('base') || resultComplete('move') || resultComplete('add'))
      ) {
        const m = shortlistMetrics(row, rel[i], 2);
        drawText(
          ctx,
          api,
          'R ' + formatValue(m.recall, 2) + ' / RR ' + formatValue(m.rr, 2),
          1570,
          y + 100,
          27,
          themeColors.cyan,
        );
      }
    });
    if (currentBeat === 0 && resultComplete('recall'))
      drawText(
        ctx,
        api,
        'Recall = retrieved relevant / all judged relevant',
        960,
        930,
        33,
        themeColors.green,
      );
    if (currentBeat === 1 && resultComplete('base') && !resultComplete('move'))
      drawText(ctx, api, 'Mean Recall = .50 · MRR = .50', 960, 930, 36, themeColors.cyan);
    if (currentBeat === 2)
      drawText(
        ctx,
        api,
        'Held-out queries + source groups + declared serving gates',
        960,
        930,
        32,
        themeColors.yellow,
      );
    drawNote(ctx, api, 'Moving one retrieved answer changes RR without changing recall');
  });
}
export default {
  id: 'release-metrics',
  draw: drawReleaseMetrics,
  cues: [
    'cl-release-metrics-recall',
    'cl-release-metrics-rr',
    'cl-release-metrics-base',
    'cl-release-metrics-move',
    'cl-release-metrics-add',
    'cl-release-metrics-heldout',
  ],
};
