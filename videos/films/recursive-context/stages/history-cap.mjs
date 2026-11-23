import { previewForHistory } from '../arithmetic.mjs';
import { arrow, contractText, cueComplete, cueProgress, footer, tag } from '../defaults.mjs';
export function drawHistoryCap(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('history-cap-mechanism', () => {
    const raw = Array.from(
        {
          length: 20,
        },
        (_, i) => 'incident log line ' + i,
      ).join('\n'),
      preview = previewForHistory(raw);
    if (currentBeat === 0) {
      tag(
        ctx,
        api,
        'Raw return retained outside history: ' + raw.length,
        960,
        340,
        themeColors.blue,
        1500,
      );
      if (cueProgress(ctx, api, 'history-preview')) {
        arrow(ctx, api, 960, 410, 960, 500, themeColors.cyan);
        tag(ctx, api, preview.replaceAll('\n', '↵'), 960, 590, themeColors.cyan, 1600);
      }
      if (cueComplete(ctx, api, 'history-marker')) {
        contractText(ctx, api, '26 source characters', 500, 790, 34, themeColors.blue);
        contractText(ctx, api, '14-character marker', 1420, 790, 34, themeColors.yellow);
        contractText(
          ctx,
          api,
          'Total 40 · marker fits inside the cap',
          960,
          925,
          36,
          themeColors.green,
        );
      }
    } else if (currentBeat === 1) {
      const n = Math.max(1, Math.round(20 * cueProgress(ctx, api, 'history-grow'))),
        plot = api.teaching.axes({
          x: 220,
          y: 360,
          width: 1100,
          height: 470,
          xDomain: [0, 20],
          yDomain: [0, 8500],
          xTicks: [0, 5, 10, 15, 20],
          yTicks: [0, 4000, 8000],
          xLabel: 'returns',
          yLabel: 'characters',
          fontSize: 28,
        });
      [raw.length, preview.length].forEach((cost, i) =>
        api.teaching.curve({
          plot,
          points: [
            {
              x: 0,
              y: 0,
            },
            {
              x: n,
              y: n * cost,
            },
          ],
          color: i ? themeColors.cyan : themeColors.blue,
        }),
      );
      contractText(ctx, api, n + ' returns', 1530, 405, 34, themeColors.yellow);
      contractText(ctx, api, 'full: ' + n * raw.length, 1530, 565, 35, themeColors.blue);
      contractText(ctx, api, 'preview: ' + n * preview.length, 1530, 725, 35, themeColors.cyan);
      contractText(
        ctx,
        api,
        'Both accumulated histories keep growing',
        960,
        940,
        35,
        themeColors.pink,
      );
    } else {
      const tight = cueProgress(ctx, api, 'tight-history') > 0;
      const repeated = cueProgress(ctx, api, 'repeat-peek') > 0 && !tight;
      const actions = tight ? ['peek'] : repeated ? ['peek', 'peek', 'peek'] : ['peek', 'finish'];
      contractText(
        ctx,
        api,
        'Fixed actions   /   maximum 3 steps   /   history limit ' +
          (tight ? 80 : 500) +
          ' characters',
        960,
        315,
        38,
        themeColors.blue,
      );
      actions.forEach((name, i) =>
        tag(ctx, api, String(i + 1) + '   ' + name, 410 + i * 550, 525, themeColors.cyan, 430),
      );
      const result = tight
        ? cueComplete(ctx, api, 'history-stop')
          ? 'history_budget   /   first observation exceeds the cap'
          : 'Checking the serialized history'
        : repeated
          ? 'incomplete_or_step_budget   /   no finish within three steps'
          : cueComplete(ctx, api, 'history-candidate')
            ? 'Two steps produce a candidate'
            : 'Candidate pending';
      api.text(
        ctx,
        result,
        960,
        784,
        37,
        repeated || tight ? themeColors.pink : themeColors.green,
        'center',
        'mono',
      );
    }
    if (currentBeat === 0) footer(ctx, api, '↵ marks a line break in the preview');
  });
}
export default {
  id: 'history-cap',
  draw: drawHistoryCap,
  cues: [
    'history-raw',
    'history-preview',
    'history-marker',
    'history-grow',
    'history-candidate',
    'repeat-peek',
    'tight-history',
    'history-stop',
  ],
};
