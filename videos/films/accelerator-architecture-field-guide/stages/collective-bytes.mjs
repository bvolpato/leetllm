import { ringTraffic } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';
import { drawCard, drawCenteredText, drawFooter, drawLine } from '../defaults.mjs';
export function drawCollectiveBytes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('collective-bytes-mechanism', () => {
    if (currentBeat === 2) {
      drawCenteredText(
        ctx,
        api,
        'Separate Trainium2 domain · 16 chips · 4 × 4 torus',
        960,
        285,
        32,
        themeColors.yellow,
      );
      const nodes = Array.from(
        {
          length: 16,
        },
        (_, i) => ({
          id: i,
          x: 600 + (i % 4) * 240,
          y: 400 + Math.floor(i / 4) * 140,
        }),
      );
      const edge = (a, z) => {
        const dx = z.x - a.x,
          dy = z.y - a.y,
          len = Math.hypot(dx, dy);
        drawLine(
          ctx,
          api,
          a.x + (dx / len) * 40,
          a.y + (dy / len) * 40,
          z.x - (dx / len) * 40,
          z.y - (dy / len) * 40,
          themeColors.cyan,
          3,
        );
      };
      for (let r = 0; r < 4; r++)
        for (let col = 0; col < 3; col++) edge(nodes[r * 4 + col], nodes[r * 4 + col + 1]);
      for (let col = 0; col < 4; col++)
        for (let r = 0; r < 3; r++) edge(nodes[r * 4 + col], nodes[(r + 1) * 4 + col]);
      if (B('torus', 2)) {
        for (let r = 0; r < 4; r++) {
          const y = 400 + r * 140;
          api.path(
            ctx,
            [
              {
                x: 560,
                y,
              },
              {
                x: 470,
                y,
              },
              {
                x: 470,
                y: y - 55,
              },
              {
                x: 1450,
                y: y - 55,
              },
              {
                x: 1450,
                y,
              },
              {
                x: 1360,
                y,
              },
            ],
            {
              color: themeColors.blue,
              width: 2,
            },
          );
        }
        for (let col = 0; col < 4; col++) {
          const x = 600 + col * 240;
          api.path(
            ctx,
            [
              {
                x,
                y: 360,
              },
              {
                x,
                y: 320,
              },
              {
                x: x - 70,
                y: 320,
              },
              {
                x: x - 70,
                y: 930,
              },
              {
                x,
                y: 930,
              },
              {
                x,
                y: 860,
              },
            ],
            {
              color: themeColors.green,
              width: 2,
            },
          );
        }
      }
      nodes.forEach((n) => {
        api.circle(ctx, n.x, n.y, 32, themeColors.panel, themeColors.cyan, 3);
        drawCenteredText(ctx, api, n.id, n.x, n.y + 9, 26, themeColors.cyan);
      });
      drawFooter(ctx, api, 'Measure the collective on the links that join your ranks.');
    } else {
      const r = ringTraffic(128 * 1024, 4),
        positions = [
          {
            x: 400,
            y: 400,
          },
          {
            x: 1450,
            y: 400,
          },
          {
            x: 1450,
            y: 800,
          },
          {
            x: 400,
            y: 800,
          },
        ];
      drawCenteredText(
        ctx,
        api,
        currentBeat === 0
          ? '8 × 8,192 × 2 B = 128 KiB logical payload'
          : 'Four-rank ring · 32 KiB chunk / send',
        960,
        285,
        33,
        themeColors.yellow,
      );
      const progress = currentBeat === 0 ? 0 : currentBeat === 1 ? ev('sent', 1) : 1,
        total = progress * 6,
        complete = Math.min(6, Math.floor(total)),
        fraction = total - complete;
      positions.forEach((n, i) => {
        const z = positions[(i + 1) % 4],
          dx = z.x - n.x,
          dy = z.y - n.y,
          len = Math.hypot(dx, dy),
          gap = dx ? 160 : 85;
        drawLine(
          ctx,
          api,
          n.x + (dx / len) * gap,
          n.y + (dy / len) * gap,
          z.x - (dx / len) * gap,
          z.y - (dy / len) * gap,
          themeColors.muted,
          3,
        );
      });
      positions.forEach((n, i) =>
        drawCard(ctx, api, 'Rank ' + i, n.x - 140, n.y - 65, 280, 130, themeColors.blue, 34),
      );
      if (currentBeat > 0) {
        positions.forEach((n, i) => {
          const z = positions[(i + 1) % 4],
            dx = z.x - n.x,
            dy = z.y - n.y,
            len = Math.hypot(dx, dy),
            gap = Math.abs(dx) > 0 ? 230 : 130,
            start = {
              x: n.x + (dx / len) * gap,
              y: n.y + (dy / len) * gap,
            },
            end = {
              x: z.x - (dx / len) * gap,
              y: z.y - (dy / len) * gap,
            };
          if (complete < 6)
            drawCard(
              ctx,
              api,
              'chunk ' + ((((i - complete) % 4) + 4) % 4),
              api.lerp(start.x, end.x, fraction) - 70,
              api.lerp(start.y, end.y, fraction) - 32,
              140,
              64,
              complete < 3 ? themeColors.cyan : themeColors.green,
              25,
            );
        });
        drawCenteredText(
          ctx,
          api,
          complete + ' completed sends × 32 KiB = ' + complete * 32 + ' KiB / rank',
          960,
          600,
          31,
          themeColors.cyan,
        );
        if (resultComplete('sent', 1) || currentBeat > 1)
          drawCenteredText(
            ctx,
            api,
            '2 × (4 − 1) / 4 × 128 = 192 KiB sent / rank',
            960,
            960,
            34,
            themeColors.yellow,
          );
      }
      if (currentBeat === 2 && B('torus', 2)) {
        drawCenteredText(
          ctx,
          api,
          'Separate Trainium2 domain: 16 chips arranged 4×4',
          960,
          335,
          29,
          themeColors.green,
        );
      }
      drawFooter(
        ctx,
        api,
        currentBeat === 0
          ? 'How many bytes will one rank send?'
          : complete < 3
            ? 'Reduce-scatter   ·   Combine the chunks'
            : 'All-gather   ·   Share the reduced chunks',
      );
    }
  });
}
export default {
  id: 'collective-bytes',
  draw: drawCollectiveBytes,
  cues: [
    'ag-collective-bytes-count',
    'ag-collective-bytes-payload',
    'ag-collective-bytes-factor',
    'ag-collective-bytes-sent',
    'ag-collective-bytes-torus',
  ],
};
