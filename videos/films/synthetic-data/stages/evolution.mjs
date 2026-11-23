import {
  arrow,
  centeredText,
  clauseComplete,
  clauseProgress,
  filledRectangle,
  footer,
  tag,
} from '../defaults.mjs';
export function drawEvolution(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('evolution-mechanism', () => {
    if (currentBeat === 0) {
      const labels = [
        'add constraints',
        'deepen question',
        'make concrete',
        'add reasoning steps',
        'complicate input',
      ];
      centeredText(
        ctx,
        api,
        'In-depth: same task, additional required work',
        960,
        300,
        36,
        themeColors.blue,
      );
      if (clauseProgress(ctx, api, 'depth-five'))
        labels.forEach((v, i) => {
          const x = 300 + i * 330;
          filledRectangle(
            ctx,
            api,
            x - 100,
            700 - i * 70,
            200,
            110 + i * 70,
            [
              themeColors.blue,
              themeColors.cyan,
              themeColors.yellow,
              themeColors.green,
              themeColors.pink,
            ][i],
          );
          centeredText(ctx, api, String(i + 1), x, 760 - i * 70, 37, themeColors.bg);
          centeredText(
            ctx,
            api,
            v,
            x,
            870,
            25,
            [
              themeColors.blue,
              themeColors.cyan,
              themeColors.yellow,
              themeColors.green,
              themeColors.pink,
            ][i],
          );
        });
      centeredText(ctx, api, 'In-breadth: another task', 960, 945, 33, themeColors.muted);
    } else if (currentBeat === 1) {
      tag(
        ctx,
        api,
        'S12 · API pagination and rate-limit recovery',
        960,
        300,
        themeColors.blue,
        1480,
      );
      const rows = [
        ['clock-constraint', 'deterministic clock → reproducible waiting'],
        ['retry-constraint', 'retry schedule → bounded attempts'],
        ['cursor-constraint', 'HTTP 429 → retry the same cursor'],
      ];
      rows.forEach(([id, value], i) => {
        if (clauseProgress(ctx, api, id)) {
          filledRectangle(
            ctx,
            api,
            330,
            440 + i * 135,
            85,
            80,
            [themeColors.yellow, themeColors.cyan, themeColors.green][i],
          );
          centeredText(ctx, api, String(i + 1), 372, 495 + i * 135, 35, themeColors.bg);
          centeredText(
            ctx,
            api,
            value,
            1090,
            495 + i * 135,
            32,
            [themeColors.yellow, themeColors.cyan, themeColors.green][i],
          );
        }
      });
      centeredText(ctx, api, 'One test per requirement', 960, 945, 31, themeColors.muted);
    } else {
      tag(ctx, api, 'Heuristic sees: “sorry” + short response', 960, 385, themeColors.yellow, 1450);
      centeredText(
        ctx,
        api,
        'Policy asks for refusal of an unsafe request',
        960,
        580,
        35,
        themeColors.blue,
      );
      if (clauseComplete(ctx, api, 'valid-refusal')) {
        tag(ctx, api, 'Keep the correct refusal', 960, 775, themeColors.green, 1450);
        arrow(ctx, api, 960, 630, 960, 705, themeColors.green);
      }
    }
    footer(
      ctx,
      api,
      'More demanding instructions still need coherent answers and verified behavior',
    );
  });
}
export default {
  id: 'evolution',
  draw: drawEvolution,
  cues: [
    'evolution-styles',
    'depth-five',
    'evolution-task',
    'clock-constraint',
    'retry-constraint',
    'cursor-constraint',
    'refusal-keep',
    'valid-refusal',
  ],
};
