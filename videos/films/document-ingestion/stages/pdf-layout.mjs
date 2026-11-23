import {
  arrow,
  cueProgress,
  cueStarted,
  detailText,
  fade,
  focusTarget,
  footer,
  heading,
  line,
  recordField,
  rectangle,
  sourcePage,
} from '../defaults.mjs';
export function drawPdfLayout(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const complete = (id) => cueProgress(ctx, api, id) === 1;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'The same extractor sees three different page geometries');
      focusTarget(ctx, api, 'pdf-fixture', () => {
        sourcePage(ctx, api, 145, 350, 380, 360, 'Page 1 · native text', [
          'Rollback failure:',
          'page on-call within',
          '15 minutes with deploy ID.',
        ]);
        sourcePage(ctx, api, 650, 350, 380, 360, 'Page 2 · intentionally blank', []);
        sourcePage(ctx, api, 1155, 350, 620, 360, 'Page 3 · two columns', []);
        ['Rollback failure:', 'page on-call within', '15 minutes with deploy ID.'].forEach((s, i) =>
          detailText(ctx, api, s, 1173, 472 + i * 67, 23, themeColors.yellow),
        );
        ['Routine deploy notes:', 'archive within', '14 days.'].forEach((s, i) =>
          detailText(ctx, api, s, 1483, 472 + i * 67, 23, themeColors.cyan),
        );
      });
      if (cueStarted(ctx, api, 'pdf-lengths'))
        focusTarget(ctx, api, 'pdf-lengths', () => {
          if (!complete('pdf-lengths')) {
            [335, 840, 1465].forEach((x) =>
              detailText(ctx, api, 'counts pending', x, 770, 29, themeColors.muted, 'center'),
            );
            return;
          }
          [64, 0, 110].forEach((n, i) => {
            const x = [335, 840, 1465][i];
            detailText(
              ctx,
              api,
              n + ' characters',
              x,
              770,
              32,
              i === 1 ? themeColors.muted : themeColors.cyan,
              'center',
            );
            arrow(ctx, api, x, 716, x, 739);
          });
        });
      if (cueStarted(ctx, api, 'column-order'))
        focusTarget(ctx, api, 'column-order', () => {
          const step = Math.min(5, Math.floor(cueProgress(ctx, api, 'column-order') * 6));
          const points = [
            [1325, 500],
            [1625, 500],
            [1325, 567],
            [1625, 567],
            [1325, 634],
            [1625, 634],
          ];
          for (let i = 1; i <= step; i++) {
            const [x, y] = points[i - 1],
              [u, v] = points[i];
            if (y === v) arrow(ctx, api, x, y, u, v, themeColors.pink);
            else {
              line(ctx, api, x, y, 1465, y, themeColors.pink);
              line(ctx, api, 1465, y, 1465, v, themeColors.pink);
              arrow(ctx, api, 1465, v, u, v, themeColors.pink);
            }
          }
          detailText(ctx, api, 'Page 3', 355, 885, 37, themeColors.blue);
          detailText(ctx, api, 'Native extract', 355, 939, 31, themeColors.muted);
          [
            'Rollback failure: Routine deploy notes:',
            'page on-call within archive within',
            '15 minutes with deploy ID. 14 days.',
          ].slice(0, 1 + Math.floor(step / 2)).forEach((output, i) =>
            detailText(ctx, api, output, 685, 866 + i * 56, 33, themeColors.ink));
        });
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Copyable text can still be an OCR hypothesis');
      focusTarget(ctx, api, 'layer-types', () => {
        [
          ['Native content stream', 'glyph positions → text', themeColors.blue],
          ['Image-only scan', 'pixels → OCR candidate', themeColors.pink],
          ['Scan + old text layer', 'pixels + copyable hypothesis', themeColors.yellow],
        ].forEach(([name, detail, col], i) => {
          sourcePage(ctx, api, 155 + i * 565, 350, 480, 210, name, [detail], col);
        });
      });
      if (cueStarted(ctx, api, 'empty-page'))
        focusTarget(ctx, api, 'empty-page', () => {
          detailText(
            ctx,
            api,
            'Empty extract: inspect the pixels',
            960,
            634,
            32,
            themeColors.yellow,
            'center',
          );
          [
            ['blank source', 'retain empty-page outcome'],
            ['photographed rule', 'route to OCR'],
            ['visible native text', 'investigate parser failure'],
          ].forEach(([s, t], i) => {
            recordField(
              ctx,
              api,
              s,
              t,
              170 + i * 565,
              690,
              460,
              i === 0 ? themeColors.muted : themeColors.cyan,
            );
          });
        });
      if (cueStarted(ctx, api, 'encoding-review'))
        focusTarget(ctx, api, 'encoding-review', () => {
          recordField(
            ctx,
            api,
            'Replacement glyph �',
            'review_encoding',
            420,
            808,
            1080,
            themeColors.pink,
          );
        });
      if (cueStarted(ctx, api, 'pdf-tags'))
        focusTarget(ctx, api, 'pdf-tags', () => {
          detailText(
            ctx,
            api,
            'Tagged logical order → extractor behavior → source comparison',
            960,
            946,
            28,
            themeColors.cyan,
            'center',
          );
        });
    } else {
      heading(ctx, api, 'Remove only the explicitly identified header');
      const clean = cueProgress(ctx, api, 'known-header'),
        x = 220;
      focusTarget(ctx, api, 'known-header', () => {
        sourcePage(ctx, api, 220, 350, 820, 550, 'Source page · page=7', [], themeColors.blue);
        fade(ctx, api, 1 - clean, () =>
          detailText(
            ctx,
            api,
          'PLATFORM RUNBOOK | INTERNAL',
            220 + 35,
            465 - 25 * clean,
            30,
            themeColors.muted,
          ),
        );
        detailText(ctx, api, 'Rollback failure: page on-call', 220 + 35, 550, 30, themeColors.ink);
        detailText(
          ctx,
          api,
          'within 15 minutes with deploy ID.',
          220 + 35,
          608,
          30,
          themeColors.yellow,
        );
        detailText(
          ctx,
          api,
          'Safety warning: stop if recovery fails.',
          220 + 35,
          704,
          28,
          themeColors.pink,
        );
        detailText(ctx, api, 'Page 7', 220 + 35, 852, 25, themeColors.muted);
      });
      recordField(
        ctx,
        api,
        'Parser-route heuristic',
        '30 characters',
        1120,
        370,
        610,
        themeColors.muted,
      );
      recordField(
        ctx,
        api,
        'Known-rule fixture',
        '40 characters',
        1120,
        470,
        610,
        themeColors.muted,
      );
      if (cueStarted(ctx, api, 'retain-warning'))
        focusTarget(ctx, api, 'retain-warning', () => {
          rectangle(ctx, api, 220 + 22, 660, 770, 84, themeColors.pink, null);
          detailText(
            ctx,
            api,
            'Repeats on every page ≠ disposable',
            1415,
            651,
            27,
            themeColors.pink,
            'center',
          );
        });
      if (cueStarted(ctx, api, 'footer-locator'))
        focusTarget(ctx, api, 'footer-locator', () => {
          arrow(ctx, api, 520, 866, 1090, 825, themeColors.cyan);
          recordField(
            ctx,
            api,
            'Record locator',
            'page=7 retained',
            1110,
            800,
            625,
            themeColors.cyan,
          );
        });
      footer(
        ctx,
        api,
        'Character thresholds route this fixture; source review establishes fidelity.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'pdf-layout',
  draw: drawPdfLayout,
  cues: [
    'pdf-fixture',
    'column-order',
    'pdf-lengths',
    'layer-types',
    'empty-page',
    'encoding-review',
    'pdf-tags',
    'known-header',
    'retain-warning',
    'footer-locator',
  ],
};
