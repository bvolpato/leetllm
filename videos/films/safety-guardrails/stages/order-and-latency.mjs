import { latencySnapshot, safetyBudget } from '../model.mjs';
import { drawSafetyCard, drawSafetyText } from '../defaults.mjs';
export function paintOrderAndLatency(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  currentBeat,
  beatProgress,
) {
  const budget = safetyBudget(),
    trace = latencySnapshot(currentBeat, beatProgress);
  const stages = trace.intervals;
  let x = 150;
  const colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green];
  stages.forEach((stage, index) => {
    const width = (stage.ms / budget.responseBudget) * 1600;
    api.rect(ctx, x, 465, width, 105, themeColors.panel, colors[index], 0, 2);
    if (stage.elapsed > 0)
      api.focus.target('stage-duration', () =>
        api.rect(ctx, x, 465, (width * stage.elapsed) / stage.ms, 105, colors[index], undefined, 0),
      );
    x += width;
  });
  const cursor = 150 + (1600 * trace.elapsed) / budget.responseBudget;
  drawSafetyCard(
    ctx,
    api,
    themeColors,
    c,
    'request-82',
    cursor - 105,
    365,
    210,
    themeColors.yellow,
    65,
    24,
  );
  api.line(ctx, cursor, 435, cursor, 580, themeColors.yellow, 3);
  const status = trace.released
    ? 'Text released'
    : trace.reviewComplete
      ? 'Review passed · transport pending'
      : trace.draftReady
        ? 'Draft held for output review'
        : 'Request in flight';
  t.changeCue(
    {
      x: 460,
      y: 580,
      width: 1000,
      height: 55,
      from: 0,
      to: budget.responseTotal,
      progress: trace.elapsed / budget.responseTotal,
      color: themeColors.yellow,
      restColor: themeColors.green,
      emphasis: trace.released ? 0 : 0.25,
    },
    (cue) =>
      api.focus.target('response-budget', () =>
        drawSafetyText(
          ctx,
          api,
          themeColors,
          `${Math.round(cue.value)} ms · ${status}`,
          960,
          615,
          31,
          cue.color,
          'center',
        ),
      ),
  );
  [
    drawSafetyCard(
      ctx,
      api,
      themeColors,
      c,
      `Input checks · ${stages[0].ms} ms`,
      150,
      655,
      760,
      themeColors.blue,
      80,
      27,
    ),
    drawSafetyCard(
      ctx,
      api,
      themeColors,
      c,
      `Generation · ${stages[1].ms.toLocaleString('en-US')} ms`,
      1040,
      655,
      760,
      themeColors.cyan,
      80,
      27,
    ),
    api.focus.target('output-review', () =>
      drawSafetyCard(
        ctx,
        api,
        themeColors,
        c,
        `Output review · ${stages[2].ms} ms`,
        150,
        760,
        760,
        themeColors.yellow,
        80,
        27,
      ),
    ),
    drawSafetyCard(
      ctx,
      api,
      themeColors,
      c,
      `Overhead · ${stages[3].ms} ms`,
      1040,
      760,
      760,
      themeColors.green,
      80,
      27,
    ),
  ];
  api.focus.target('effect-authorization', () =>
    drawSafetyCard(
      ctx,
      api,
      themeColors,
      c,
      currentBeat === 2
        ? 'Deploy request · approval required · effect held'
        : `Optional factual audit · ${budget.stages.at(-1).ms} ms · later lane`,
      355,
      870,
      1210,
      currentBeat === 2 ? themeColors.yellow : themeColors.muted,
      70,
      25,
    ),
  );
  drawSafetyText(
    ctx,
    api,
    themeColors,
    `Required path total ${budget.responseTotal} ms · example budget ${budget.responseBudget} ms`,
    960,
    300,
    32,
    themeColors.ink,
    'center',
  );
}
export function drawOrderAndLatency(ctx, scene, state, api) {
  const { C: themeColors, components: c, phase, teaching: t } = api;
  const currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    routeProgress = phase(beatProgress, 0.05, 0.9);
  return paintOrderAndLatency(ctx, scene, state, api, themeColors, c, t, currentBeat, beatProgress);
}
export default {
  id: 'order-and-latency',
  draw: drawOrderAndLatency,
  cues: ['order-and-latency-b1-1', 'order-and-latency-b2-1', 'order-and-latency-b3-1'],
};
