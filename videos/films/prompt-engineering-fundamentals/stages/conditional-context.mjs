import { chapterBox, chapterText, footer, line, subtitle } from '../defaults.mjs';
export function drawConditionalContext(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('pf-conditional-context-mechanism', () => {
    if (currentBeat < 2) {
      const first = 0.6,
        second = 0.4;
      const firstWidth = 1340 * first;
      const firstProgress = api.focus.progress('pf-conditional-context-b0');
      const secondProgress = api.focus.progress('conditional-second-token');
      const answered = api.focus.cue('conditional-product')?.phase === 'after';
      chapterText(ctx, api, 'All continuations', 290, 325, 38);
      api.rect(ctx, 290, 369, 1340, 376, themeColors.panel, themeColors.muted, 0);
      api.rect(ctx, 290, 369, firstWidth * firstProgress, 376, themeColors.blue, undefined, 0);
      if (secondProgress > 0)
        api.rect(
          ctx,
          290,
          369,
          firstWidth,
          376 * second * secondProgress,
          themeColors.green,
          undefined,
          0,
        );
      chapterText(ctx, api, 'First token   ' + first.toFixed(2), 290, 815, 40, themeColors.blue);
      if (secondProgress > 0)
        chapterText(
          ctx,
          api,
          'Next token given the first   ' + second.toFixed(2),
          1650,
          815,
          40,
          themeColors.green,
          'right',
        );
      chapterBox(
        ctx,
        api,
        answered
          ? first.toFixed(2) + ' × ' + second.toFixed(2) + ' = ' + (first * second).toFixed(2)
          : 'Probability of the pair?',
        505,
        885,
        910,
        98,
        answered ? themeColors.green : themeColors.muted,
        40,
      );
    } else if (currentBeat === 2) {
      const u = api.focus.progress('pf-conditional-context-b1');
      chapterBox(ctx, api, 'Learned weights stay fixed', 1220, 350, 480, 120, themeColors.blue, 30);
      chapterBox(ctx, api, 'prompt + prior output', 200, 400, 700, 100, themeColors.cyan);
      chapterBox(ctx, api, 'selected token t1', 200 + 550 * u, 620, 350, 85, themeColors.yellow);
      line(ctx, api, 1070, 620, 1070, 790, themeColors.cyan);
      chapterBox(
        ctx,
        api,
        u >= 1 ? 'next forward pass → K1, V1' : 'K/V written when t1 is processed',
        950,
        805,
        760,
        90,
        themeColors.cyan,
        27,
      );
      chapterText(ctx, api, 'Optimizer steps: 0', 1510, 650, 32, themeColors.yellow, 'center');
    } else {
      subtitle(ctx, api, 'What belongs in the incident prompt?');
      chapterBox(
        ctx,
        api,
        'IR-7 · first page within 30 minutes',
        220,
        360,
        1050,
        100,
        themeColors.green,
      );
      [
        ['Minutes since P1 declaration', 12],
        ['page already sent', false],
        ['applicable policy', 'IR-7'],
      ].forEach(([k, v], i) =>
        chapterBox(ctx, api, k + '\n' + v, 220 + i * 520, 590, 460, 135, themeColors.blue, 27),
      );
      footer(ctx, api, 'Make room for the rule and the current incident.', themeColors.yellow);
    }
  });
  return;
}
export default {
  id: 'conditional-context',
  draw: drawConditionalContext,
  cues: [
    'pf-conditional-context-b0',
    'conditional-second-token',
    'conditional-product',
    'pf-conditional-context-b1',
    'pf-conditional-context-b2',
  ],
};
