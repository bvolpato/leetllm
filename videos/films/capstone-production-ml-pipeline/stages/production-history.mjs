import { arrow, line, panel } from '../defaults.mjs';
export function drawProductionHistory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const cueProgress = (n) => api.focus.progress('production-history-' + n, 0),
    cueStarted = (n) => cueProgress(n) > 0,
    resultComplete = (n) => api.focus.progress('pipe-result-' + n, 0) === 1,
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  {
    if (currentBeat === 0) {
      paper(
        'Same selected release v1',
        [
          'healthy error / latency',
          'quality missing → hold_monitor',
          'measured regression → rollback_required',
        ],
        130,
        350,
        1660,
        themeColors.blue,
      );
      drawText(
        'Malformed production telemetry → investigation hold',
        960,
        760,
        38,
        themeColors.yellow,
        'center',
      );
      drawText(
        'Malformed canary telemetry → abort limited exposure',
        960,
        900,
        35,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1) {
      const entries = [
        ['valid day 9', 'delta −0.01', 'retained valid day 9'],
        ['malformed day 10', 'error NaN', 'latest held receipt day 10'],
        ['late day 8', 'delta +0.14', 'older → hold_rollback'],
      ];
      const shown = cueStarted('older') ? 3 : cueStarted('malformed') ? 2 : 1;
      entries.forEach(([label, v, r], i) => {
        const x = 130 + i * 580;
        panel(
          ctx,
          api,
          x,
          365,
          500,
          365,
          i < shown
            ? i === 0
              ? themeColors.green
              : i === 1
                ? themeColors.yellow
                : themeColors.pink
            : themeColors.muted,
        );
        drawText(
          label,
          x + 250,
          435,
          33,
          i < shown ? themeColors.ink : themeColors.muted,
          'center',
        );
        if (i < shown) {
          drawText(v, x + 250, 550, 32, i === 0 ? themeColors.green : themeColors.pink, 'center');
          drawText(
            (i === 1 && !resultComplete('malformed-observation-hold')) ||
              (i === 2 && !resultComplete('older-observation-hold'))
              ? 'Decision pending'
              : r,
            x + 250,
            655,
            25,
            themeColors.yellow,
            'center',
          );
        }
        if (i < 2)
          arrow(ctx, api, x + 515, 550, x + 555, 550, themeColors.cyan, i < shown - 1 ? 1 : 0);
      });
      drawText(
        'Valid-day memory remains 9; production remains v1',
        960,
        870,
        37,
        themeColors.blue,
        'center',
      );
    } else {
      paper(
        'Stored rollback E8',
        [
          'newer monitor E9 supersedes E8',
          'recheck policy and current release',
          'recheck previous-target fingerprint',
        ],
        140,
        350,
        750,
        themeColors.yellow,
      );
      paper(
        'Before restoring v0',
        ['Changed target → HOLD', 'Changed policy → HOLD', 'Failed reload → HOLD'],
        1030,
        350,
        750,
        themeColors.pink,
      );
      drawText(
        'Integer days cannot order same-day updates or rollout attempts',
        960,
        900,
        33,
        themeColors.ink,
        'center',
      );
    }
    footer(
      'Latest receipt, latest valid observation and current release are separate retained state',
    );
  }
  return;
}
export default {
  id: 'production-history',
  draw: drawProductionHistory,
  cues: [
    'production-history-b1',
    'production-history-b2',
    'production-history-malformed',
    'production-history-older',
    'pipe-result-malformed-observation-hold',
    'pipe-result-older-observation-hold',
    'production-history-b3',
  ],
};
