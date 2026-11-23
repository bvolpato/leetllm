import { clamp } from '../construction.mjs';
import { arrow, caption, equation, line, panel, text } from '../defaults.mjs';
export function drawSplit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const paint = () => {
    const groups = [
      {
        name: 'fit',
        ids: ['T1', 'T2', 'T3', 'T4'],
        x: 180,
        y: 370,
        col: themeColors.blue,
      },
      {
        name: 'select',
        ids: ['V1', 'V2', 'V3'],
        x: 180,
        y: 650,
        col: themeColors.blue,
      },
      {
        name: 'calibrate',
        ids: Array.from(
          {
            length: 9,
          },
          (_, i) => 'C' + (i + 1),
        ),
        x: 980,
        y: 370,
        col: themeColors.cyan,
      },
      {
        name: 'evaluate',
        ids: ['E1', 'E2', 'E3', 'E4'],
        x: 980,
        y: 650,
        col: themeColors.green,
      },
    ];
    for (const g of groups) {
      text(ctx, api, g.name, g.x, g.y - 35, 31, g.col);
      g.ids.forEach((id, i) => {
        const x = g.x + (i % 5) * 115,
          y = g.y + Math.floor(i / 5) * 62;
        panel(ctx, api, x, y, 95, 47, () =>
          text(ctx, api, id, x + 47.5, y + 32, 25, g.col, 'center'),
        );
      });
    }
    panel(
      ctx,
      api,
      600,
      450,
      270,
      170,
      () => {
        text(ctx, api, 'frozen procedure', 735, 492, 28, themeColors.yellow, 'center');
        equation(ctx, api, String.raw`\widehat f,\;s`, 735, 552, 46, themeColors.yellow);
        text(ctx, api, 'preprocessing + score', 735, 597, 22, themeColors.muted, 'center');
      },
      themeColors.yellow,
    );
    arrow(ctx, api, 650, 420, 600, 500, themeColors.blue);
    arrow(ctx, api, 535, 690, 600, 570, themeColors.blue);
    arrow(ctx, api, 870, 500, 970, 420, themeColors.cyan);
    arrow(ctx, api, 870, 570, 970, 695, themeColors.green);
    if (currentBeat === 1) {
      line(ctx, api, 1080, 580, 1780, 580, themeColors.pink, 4);
      line(ctx, api, 1780, 580, 1780, 920, themeColors.pink, 4);
      line(ctx, api, 1780, 920, 100, 920, themeColors.pink, 4);
      line(ctx, api, 100, 920, 100, 500, themeColors.pink, 4);
      arrow(ctx, api, 100, 500, 600, 500, themeColors.pink, 4);
      text(
        ctx,
        api,
        'calibration-driven retuning changes the procedure',
        960,
        850,
        31,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 2) {
      equation(
        ctx,
        api,
        String.raw`\mathbb P_{\mathcal C,\,Z_{\rm new}}\{Y_{\rm new}\in C(X_{\rm new})\mid\widehat f,s\}`,
        960,
        875,
        43,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        'Average over calibration and the new example · fitted procedure held fixed',
      );
    } else caption(ctx, api, 'Each request has one role in this split construction.');
  };
  if (api.focus) api.focus.target(`${'split'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'split',
  draw: drawSplit,
  cues: ['split-b1', 'split-b2', 'split-b3'],
};
