import {
  drawArrow,
  drawBox,
  drawCenteredText,
  drawDependencyGraph,
  drawFocusTarget,
  drawFooter,
  drawLine,
} from '../defaults.mjs';
export function drawPlanRuntime(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    operationProgress = cueProgress('aa-plan-runtime-' + currentBeat);
  const paintMechanism = () => {
    const phase =
        currentBeat === 1
          ? resultComplete('plan-failure')
            ? 'fail'
            : resultComplete('plan-decision-ready')
              ? 'done'
              : resultComplete('plan-three-ready')
                ? 'ready'
                : 'pending'
          : currentBeat === 2
            ? 'invalid'
            : 'pending',
      status =
        phase === 'done'
          ? {
              ci: true,
              diff: true,
              health: true,
            }
          : phase === 'fail'
            ? {
                ci: true,
                health: true,
              }
            : {};
    drawCenteredText(
      ctx,
      api,
      'R1842 · independent reads feed one decision',
      960,
      280,
      34,
      themeColors.yellow,
    );
    drawDependencyGraph(ctx, api, status, {}, phase === 'done' ? 'decision' : undefined);
    if (currentBeat === 2) {
      const cycle = resultComplete('plan-cycle'),
        missing = cueProgress('plan-missing') > 0;
      if (cycle) {
        drawLine(ctx, api, 1120, 613, 1270, 613, themeColors.pink, 4);
        drawLine(ctx, api, 1270, 613, 1270, 300, themeColors.pink, 4);
        drawLine(ctx, api, 1270, 300, 340, 300, themeColors.pink, 4);
        drawArrow(ctx, api, 340, 300, 340, 350, themeColors.pink);
        drawCenteredText(
          ctx,
          api,
          'Rejected cycle: decision → CI → decision',
          960,
          875,
          29,
          themeColors.pink,
        );
      } else if (missing) {
        drawBox(ctx, api, 'missing parent: audit', 720, 830, 700, 86, themeColors.pink);
      } else if (cueProgress('plan-duplicate') > 0) {
        drawBox(ctx, api, 'ci', 190, 475, 300, 72, themeColors.pink);
        drawCenteredText(ctx, api, 'Duplicate ci ID rejected', 1180, 885, 29, themeColors.pink);
      }
    }
    if (phase === 'ready')
      for (const y of [370, 570, 770])
        drawLine(ctx, api, 170, y + 20, 170, y + 66, themeColors.yellow, 8);
    if (phase === 'fail')
      drawBox(ctx, api, 'diff failed · join blocked', 720, 830, 1100, 88, themeColors.pink);
    else if (currentBeat !== 2)
      drawCenteredText(
        ctx,
        api,
        phase === 'done'
          ? 'Only decision ready'
          : phase === 'ready'
            ? 'CI + diff + health ready'
            : 'Validated dependencies describe readiness',
        960,
        935,
        32,
        themeColors.cyan,
      );
    drawFooter(ctx, api, 'A scheduler assigns workers to ready steps.');
  };
  drawFocusTarget(ctx, api, 'aa-plan-runtime-mechanism', paintMechanism);
}
export default {
  id: 'plan-runtime',
  draw: drawPlanRuntime,
  cues: [
    'aa-plan-runtime-0',
    'aa-plan-runtime-1',
    'plan-three-ready',
    'plan-decision-ready',
    'plan-failure',
    'aa-plan-runtime-2',
    'plan-duplicate',
    'plan-missing',
    'plan-cycle',
  ],
};
