import {
  arrow,
  box,
  constructionCode,
  constructionFooter,
  focusProgress,
  label,
} from '../defaults.mjs';
export function drawPrefixJump(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-prefix-jump-mechanism', () => {
      const changed = done('sg-cache-prompt-change');
      if (currentBeat === 0) {
        box(
          ctx,
          api,
          'Request A token prefix',
          ['[system, schema, task-A]'],
          180,
          315,
          760,
          155,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'Request B token prefix',
          [changed ? '[changed-system, schema, task-B]' : '[system, schema, task-B]'],
          180,
          545,
          760,
          155,
          themeColors.cyan,
        );
        box(
          ctx,
          api,
          'Reusable model state',
          ['matching token-prefix KV pages'],
          1090,
          315,
          650,
          155,
          themeColors.green,
        );
        box(
          ctx,
          api,
          'Reusable grammar',
          ['compatible compiled rules'],
          1090,
          545,
          650,
          155,
          themeColors.yellow,
        );
        arrow(ctx, api, 955, 385, 1070, 385, themeColors.green);
        if (!changed) arrow(ctx, api, 955, 615, 1070, 385, themeColors.green);
        if (changed)
          label(ctx, api, 'B token-prefix hit is not established', 960, 835, themeColors.pink, 31);
      } else {
        const append = focusProgress(ctx, api, 'sg-forced-append'),
          steps = focusProgress(ctx, api, 'sg-forced-steps');
        label(
          ctx,
          api,
          'Illustrative forced literal · same three token fragments',
          960,
          280,
          themeColors.blue,
          32,
        );
        ['{"', 'status', '":"'].forEach((v, i) => {
          const x = 250 + i * 490;
          box(ctx, api, 'Forced token ' + (i + 1), [v], x, 365, 390, 145, themeColors.yellow);
          if (steps > i / 3)
            label(ctx, api, 'sampling step ' + (i + 1), x + 195, 565, themeColors.yellow, 28);
        });
        box(ctx, api, 'Old accepted token prefix', ['...'], 180, 690, 450, 155, themeColors.blue);
        api.rect(ctx, 690, 690, 1020, 155, themeColors.panel, themeColors.cyan, 10);
        if (append > 0) {
          constructionCode(
            ctx,
            api,
            '{"status":"'.slice(0, Math.floor(append * 11)),
            735,
            783,
            38,
            themeColors.cyan,
          );
          api.rect(ctx, 715, 820, 970 * append, 8, themeColors.cyan, null, 3);
        }
        if (done('sg-forced-append'))
          label(
            ctx,
            api,
            'One append · model state still extends',
            960,
            905,
            themeColors.green,
            32,
          );
        if (currentBeat === 2) {
          const align = focusProgress(ctx, api, 'sg-join-retokenize');
          if (align > 0) {
            api.line(ctx, 610, 670, 610, 865, themeColors.pink, 3);
            label(ctx, api, 'tokenize across this join', 620, 620, themeColors.pink, 28);
          }
          constructionFooter(
            ctx,
            api,
            'The original tokenizer aligns the combined text; these fragments are illustrative.',
          );
        } else
          constructionFooter(
            ctx,
            api,
            'Repeated sampling stages disappear; appended tokens still require model state.',
          );
      }
    });
  }
}
export default {
  id: 'prefix-jump',
  draw: drawPrefixJump,
  cues: [
    'sg-prefix-jump-0',
    'sg-cache-prompt-change',
    'sg-prefix-jump-1',
    'sg-forced-append',
    'sg-forced-steps',
    'sg-prefix-jump-2',
    'sg-join-retokenize',
  ],
};
