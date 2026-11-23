import { records, valid } from '../fixtures.mjs';
import { drawOriginalText, drawOriginalVisualFocus } from '../defaults.mjs';
export function drawIntake(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    const rows = records.slice(0, 4),
      check =
        currentBeat === 0 ? 0 : currentBeat === 1 ? api.focus.progress('intake-beat-2-focus-1') : 1;
    drawOriginalText(
      ctx,
      api,
      'Raw intake · declared fields',
      190,
      295,
      34,
      themeColors.cyan,
      'left',
    );
    [
      ['ID', 190],
      ['conversation', 320],
      ['message', 560],
      ['reviewed label', 1245],
    ].forEach(([label, x]) =>
      drawOriginalText(ctx, api, label, x, 375, 26, themeColors.muted, 'left'),
    );
    drawOriginalVisualFocus(ctx, api, 'intake-object-ticket-16', () => {
      rows.forEach((row, i) => {
        const y = 470 + i * 100,
          col = row.label ? themeColors.cyan : themeColors.red;
        api.line(ctx, 175, y + 32, 1505, y + 32, themeColors.grid, 1);
        drawOriginalText(ctx, api, row.id, 190, y, 32, col, 'left');
        drawOriginalText(ctx, api, row.conversation, 320, y, 28, themeColors.blue, 'left');
        const short = [
          'Build is still failing',
          '  BUILD is still failing  ',
          'Where is the deploy policy?',
          'SEV-123 timeline',
        ][i];
        drawOriginalText(ctx, api, short, 560, y, 27, themeColors.ink, 'left');
        drawOriginalText(ctx, api, row.label ?? 'missing', 1245, y, 28, col, 'left');
        if (check > 0) {
          const validRow = valid(row);
          drawOriginalText(
            ctx,
            api,
            validRow ? '✓' : '×',
            1470,
            y,
            36,
            validRow ? themeColors.green : themeColors.red,
          );
        }
      });
    });
    if (check > 0) {
      drawOriginalText(ctx, api, '3 pass', 1660, 510, 38, themeColors.green);
      drawOriginalText(ctx, api, '1 quarantine', 1660, 710, 30, themeColors.red);
      api.line(ctx, 1515, 760, 1620, 760, themeColors.red, 3);
      api.components.particle({
        points: [
          {
            x: 1515,
            y: 760,
          },
          {
            x: 1620,
            y: 760,
          },
        ],
        progress: check,
        radius: 6,
        fill: themeColors.red,
      });
      drawOriginalText(ctx, api, '104', 1660, 790, 30, themeColors.red);
    }
    if (currentBeat === 2) {
      drawOriginalText(ctx, api, 'Batch lens', 190, 900, 30, themeColors.yellow, 'left');
      drawOriginalText(ctx, api, 'missing: 1 / 4', 550, 900, 32, themeColors.red);
      drawOriginalText(
        ctx,
        api,
        'surviving labels: 2 escalate · 1 standard',
        1190,
        900,
        30,
        themeColors.cyan,
      );
    } else
      drawOriginalText(
        ctx,
        api,
        'Inspect each required field before counting the batch.',
        960,
        920,
        30,
        themeColors.muted,
      );
  }
}

// The executable Python article is authoritative. This illustrated subset covers its
// ASCII ticket fixture plus the explicitly demonstrated compatibility/sharp-s forms.
export default {
  id: 'intake',
  draw: drawIntake,
  cues: ['intake-beat-1-focus-1', 'intake-beat-2-focus-1', 'intake-beat-3-focus-1'],
};
