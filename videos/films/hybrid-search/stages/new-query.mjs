import { newQuerySnapshot } from '../construction.mjs';
import { card, equation, footer, text } from '../defaults.mjs';
export function drawNewQuery(ctx, scene, state, api) {
  const { C: themeColors, phase } = api;
  const beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = phase(progress, 0.06, 0.85);
  {
    const snap = newQuerySnapshot(beat, progress, state.cues),
      target = 'Slow bread';
    if (state.cues?.['returned-ranks'])
      snap.returned = Math.ceil(4 * api.focus.progress('returned-ranks', 0));
    api.focus.target('reader-query', () =>
      text(ctx, api, 'bread that rises overnight', 960, 260, 38, themeColors.yellow, 'center'),
    );
    text(ctx, api, 'Lexical', 325, 340, 31, themeColors.blue, 'center');
    text(ctx, api, 'Dense', 940, 340, 31, themeColors.pink, 'center');
    text(ctx, api, 'Fused top ' + snap.budget, 1555, 340, 31, themeColors.cyan, 'center');
    if (!snap.returned) {
      api.focus.target('prediction', () =>
        card(ctx, api, 'Which lane will help?', 610, 500, 700, themeColors.yellow, 120),
      );
      footer(ctx, api, 'Make a prediction before the returned cards are revealed');
      return;
    }
    snap.lanes.forEach((lane, j) =>
      lane.forEach((id, i) => {
        if (j * 2 + i < snap.returned)
          api.focus.target('returned-candidates', () =>
            card(
              ctx,
              api,
              i + 1 + '   ' + id,
              155 + j * 615,
              390 + i * 155,
              340,
              id === 'Slow bread' ? themeColors.green : j ? themeColors.pink : themeColors.blue,
            ),
          );
      }),
    );
    if (snap.contributed === 4) {
      snap.result.forEach((r, i) => {
        api.focus.target('fused-candidates', () =>
          card(
            ctx,
            api,
            r.id,
            1385,
            390 + i * 155,
            340,
            i < snap.budget
              ? r.id === 'Slow bread'
                ? themeColors.green
                : themeColors.yellow
              : themeColors.muted,
          ),
        );
        text(ctx, api, r.score.toFixed(5), 1555, 510 + i * 155, 27, themeColors.muted, 'center');
      });
      const cutoffY = 525 + snap.cutoffProgress * 155;
      if (snap.cutoffProgress === 0 || snap.cutoffProgress === 1)
        api.line(ctx, 1380, cutoffY, 1730, cutoffY, themeColors.yellow, 3);
      else api.arrow(ctx, 1790, cutoffY, 1745, cutoffY, themeColors.yellow, 4);
      const recovered = snap.result.slice(0, snap.budget).some((r) => r.id === 'Slow bread')
        ? 1
        : 0;
      api.focus.target('context-recall', () =>
        equation(
          ctx,
          api,
          String.raw`\text{Required source in context}=\frac{` + recovered + String.raw`}{1}`,
          960,
          910,
          40,
        ),
      );
    } else
      text(
        ctx,
        api,
        'Rank contributions arriving · ' + snap.contributed + '/4',
        1515,
        780,
        26,
        themeColors.yellow,
        'center',
      );
    footer(ctx, api, '');
  }
}
export default {
  id: 'new-query',
  draw: drawNewQuery,
  cues: [
    'predict-lane',
    'returned-ranks',
    'measure-fusion',
    'expand-final-cutoff',
    'recovered-needed-source',
  ],
};
