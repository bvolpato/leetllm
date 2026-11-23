import { cueStarted, limit } from '../construction.mjs';
import { constructionText, footer, title } from '../defaults.mjs';
export function drawGoodputCapacity(ctx, scene, state, api) {
  api.focus.target('goodput-capacity-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    const beg = (name, fallback = progress > 0.4) => cueStarted(state.cues, name, fallback);
    {
      const second =
        currentBeat > 1 || (currentBeat === 1 && beg('goodput-second-run', progress > 0.5));
      title(ctx, api, 'Useful-work rate can rise while the service promise fails');
      const cases = [
        {
          rate: 1.5,
          n: 200,
          qual: 190,
          t: 200 / 1.5,
        },
        {
          rate: 2,
          n: 200,
          qual: 160,
          t: 100,
        },
      ];
      cases.forEach((r, i) => {
        const yy = 420 + i * 265,
          show = i === 0 || second;
        constructionText(
          ctx,
          api,
          `${r.rate} offered /s`,
          240,
          yy + 20,
          32,
          i ? themeColors.red : themeColors.green,
        );
        api.rect(ctx, 650, yy - 30, 1000, 70, themeColors.panel, themeColors.border, 2);
        if (show) {
          api.rect(
            ctx,
            650,
            yy - 30,
            (1000 * r.qual) / r.n,
            70,
            i ? themeColors.red : themeColors.green,
          );
          constructionText(
            ctx,
            api,
            `${r.qual} / ${r.n} = ${(100 * r.qual) / r.n}%`,
            1100,
            yy + 100,
            32,
            i ? themeColors.red : themeColors.green,
            'center',
          );
          const usefulPerSecond = Math.round((100 * r.qual * r.rate) / r.n) / 100;
          constructionText(
            ctx,
            api,
            `${r.qual} / ${r.t.toFixed(2)} s ≈ ${usefulPerSecond.toFixed(2)} useful /s`,
            1100,
            yy + 160,
            31,
            themeColors.cyan,
            'center',
          );
        }
      });
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Arrival window only  ·  95% of offered requests must qualify'
          : 'Each run receives the same 200 requests.',
      );
    }
    return true;
  });
}
export default {
  id: 'goodput-capacity',
  draw: drawGoodputCapacity,
  cues: [
    'goodput-capacity-beat-0',
    'goodput-capacity-beat-1',
    'goodput-second-run',
    'goodput-capacity-beat-2',
  ],
};
