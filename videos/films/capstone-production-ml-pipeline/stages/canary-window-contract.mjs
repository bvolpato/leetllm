import { line, panel } from '../defaults.mjs';
export function drawCanaryWindowContract(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const cueProgress = (n) => api.focus.progress('canary-window-contract-' + n, 0),
    cueStarted = (n) => cueProgress(n) > 0,
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  {
    if (currentBeat === 0) {
      teaching.grid({
        x: 130,
        y: 350,
        width: 1660,
        height: 350,
        rows: 4,
        columns: 6,
        labels: [
          ['Window', 'Release', 'Day', 'Requests', 'Error', 'p95'],
          ['first-hour', 'v1', 0, 500, 0.002, 118],
          ['day-seven', 'v1', 7, 4200, 0.003, 124],
          ['invalid probe', 'v1', 7, 'True', 'NaN', 124],
        ],
        fontSize: 28,
        padding: 12,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
      });
      drawText(
        'Duplicate day / Boolean count / nonfinite metric → ABORT',
        960,
        840,
        36,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 1) {
      const missing = cueStarted('missing'),
        invalid = cueStarted('invalid');
      paper(
        'Authored inclusive limits',
        ['2 ordered windows', 'error ≤ 0.01 · latency ≤ 250 ms', 'mature cost delta ≤ 0'],
        130,
        340,
        780,
        themeColors.yellow,
      );
      paper(
        'Separate supplied test states',
        [
          'Equality + complete history → READY',
          'Latest quality missing → HOLD',
          'NaN / mixed identity → ABORT',
        ],
        1060,
        340,
        730,
        themeColors.blue,
      );
      drawText(
        invalid
          ? 'Malformed telemetry aborts limited exposure'
          : missing
            ? 'Missing quality holds; no failed quality is invented'
            : 'Equality passes the stated comparisons',
        960,
        890,
        35,
        invalid ? themeColors.pink : missing ? themeColors.yellow : themeColors.green,
        'center',
      );
    } else {
      paper(
        'Offline E1…E4',
        ['Warnings [1,1,0,0]', 'Candidate cost 4', 'Baseline cost 50', 'Delta −92%'],
        140,
        340,
        750,
        themeColors.blue,
      );
      paper(
        'Separate online O1…O4',
        ['Supplied costs [23,23,23,23]', 'Candidate cost 92', 'Baseline cost 100', 'Delta −8%'],
        1030,
        340,
        750,
        themeColors.cyan,
      );
      drawText(
        'Real live cohorts need request identity, served release and mature outcome coverage',
        960,
        925,
        30,
        themeColors.yellow,
        'center',
      );
    }
    footer(
      'Synthetic summaries exercise controller logic; a canary exposure is not a causal business-lift estimate',
    );
  }
  return;
}
export default {
  id: 'canary-window-contract',
  draw: drawCanaryWindowContract,
  cues: [
    'canary-window-contract-b1',
    'canary-window-contract-b2',
    'canary-window-contract-missing',
    'canary-window-contract-invalid',
    'canary-window-contract-b3',
  ],
};
