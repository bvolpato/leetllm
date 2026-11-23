import {
  completionCode,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawScopeRecovery(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const drawMechanism = () => {
    completionHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'The unfinished assignment is inside the function'
        : 'The unindented line is outside the function',
    );
    const lines = [
      'def validate_token_scope(request, graph):',
      '    is_allowed =',
      '    return is_allowed',
      '',
      'outside = graph.',
    ];
    lines.forEach((s, i) =>
      completionCode(
        ctx,
        api,
        s,
        250,
        420 + i * 100,
        32,
        i === 0 ? themeColors.blue : themeColors.ink,
      ),
    );
    api.line(ctx, 210, 365, 210, currentBeat ? 660 : 630, themeColors.blue, 5);
    completionText(ctx, api, 'function node', 130, 340, 26, themeColors.blue);
    if (currentBeat) {
      api.line(ctx, 250, 850, 850, 850, themeColors.yellow, 3);
      api.arrow(ctx, 1470, 820, 1470, 440, themeColors.pink, 4);
      completionText(
        ctx,
        api,
        'backward scan returns old header',
        1390,
        920,
        29,
        themeColors.pink,
        'center',
      );
      completionText(
        ctx,
        api,
        'Actual enclosing function here: none',
        1150,
        700,
        33,
        themeColors.yellow,
        'center',
      );
    } else {
      api.path(
        ctx,
        [
          {
            x: 235,
            y: 475,
          },
          {
            x: 1435,
            y: 475,
          },
          {
            x: 1435,
            y: 580,
          },
          {
            x: 235,
            y: 580,
          },
        ],
        {
          closed: true,
          color: themeColors.yellow,
          width: 2,
        },
      );
      completionText(
        ctx,
        api,
        'Incomplete assignment · recover a syntax node',
        960,
        880,
        33,
        themeColors.cyan,
        'center',
      );
    }
    completionFooter(
      ctx,
      api,
      'Syntax node → enclosing scope     ·     Repository policy → file access',
    );
  };
  api.focus.target('cc-scope-recovery-mechanism', drawMechanism);
  return;
}
export default {
  id: 'scope-recovery',
  draw: drawScopeRecovery,
  cues: ['cc-scope-recovery-0', 'cc-scope-recovery-1', 'cc-scope-dedent'],
};
