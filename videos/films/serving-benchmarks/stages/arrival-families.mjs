import { SERVING_COHORT } from '../fixtures.mjs';
import { cueProgress, limit } from '../construction.mjs';
import { constructionText, footer, line, timeAxis, title } from '../defaults.mjs';
export function drawArrivalFamilies(ctx, scene, state, api) {
  api.focus.target('arrival-families-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    const q = (name, fallback = progress) => cueProgress(state.cues, name, fallback);
    {
      if (currentBeat === 0) {
        title(ctx, api, 'Same mean arrival rate · different gap variability');
        const rows = [
          ['regular', 0, 1],
          ['Poisson', 1, 1],
          ['Gamma k=¼', 2, 0.25],
          ['Gamma k=4', 0.5, 4],
        ];
        rows.forEach(([name, cv, k], i) => {
          const y = 405 + i * 125;
          constructionText(
            ctx,
            api,
            name,
            210,
            y + 28,
            30,
            [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
          );
          line(ctx, api, 560, y + 20, 1560, y + 20, themeColors.border, 2);
          const w = cv * 360;
          line(
            ctx,
            api,
            560,
            y + 20,
            560 + w,
            y + 20,
            [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
            15,
          );
          constructionText(ctx, api, `CV = ${cv}`, 1640, y + 30, 30, themeColors.ink, 'center');
        });
        footer(ctx, api, 'CV = gap standard deviation / mean gap; Gamma CV = 1 / √k');
      } else if (currentBeat === 1) {
        title(ctx, api, 'Six arrivals at three requests per second');
        const raw = [0.12, 0.37, 0.61, 0.72, 1.35, 1.69],
          end = 6 / 3,
          scale = end / raw.at(-1);
        const stretch = 1 + (scale - 1) * q('arrival-families-beat-1');
        [raw, raw.map((t) => t * stretch)].forEach((row, i) => {
          const y = 455 + i * 265;
          timeAxis(ctx, api, 360, y, 1250, 2.2, [0, 1, 2]);
          row.forEach((t, j) => {
            const x = 360 + (t / 2.2) * 1250;
            line(ctx, api, x, y - 35, x, y + 12, i ? themeColors.cyan : themeColors.blue, 5);
            constructionText(
              ctx,
              api,
              String(j + 1),
              x,
              y - 55,
              24,
              i ? themeColors.cyan : themeColors.blue,
              'center',
            );
          });
          constructionText(
            ctx,
            api,
            i ? 'Rescaled arrivals' : 'Sampled arrivals',
            220,
            y - 125,
            29,
            i ? themeColors.cyan : themeColors.blue,
          );
          constructionText(
            ctx,
            api,
            'Last arrival  ' + row.at(-1).toFixed(2) + ' s',
            1550,
            y - 125,
            32,
            i ? themeColors.cyan : themeColors.blue,
            'right',
          );
        });
        footer(ctx, api, 'Self-timed replay instead follows retained timestamps');
      } else {
        title(ctx, api, 'Time-scale the same identified trace');
        const factor = 1 - 0.5 * q('family-time-scale', progress);
        [1, factor].forEach((factor, i) => {
          const y = 465 + i * 265;
          timeAxis(ctx, api, 350, y, 1250, 2000, [0, 500, 1000, 1500, 2000]);
          SERVING_COHORT.forEach((r, j) => {
            const x = 350 + ((r.scheduled * factor) / 2000) * 1250;
            line(ctx, api, x, y - 24, x, y + 12, themeColors.blue, 4);
            constructionText(
              ctx,
              api,
              r.id,
              x,
              y - 45 - (j >= 2 && j <= 4 ? (j - 2) * 45 : 0),
              24,
              themeColors.blue,
              'center',
            );
          });
          constructionText(
            ctx,
            api,
            i ? `time factor ${factor.toFixed(2)}` : 'original six arrivals',
            220,
            y - 145,
            30,
            i ? themeColors.cyan : themeColors.muted,
          );
        });
        footer(ctx, api, 'The requests stay in order as the window gets shorter.');
      }
    }
    return true;
  });
}
export default {
  id: 'arrival-families',
  draw: drawArrivalFamilies,
  cues: [
    'arrival-families-beat-0',
    'arrival-families-beat-1',
    'arrival-families-beat-2',
    'family-time-scale',
  ],
};
