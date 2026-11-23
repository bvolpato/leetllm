import { drawArrow, drawBox, drawCenteredText, drawFocusTarget, drawFooter } from '../defaults.mjs';
export function drawRouterDispatch(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1;
  const paintMechanism = () => {
    const examples =
        currentBeat === 0
          ? ['CI result', 'Schema change', 'Read the handbook']
          : ['CI failed during a schema migration', 'Read the documentation'],
      lanes = ['CI / deployment', 'migration / schema', 'documentation / handbook'];
    drawCenteredText(
      ctx,
      api,
      'Host-owned categories and handler map',
      960,
      275,
      34,
      themeColors.yellow,
    );
    lanes.forEach((s, i) =>
      drawBox(
        ctx,
        api,
        s,
        200 + i * 560,
        580,
        440,
        105,
        [themeColors.blue, themeColors.pink, themeColors.cyan][i],
      ),
    );
    if (currentBeat === 0) {
      const cues = ['router-build', 'router-schema', 'router-handbook'];
      examples.forEach((s, i) => {
        if (cueProgress(cues[i]) === 0) return;
        drawBox(
          ctx,
          api,
          s,
          230 + i * 560,
          370,
          380,
          80,
          [themeColors.blue, themeColors.pink, themeColors.cyan][i],
        );
        if (resultComplete(cues[i])) drawArrow(ctx, api, 420 + i * 560, 465, 420 + i * 560, 560);
      });
    } else {
      const docs = cueProgress('router-docs') > 0;
      drawBox(ctx, api, examples[docs ? 1 : 0], 250, 365, 1420, 90, themeColors.yellow);
      if (!docs && resultComplete('router-ambiguous')) {
        for (const x of [420, 980]) drawArrow(ctx, api, 960, 455, x, 570, themeColors.pink);
        drawCenteredText(
          ctx,
          api,
          '2 matching categories → needs review',
          960,
          880,
          35,
          themeColors.pink,
        );
      }
      if (docs && resultComplete('router-docs')) {
        drawArrow(ctx, api, 960, 455, 1540, 570, themeColors.cyan);
        drawCenteredText(
          ctx,
          api,
          '1 category → registered read-only handler',
          960,
          880,
          34,
          themeColors.green,
        );
      }
    }
    drawFooter(ctx, api, 'Dispatch when exactly one registered category matches.');
  };
  drawFocusTarget(ctx, api, 'aa-router-dispatch-mechanism', paintMechanism);
}
export default {
  id: 'router-dispatch',
  draw: drawRouterDispatch,
  cues: [
    'aa-router-dispatch-0',
    'router-build',
    'router-schema',
    'router-handbook',
    'aa-router-dispatch-1',
    'router-ambiguous',
    'router-docs',
  ],
};
