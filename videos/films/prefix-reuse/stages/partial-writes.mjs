import { priceInput, clamp } from '../arithmetic.mjs';
import { drawText, footer, mark, tokenRail } from '../defaults.mjs';
export function drawPartialWrites(ctx, scene, state, api) {
  return api.focus.target('partial-writes-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    const cueComplete = (id) => cueProgress(id) === 1;
    {
      const repaired = currentBeat === 2 && cueVisible('partial-repair'),
        rows = Array.from(
          {
            length: 4,
          },
          (_, i) => ({
            read: i ? 1024 : 0,
            write: repaired ? (i ? 0 : 1024) : i ? 4976 : 6000,
            ordinary: repaired ? 4976 : 0,
          }),
        );
      drawText(ctx, api, 'Four 6,000-token requests · same 1,024-token front', 150, 270, 32);
      rows.forEach((row, i) => {
        const y = 365 + i * 130,
          show = currentBeat > 0 || i === 0 || cueVisible('partial-share');
        drawText(ctx, api, 'R' + (i + 1), 150, y + 42, 28, themeColors.muted);
        if (show) {
          tokenRail(
            ctx,
            api,
            250,
            y,
            1000,
            [row.read, row.write, row.ordinary],
            6000,
            [themeColors.blue, themeColors.yellow, themeColors.cyan],
            65,
          );
          const ready =
            currentBeat === 0
              ? false
              : currentBeat === 1
                ? i === 0
                  ? cueComplete('partial-first')
                  : cueComplete('partial-later-total')
                : !repaired ||
                  (i === 0
                    ? cueComplete('partial-repaired-first')
                    : cueComplete('partial-repaired-later'));
          if (ready)
            drawText(
              ctx,
              api,
              priceInput([row]).toLocaleString('en-US', {
                maximumFractionDigits: 1,
              }) + ' units',
              1380,
              y + 44,
              29,
              repaired ? themeColors.green : themeColors.yellow,
            );
        }
      });
      if (currentBeat === 1) {
        mark(ctx, api, 'partial-read', () => {
          drawText(
            ctx,
            api,
            cueComplete('partial-read') ? 'Later read: 102.4' : 'Read cost pending',
            330,
            945,
            28,
            cueComplete('partial-read') ? themeColors.blue : themeColors.muted,
          );
        });
        mark(ctx, api, 'partial-write', () => {
          drawText(
            ctx,
            api,
            cueComplete('partial-write') ? 'Later write: 6,220' : 'Write cost pending',
            850,
            945,
            28,
            cueComplete('partial-write') ? themeColors.yellow : themeColors.muted,
          );
        });
        mark(ctx, api, 'partial-total', () => {
          drawText(
            ctx,
            api,
            cueComplete('partial-total')
              ? 'Total ' +
                  priceInput(rows).toLocaleString('en-US') +
                  (cueComplete('partial-cold') ? ' > 24,000 cold' : ' units')
              : 'Total pending',
            1510,
            945,
            29,
            cueComplete('partial-cold') ? themeColors.pink : themeColors.muted,
            'center',
          );
        });
      } else if (currentBeat === 2) {
        mark(ctx, api, 'partial-repair', () =>
          drawText(
            ctx,
            api,
            repaired
              ? 'Marker moves to 1,024 · changing tails become ordinary input'
              : 'Keep the same requests; change the write boundary',
            960,
            925,
            29,
            repaired ? themeColors.green : themeColors.muted,
            'center',
          ),
        );
        mark(ctx, api, 'partial-repaired-total', () => {
          drawText(
            ctx,
            api,
            cueComplete('partial-repaired-total')
              ? 'Repriced total ' + priceInput(rows).toLocaleString('en-US') + ' < 24,000'
              : 'Repriced total pending',
            960,
            1005,
            34,
            cueComplete('partial-repaired-total') ? themeColors.green : themeColors.muted,
            'center',
          );
        });
      } else
        footer(
          ctx,
          api,
          'Blue reads · yellow writes · every changing suffix has a distinct identity.',
        );
    }
  });
}
export default {
  id: 'partial-writes',
  draw: drawPartialWrites,
  cues: [
    'partial-rows',
    'partial-share',
    'partial-first',
    'partial-read',
    'partial-write',
    'partial-total',
    'partial-later-total',
    'partial-cold',
    'partial-repair',
    'partial-repaired-first',
    'partial-repaired-total',
    'partial-repaired-later',
  ],
};
