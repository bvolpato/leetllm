import {
  arrow,
  centeredText,
  clauseComplete,
  clauseProgress,
  filledRectangle,
  tag,
} from '../defaults.mjs';
export function drawTaskGrowth(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('task-growth-mechanism', () => {
    if (currentBeat === 0) {
      centeredText(ctx, api, 'Reviewed task pool', 380, 310, 35, themeColors.blue);
      for (let i = 0; i < 35; i++)
        filledRectangle(
          ctx,
          api,
          170 + (i % 7) * 60,
          380 + Math.floor(i / 7) * 52,
          45,
          35,
          themeColors.blue,
        );
      centeredText(ctx, api, '175 human seed tasks', 380, 740, 33, themeColors.blue);
      centeredText(ctx, api, 'Each mark represents 5 tasks', 380, 810, 25, themeColors.muted);
      if (clauseProgress(ctx, api, 'task-demos')) {
        for (let i = 0; i < 8; i++) {
          const x = 900 + (i % 4) * 220,
            y = 410 + Math.floor(i / 4) * 150;
          tag(
            ctx,
            api,
            (i < 6 ? 'Human ' : 'Model ') + (i + 1),
            x,
            y,
            i < 6 ? themeColors.blue : themeColors.cyan,
            180,
          );
        }
        arrow(ctx, api, 620, 550, 760, 550);
      }
      if (clauseComplete(ctx, api, 'task-total'))
        centeredText(
          ctx,
          api,
          'Historical filtered pool: 52,445 instructions',
          960,
          900,
          40,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      centeredText(
        ctx,
        api,
        'Output-first classification instances',
        960,
        300,
        37,
        themeColors.blue,
      );
      if (clauseProgress(ctx, api, 'labels-first'))
        ['rate limited', 'success'].forEach((v, i) =>
          tag(
            ctx,
            api,
            'Class: ' + v,
            500 + i * 900,
            460,
            i ? themeColors.green : themeColors.yellow,
            700,
          ),
        );
      if (clauseProgress(ctx, api, 'class-inputs')) {
        tag(ctx, api, 'input: HTTP 429 / same cursor', 500, 700, themeColors.yellow, 700);
        tag(ctx, api, 'input: HTTP 200 / returned next cursor', 1400, 700, themeColors.green, 760);
        arrow(ctx, api, 500, 515, 500, 630, themeColors.yellow);
        arrow(ctx, api, 1400, 515, 1400, 630, themeColors.green);
      }
      centeredText(
        ctx,
        api,
        'Task → requested label → matching input',
        960,
        910,
        34,
        themeColors.cyan,
      );
    } else {
      centeredText(ctx, api, 'Historical Self-Instruct screening', 960, 305, 36, themeColors.blue);
      tag(ctx, api, 'New instruction', 440, 510, themeColors.cyan, 620);
      tag(ctx, api, 'Existing instruction pool', 1430, 510, themeColors.blue, 720);
      arrow(ctx, api, 800, 510, 1005, 510);
      if (clauseComplete(ctx, api, 'rouge-cutoff')) {
        api.math(
          ctx,
          String.raw`\max_i\operatorname{ROUGE-L}(x,x_i)<0.7`,
          960,
          755,
          43,
          themeColors.yellow,
          'center',
        );
        centeredText(
          ctx,
          api,
          'Reported overlap heuristic + instance checks',
          960,
          915,
          34,
          themeColors.muted,
        );
      }
    }
  });
}
export default {
  id: 'task-growth',
  draw: drawTaskGrowth,
  cues: [
    'task-demos',
    'task-total',
    'task-demo-count',
    'output-first',
    'labels-first',
    'class-inputs',
    'rouge-rule',
    'rouge-cutoff',
  ],
};
