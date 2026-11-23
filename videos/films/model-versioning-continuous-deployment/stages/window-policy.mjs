import { chapterText, footer, pill, rectangle } from '../defaults.mjs';
export function drawWindowPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['mv-window-policy-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('window-policy-mechanism', () => {
    if (currentBeat === 0) {
      pill(
        ctx,
        api,
        'CANDIDATE · rollout-052 · valid current interval',
        960,
        310,
        1460,
        themeColors.cyan,
      );
      const rows = [
        ['requests', '≥ 1,000'],
        ['support / latency / transport', 'complete'],
        ['answerable / rollback', '≥ 100 / ≥ 50'],
        ['useful / rollback useful', '≥ 90% / ≥ 90%'],
      ];
      rows.forEach(([k, v], i) => {
        chapterText(ctx, api, k, 650, 470 + i * 125, 31, themeColors.muted);
        if (i < 1 || B(i === 1 ? 'coverage' : 'slices'))
          chapterText(ctx, api, v, 1470, 470 + i * 125, 33, themeColors.cyan);
      });
      footer(ctx, api, 'Observed outcome must be acceptable and actually delivered');
    } else if (currentBeat === 1) {
      chapterText(
        ctx,
        api,
        'Keep teaching-policy identities separate',
        960,
        300,
        36,
        themeColors.yellow,
      );
      rectangle(ctx, api, 190, 405, 690, 470, themeColors.panel, themeColors.blue);
      rectangle(ctx, api, 1040, 405, 690, 470, themeColors.panel, themeColors.yellow);
      chapterText(ctx, api, 'Full reference policy', 535, 480, 35, themeColors.blue);
      chapterText(ctx, api, 'Compact reader policy', 1385, 480, 35, themeColors.yellow);
      if (B('reference')) {
        chapterText(ctx, api, 'live p95 ≤ 550 ms', 535, 600, 35, themeColors.blue);
        chapterText(ctx, api, 'transport errors ≤ 1%', 535, 700, 31, themeColors.blue);
        chapterText(ctx, api, 'shadow drops ≤ 2%', 535, 800, 31, themeColors.blue);
      }
      if (B('reader'))
        chapterText(ctx, api, 'live p95 ≤ 500 ms', 1385, 630, 35, themeColors.yellow);
      footer(ctx, api, 'A verdict stays attached to the exact declared policy');
    } else {
      const percent = (count, total, digits) => ((100 * count) / total).toFixed(digits) + '%';
      const rows = [
        ['Reviewed requests', '1,200 / 1,200', '8,000 / 8,000'],
        ['p95 latency', '481 ms', '493 ms'],
        ['Transport errors', '2 / 1,200', '24 / 8,000', percent(2, 1200, 3), percent(24, 8000, 2)],
        [
          'Useful answers',
          '752 / 800',
          '5,640 / 6,000',
          percent(752, 800, 0),
          percent(5640, 6000, 0),
        ],
        [
          'Useful rollback answers',
          '92 / 100',
          '465 / 500',
          percent(92, 100, 0),
          percent(465, 500, 0),
        ],
        ['Unsupported serves', '0', '112', '', percent(112, 8000, 1)],
      ];
      chapterText(ctx, api, '1% window', 925, 290, 44, themeColors.blue);
      chapterText(ctx, api, '10% window', 1515, 290, 44, themeColors.cyan);
      rows.forEach(([name, left, right, leftRate, rightRate], i) => {
        const y = 395 + i * 84;
        api.text(ctx, name, 125, y, 33, themeColors.muted);
        const showRate = resultComplete('rates');
        if (B('counts'))
          chapterText(
            ctx,
            api,
            left + (showRate && leftRate ? '   ·   ' + leftRate : ''),
            925,
            y,
            34,
            themeColors.ink,
          );
        if (B('compare') && (i < 5 || resultComplete('unsafe')))
          chapterText(
            ctx,
            api,
            right + (rightRate ? '   ·   ' + rightRate : ''),
            1515,
            y,
            34,
            i === 5 ? themeColors.pink : themeColors.ink,
          );
      });
      if (resultComplete('abort')) chapterText(ctx, api, 'ABORT', 1515, 925, 44, themeColors.pink);
      if (resultComplete('rates')) chapterText(ctx, api, 'PASS', 925, 925, 44, themeColors.green);
      footer(
        ctx,
        api,
        'Alternative supplied windows   ·   each belongs to the same declared policy',
      );
    }
  });
}
export default {
  id: 'window-policy',
  draw: drawWindowPolicy,
  cues: [
    'mv-window-policy-identity',
    'mv-window-policy-coverage',
    'mv-window-policy-slices',
    'mv-window-policy-reference',
    'mv-window-policy-reader',
    'mv-window-policy-counts',
    'mv-window-policy-rates',
    'mv-window-policy-compare',
    'mv-window-policy-unsafe',
    'mv-window-policy-abort',
  ],
};
