import { drawArrow, drawBox, drawCenteredText, drawFocusTarget } from '../defaults.mjs';
export function drawTaintedInterface(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    operationProgress = cueProgress('aa-tainted-interface-' + currentBeat);
  const paintMechanism = () => {
    drawCenteredText(ctx, api, 'Host-owned tool registry', 960, 280, 35, themeColors.yellow);
    drawBox(ctx, api, 'read CI → read', 200, 370, 620, 90, themeColors.blue);
    drawBox(ctx, api, 'open patch → write', 1090, 370, 620, 90, themeColors.pink);
    const extra = currentBeat === 2 && resultComplete('patch-extra');
    drawBox(
      ctx,
      api,
      extra ? 'Unexpected field' : 'tool · target · change',
      350,
      540,
      1220,
      90,
      extra ? themeColors.pink : themeColors.cyan,
    );
    const approved = currentBeat > 1 || (currentBeat === 1 && resultComplete('patch-approval')),
      created = currentBeat > 1 || (currentBeat === 1 && resultComplete('patch-one'));
    drawBox(
      ctx,
      api,
      approved ? 'Exact change approved' : 'No exact change approval',
      200,
      730,
      650,
      100,
      approved ? themeColors.green : themeColors.yellow,
    );
    drawBox(
      ctx,
      api,
      'Draft count: ' + (created ? 1 : 0),
      1090,
      730,
      620,
      100,
      created ? themeColors.green : themeColors.muted,
    );
    if (created) drawArrow(ctx, api, 870, 780, 1070, 780, themeColors.green);
    if (extra)
      drawCenteredText(ctx, api, 'Reject before any new draft', 960, 930, 34, themeColors.pink);
    else if (currentBeat === 0)
      drawCenteredText(
        ctx,
        api,
        'A summary keeps the source and trust level of the log.',
        960,
        930,
        31,
        themeColors.yellow,
      );
    else if (currentBeat === 1 && resultComplete('patch-block') && !approved)
      drawCenteredText(
        ctx,
        api,
        'Blocked · draft ledger remains empty',
        960,
        930,
        33,
        themeColors.pink,
      );
  };
  drawFocusTarget(ctx, api, 'aa-tainted-interface-mechanism', paintMechanism);
}
export default {
  id: 'tainted-interface',
  draw: drawTaintedInterface,
  cues: [
    'aa-tainted-interface-0',
    'aa-tainted-interface-1',
    'patch-block',
    'patch-approval',
    'patch-one',
    'aa-tainted-interface-2',
    'patch-extra',
  ],
};
