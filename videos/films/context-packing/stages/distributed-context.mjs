import { longContextModel } from '../construction.mjs';
import { contextText, footer, modelTarget, ring } from '../defaults.mjs';
export function drawDistributedContext(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('distributed-context', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat < 2) {
      contextText(
        ctx,
        api,
        'Stationary query owners · remote KV blocks travel',
        960,
        270,
        38,
        themeColors.cyan,
      );
      const spots = [
          [480, 500],
          [1440, 500],
          [1440, 750],
          [480, 750],
        ],
        rail = [
          [210, 355],
          [1710, 355],
          [1710, 920],
          [210, 920],
        ],
        colors = [themeColors.blue, themeColors.green, themeColors.pink, themeColors.yellow],
        step = progress * 4;
      spots.forEach(([x, y], i) => {
        ring(ctx, api, x, y, 78, colors[i]);
        contextText(ctx, api, 'Q' + i, x, y + 12, 35, colors[i]);
        const from = rail[(i + Math.floor(step)) % 4],
          to = rail[(i + Math.floor(step) + 1) % 4],
          f = step - Math.floor(step);
        const bx = api.lerp(from[0], to[0], f),
          by = api.lerp(from[1], to[1], f);
        const paint = () => {
          api.rect(ctx, bx - 66, by - 35, 132, 70, themeColors.panel, colors[i], 3);
          contextText(ctx, api, 'KV' + i, bx, by + 12, 29, colors[i]);
        };
        if (i === 0) modelTarget(ctx, api, 'distributed-context', paint);
        else paint();
        for (let j = 0; j < 4; j++) {
          const received = j < Math.min(4, Math.floor(step));
          api.rect(
            ctx,
            x - 96 + j * 50,
            y + 97,
            42,
            34,
            received ? colors[(i - j + 4) % 4] : themeColors.panel,
            themeColors.muted,
            1,
          );
        }
        contextText(
          ctx,
          api,
          Math.min(4, Math.floor(step)) + '/4 remote blocks',
          x + (i === 0 || i === 3 ? 220 : -220),
          y + 12,
          24,
          themeColors.muted,
        );
      });
      footer(
        ctx,
        api,
        'Ring Attention training picture · serving communication depends on phase and backend',
      );
    } else {
      contextText(
        ctx,
        api,
        'Four groups of 16 positions form one 64-position logical block',
        960,
        270,
        34,
        themeColors.cyan,
      );
      for (let i = 0; i < 4; i++) {
        api.rect(ctx, 370 + i * 300, 380, 280, 90, themeColors.panel, themeColors.blue, 3);
        contextText(ctx, api, '16 positions', 510 + i * 300, 438, 32, themeColors.blue);
      }
      const n = Math.ceil(17 * progress);
      for (let i = 0; i < 17; i++)
        api.rect(
          ctx,
          230 + i * 86,
          660,
          78,
          110,
          i < n ? themeColors.green : themeColors.panel,
          themeColors.muted,
          1,
        );
      modelTarget(ctx, api, 'distributed-context', () =>
        contextText(
          ctx,
          api,
          '1,025 tokens → 17 logical blocks → 1,088 positions',
          960,
          865,
          43,
          themeColors.green,
        ),
      );
      contextText(
        ctx,
        api,
        'Physical-size-only rounding gives the wrong 1,040-position grid',
        960,
        945,
        31,
        themeColors.red,
      );
    }
  }
}
export default {
  id: 'distributed-context',
  draw: drawDistributedContext,
  cues: ['distributed-context-0', 'distributed-context-1', 'distributed-context-2'],
};
