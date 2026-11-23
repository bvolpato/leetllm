import { q } from '../construction.mjs';
import { decodeSequenceSnapshot } from '../model.mjs';
import { arrow, box, focus, math, text } from '../defaults.mjs';
export function drawAttention(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const four = q(state, 'attention-four', 0),
      eight = q(state, 'attention-eight', 0),
      decode = q(state, 'attention-decode', 1),
      appended = q(state, 'attention-append', 1) > 0 || decode > 0,
      sum = q(state, 'attention-sum', 1),
      general = q(state, 'attention-general', 1),
      cache = q(state, 'attention-cache', 1),
      sequence = decodeSequenceSnapshot(state);
    focus(ctx, api, themeColors, 'attention-work', () => {
      if (beat === 0) {
        const n = eight > 0 ? 8 : 4,
          count = Math.floor(16 * four) + Math.floor(48 * eight);
        text(ctx, api, themeColors, 'Query positions × key positions', 960, 275, 36);
        for (let r = 0; r < n; r++)
          for (let c = 0; c < n; c++) {
            const old = r < 4 && c < 4,
              order = old
                ? r * 4 + c
                : 16 +
                  Array.from(
                    {
                      length: n,
                    },
                    (_, rr) =>
                      Array.from(
                        {
                          length: n,
                        },
                        (_, cc) => ({
                          r: rr,
                          c: cc,
                        }),
                      ),
                  )
                    .flat()
                    .filter((p) => p.r >= 4 || p.c >= 4)
                    .findIndex((p) => p.r === r && p.c === c);
            api.rect(
              ctx,
              240 + c * 72,
              350 + r * 72,
              64,
              64,
              order < count ? (old ? themeColors.blue : themeColors.cyan) : themeColors.panel,
              1,
              3,
              themeColors.muted,
            );
          }
        text(ctx, api, themeColors, count + ' score positions', 1340, 505, 45, themeColors.yellow);
        math(
          ctx,
          api,
          themeColors,
          String.raw`S(t)=t^2,\quad W_{\mathrm{prefill}}\in\Theta(t^2d_k)`,
          1350,
          710,
          37,
          themeColors.ink,
        );
      } else if (sequence.progress > 0) {
        text(
          ctx,
          api,
          themeColors,
          'Continue from the same 8-key history',
          960,
          265,
          32,
          themeColors.ink,
        );
        const x0 = 535,
          y0 = 360,
          cellWidth = 104,
          cellHeight = 54,
          stepX = 117,
          stepY = 76;
        for (let column = 0; column < 11; column++)
          text(
            ctx,
            api,
            themeColors,
            String(column + 1),
            x0 + column * stepX + cellWidth / 2,
            335,
            26,
            themeColors.muted,
          );
        sequence.rows.forEach((row, rowIndex) => {
          const y = y0 + rowIndex * stepY;
          text(
            ctx,
            api,
            themeColors,
            'Step ' + row.step + ' · ' + row.keysRead + ' keys',
            490,
            y + 34,
            27,
            rowIndex === sequence.activeRow ? themeColors.yellow : themeColors.muted,
            'right',
          );
          for (let column = 0; column < row.keysRead; column++) {
            const done =
              rowIndex < sequence.completedRows ||
              (rowIndex === sequence.activeRow && column < sequence.activeReads);
            const active = rowIndex === sequence.activeRow && column === sequence.activeReads;
            const color = active
              ? themeColors.yellow
              : column < 8
                ? themeColors.blue
                : column === 8
                  ? themeColors.cyan
                  : themeColors.green;
            api.rect(
              ctx,
              x0 + column * stepX,
              y,
              cellWidth,
              cellHeight,
              done ? color : themeColors.panel,
              1,
              5,
              active ? themeColors.yellow : themeColors.muted,
            );
          }
        });
        text(
          ctx,
          api,
          themeColors,
          sequence.keyReads + ' key reads accumulated',
          960,
          630,
          29,
          themeColors.cyan,
        );
      } else {
        text(
          ctx,
          api,
          themeColors,
          'Append current K/V, then read 8 prior keys + its own',
          960,
          280,
          34,
        );
        const completed = Math.floor(decode * 9 + 1e-9),
          active = decode > 0 && completed < 9 ? completed : -1;
        for (let i = 0; i < 9; i++)
          box(
            ctx,
            api,
            themeColors,
            i === 8 && !appended ? 'new K/V' : 'key ' + (i + 1),
            170 + i * 180,
            415,
            160,
            95,
            i === 8 && !appended
              ? themeColors.muted
              : i === active
                ? themeColors.yellow
                : i < completed
                  ? themeColors.cyan
                  : themeColors.blue,
            29,
          );
        box(ctx, api, themeColors, 'new query', 870, 600, 180, 95, themeColors.yellow, 28);
        if (active >= 0) arrow(ctx, api, 960, 600, 250 + active * 180, 510, themeColors.yellow, 4);
        text(
          ctx,
          api,
          themeColors,
          active >= 0 ? 'Comparing key ' + (active + 1) + ' / 9' : completed + ' / 9 keys compared',
          960,
          735,
          31,
          themeColors.yellow,
        );
        math(
          ctx,
          api,
          themeColors,
          String.raw`W_{\mathrm{one\ decode\ step}}\in\Theta(td_k)`,
          960,
          800,
          46,
          themeColors.cyan,
        );
      }
    });
    focus(ctx, api, themeColors, 'attention-total', () => {
      if (beat === 1 && sequence.progress > 0 && sum > 0) {
        text(
          ctx,
          api,
          themeColors,
          'Three consumed inputs: 9 + 10 + 11 = 30 key reads',
          960,
          665,
          29,
          themeColors.cyan,
        );
        if (sum === 1)
          math(
            ctx,
            api,
            themeColors,
            String.raw`W_3(8)=(9+10+11)d_k=30d_k`,
            960,
            710,
            37,
            themeColors.yellow,
          );
      }
      if (beat === 1 && sequence.progress > 0 && general > 0) {
        text(
          ctx,
          api,
          themeColors,
          'G consumed inputs · t previously cached positions',
          960,
          758,
          26,
          themeColors.muted,
        );
        if (general === 1)
          math(
            ctx,
            api,
            themeColors,
            String.raw`W_G(t)=d_k\left[Gt+\frac{G(G+1)}{2}\right]\in\Theta((Gt+G^2)d_k)`,
            960,
            802,
            28,
            themeColors.green,
          );
      }
    });
    focus(ctx, api, themeColors, 'attention-cache', () => {
      if (beat === 1) {
        const cachePositions = sequence.progress > 0 ? sequence.cachePositions : appended ? 9 : 8;
        text(
          ctx,
          api,
          themeColors,
          appended
            ? 'Cache after current input append: ' + cachePositions + ' positions'
            : 'Prior completed cache: 8 positions',
          960,
          862,
          26,
          cache > 0 ? themeColors.green : themeColors.muted,
        );
        for (let i = 0; i < cachePositions; i++) {
          const color = i < 8 ? themeColors.blue : cache > 0 ? themeColors.green : themeColors.cyan;
          box(ctx, api, themeColors, 'K/V ' + (i + 1), 455 + i * 128, 894, 112, 54, color, 26);
        }
      }
    });
  }
}
export default {
  id: 'attention',
  draw: drawAttention,
  cues: [
    'attention-four',
    'attention-eight',
    'attention-append',
    'attention-decode',
    'attention-rows',
    'attention-sum',
    'attention-general',
    'attention-cache',
  ],
};
