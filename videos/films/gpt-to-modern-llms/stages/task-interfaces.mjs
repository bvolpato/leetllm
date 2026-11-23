import { tokens } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawTaskInterfaces(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('task-interfaces', state);
  {
    text(
      ctx,
      api,
      'Each row is a representation · columns are readable positions',
      960,
      305,
      27,
      themeColors.muted,
      'center',
    );
    for (const [side, x] of [170, 1040].entries()) {
      text(
        ctx,
        api,
        side ? 'Causal decoder' : 'Bidirectional encoder',
        x + 175,
        370,
        29,
        themeColors.cyan,
        'center',
      );
      tokens.forEach((token, j) =>
        text(ctx, api, token, x + j * 100 + 43, 420, 18, themeColors.muted, 'center'),
      );
      tokens.forEach((token, i) => {
        text(ctx, api, token, x - 12, 487 + i * 84, 19, themeColors.muted, 'right');
        tokens.forEach((_, j) => {
          const allowed = !side || j <= i;
          const highlighted = side && i === modelState.row;
          api.focus.target('readable-cell-' + side + '-' + i + '-' + j, () =>
            api.rect(
              ctx,
              x + j * 100,
              450 + i * 84,
              86,
              65,
              allowed ? (highlighted ? themeColors.yellow : themeColors.blue) : themeColors.panel,
              themeColors.muted,
              1,
            ),
          );
          text(
            ctx,
            api,
            allowed ? '1' : '×',
            x + j * 100 + 43,
            493 + i * 84,
            27,
            allowed ? themeColors.bg : themeColors.muted,
            'center',
          );
        });
      });
    }
    api.focus.target('decoder-row-label', () =>
      card(
        ctx,
        api,
        modelState.beat === 2
          ? 'guide representation → training target “Label:”'
          : `${tokens[modelState.row]} reads ${modelState.row + 1} visible positions`,
        460,
        870,
        1000,
        82,
        themeColors.yellow,
        27,
      ),
    );
    text(
      ctx,
      api,
      'Later positions stay hidden in a causal row',
      960,
      1005,
      26,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'task-interfaces',
  draw: drawTaskInterfaces,
  cues: [
    'readable-cell-0-2-3-b1-1',
    'read-to-guide',
    'readable-cell-1-2-3-b2-1',
    'guide-next-target-b3-1',
  ],
};
