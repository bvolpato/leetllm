import { cueStarted, limit } from '../construction.mjs';
import { box, constructionText, footer, line, title } from '../defaults.mjs';
export function drawSingleToken(ctx, scene, state, api) {
  api.focus.target('single-token-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    const beg = (name, fallback = progress > 0.4) => cueStarted(state.cues, name, fallback);
    {
      title(ctx, api, 'r02 · one token creates zero inter-token intervals');
      const x = (t) => 350 + ((t - 100) / 250) * 1200;
      line(ctx, api, 350, 650, 1550, 650);
      for (const t of [100, 150, 200, 250, 300, 350]) {
        line(ctx, api, x(t), 640, x(t), 660);
        constructionText(ctx, api, t + ' ms', x(t), 710, 24, themeColors.muted, 'center');
      }
      [
        ['send', 125, themeColors.cyan],
        ['one token', 295, themeColors.green],
        ['terminal', 310, themeColors.pink],
      ].forEach(([label, t, col], i) => {
        const labelX = 440 + i * 510;
        line(ctx, api, labelX, 470, x(t), 650, col, 4);
        constructionText(ctx, api, label, labelX, 365, 29, col, 'center');
        constructionText(ctx, api, String(t), labelX, 425, 29, col, 'center');
      });
      if (currentBeat === 0)
        box(
          ctx,
          api,
          'TPOT = (last token − first token) / (n − 1)',
          300,
          850,
          1320,
          85,
          themeColors.cyan,
          32,
        );
      else {
        box(ctx, api, 'TTFT = 295 − 125 = 170 ms', 220, 865, 700, 80, themeColors.green);
        if (currentBeat > 1 || beg('single-null', progress > 0.5))
          box(ctx, api, 'TPOT = 0 / 0 → null', 1040, 865, 650, 80, themeColors.yellow);
      }
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Endpoint contract: empty text success is invalid; equal timestamps are allowed'
          : 'r02 remains eligible for success, TTFT and supplied quality checks',
      );
    }
    return true;
  });
}
export default {
  id: 'single-token',
  draw: drawSingleToken,
  cues: ['single-token-beat-0', 'single-token-beat-1', 'single-null', 'single-token-beat-2'],
};
