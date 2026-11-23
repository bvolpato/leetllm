import { TRACKS } from '../arithmetic.mjs';
import { widthWorkSnapshot } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';
export function drawWidth(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const reveal = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const track = TRACKS['width'];
  const snapshot = track?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    drawText(
      ctx,
      api,
      `Same conditional tree · widths ${snapshot.widths.join(' and ')}`,
      960,
      275,
      35,
      themeColors.ink,
      'center',
    );
    if (snapshot.left && snapshot.right) {
      const first = [snapshot.left, snapshot.right];
      withFocus(ctx, api, 'width-simulation-54', () =>
        first.forEach((row, column) => {
          const x = 220 + column * 820;
          drawText(
            ctx,
            api,
            `width ${snapshot.widths[column]}`,
            x + 360,
            350,
            34,
            themeColors.cyan,
            'center',
          );
          row.expansions.forEach((candidate, index) =>
            drawCard(
              ctx,
              api,
              'width',
              `${candidate.text || candidate.token} · ${candidate.status} · ${candidate.probability.toFixed(2)}`,
              x,
              410 + index * 112,
              720,
              78,
              candidate.status === 'active' ? themeColors.green : themeColors.muted,
              27,
              reveal(index * 0.07, 0.62),
            ),
          );
        }),
      );
    } else if (snapshot.counts) {
      const runs = widthWorkSnapshot(progress);
      withFocus(ctx, api, 'width-work', () =>
        runs.forEach((run, column) => {
          const x = 190 + column * 825;
          drawText(
            ctx,
            api,
            `Width ${run.width} · expansion ${run.step}`,
            x + 365,
            365,
            32,
            themeColors.yellow,
            'center',
          );
          run.current.expansions.forEach((candidate, i) =>
            drawCard(
              ctx,
              api,
              'width',
              `${candidate.text}\np=${candidate.probability.toFixed(3)}`,
              x + (i % 2) * 375,
              430 + Math.floor(i / 2) * 95,
              350,
              85,
              candidate.status === 'active'
                ? themeColors.green
                : candidate.completed
                  ? themeColors.cyan
                  : themeColors.muted,
              19,
            ),
          );
          drawText(
            ctx,
            api,
            `Examined so far: ${run.examined}`,
            x + 365,
            940,
            32,
            themeColors.cyan,
            'center',
          );
          drawText(
            ctx,
            api,
            `Retained unfinished: ${run.current.active.length}`,
            x + 365,
            990,
            28,
            themeColors.green,
            'center',
          );
        }),
      );
    } else {
      withFocus(ctx, api, 'width-output-policy', () =>
        drawCard(ctx, api, 'width', 'width 2', 170, 440, 760, 84, themeColors.blue, 31),
      );
      withFocus(ctx, api, 'width-output-policy', () =>
        drawCard(ctx, api, 'width', 'width 3', 990, 440, 760, 84, themeColors.pink, 31),
      );
      drawText(ctx, api, `raw: Mia ${snapshot.raw[0]}`, 550, 585, 28, themeColors.ink, 'center');
      drawText(
        ctx,
        api,
        `mean log: Mia ${snapshot.normalized[0]}`,
        550,
        640,
        28,
        themeColors.cyan,
        'center',
      );
      drawText(ctx, api, `raw: Mia ${snapshot.raw[1]}`, 1370, 585, 28, themeColors.ink, 'center');
      drawText(
        ctx,
        api,
        `mean log: Mia ${snapshot.normalized[1]}`,
        1370,
        640,
        28,
        themeColors.cyan,
        'center',
      );
      drawText(
        ctx,
        api,
        'Candidate survival and the final score are separate decisions.',
        960,
        730,
        33,
        themeColors.ink,
        'center',
      );
    }
  }
}
export default {
  id: 'width',
  draw: drawWidth,
  cues: ['width-beat-1-focus-1', 'width-beat-2-focus-1', 'width-beat-3-focus-1'],
};
