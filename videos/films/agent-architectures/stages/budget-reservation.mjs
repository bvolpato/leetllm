import {
  drawBox,
  drawCenteredText,
  drawFocusTarget,
  drawFooter,
  drawLine,
  drawSegments,
} from '../defaults.mjs';
export function drawBudgetReservation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    operationProgress = cueProgress('aa-budget-reservation-' + currentBeat);
  const paintMechanism = () => {
    const reserved = currentBeat === 0 && resultComplete('budget-admit'),
      reads = reserved ? 1 : 2,
      writes = reserved ? 0 : 1;
    drawCenteredText(
      ctx,
      api,
      currentBeat === 0
        ? 'Reserve from host-owned attempt pools'
        : 'Separate token reservation pool',
      960,
      280,
      35,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      drawCenteredText(ctx, api, 'Read attempts', 550, 410, 33, themeColors.blue);
      drawCenteredText(ctx, api, 'Write attempts', 1370, 410, 33, themeColors.pink);
      for (let i = 0; i < 2; i++)
        drawBox(
          ctx,
          api,
          i < reads ? 'available' : 'reserved / consumed',
          270 + i * 350,
          530,
          300,
          100,
          i < reads ? themeColors.blue : themeColors.muted,
        );
      drawBox(
        ctx,
        api,
        writes ? 'available' : 'reserved / consumed',
        1170,
        530,
        400,
        100,
        writes ? themeColors.pink : themeColors.muted,
      );
      if (resultComplete('budget-no-write'))
        drawCenteredText(
          ctx,
          api,
          'Second write blocked before dispatch · 1 read remains',
          960,
          850,
          34,
          themeColors.pink,
        );
    } else {
      const parts = [120, 80],
        width = 1250;
      drawSegments(ctx, api, parts, 300, 530, {
        w: width,
        max: 200,
        colors: [themeColors.blue, themeColors.pink],
      });
      drawLine(
        ctx,
        api,
        300 + (width * 150) / 200,
        455,
        300 + (width * 150) / 200,
        720,
        themeColors.yellow,
        4,
      );
      drawCenteredText(
        ctx,
        api,
        '150 remaining',
        300 + (width * 150) / 200,
        405,
        31,
        themeColors.yellow,
      );
      drawCenteredText(ctx, api, '120 input', 675, 675, 32, themeColors.blue);
      drawCenteredText(ctx, api, '80 output cap', 1300, 675, 32, themeColors.pink);
      if (resultComplete('budget-twohundred') || currentBeat === 2)
        drawCenteredText(
          ctx,
          api,
          '200 required > 150 remaining → no dispatch',
          960,
          870,
          36,
          themeColors.pink,
        );
      if (currentBeat === 2)
        drawCenteredText(
          ctx,
          api,
          'Attempts · tokens · wall clock · effects have separate limits',
          960,
          350,
          29,
          themeColors.yellow,
        );
    }
    drawFooter(
      ctx,
      api,
      'A timed-out request counts as an attempt. Check its outcome with the service.',
    );
  };
  drawFocusTarget(ctx, api, 'aa-budget-reservation-mechanism', paintMechanism);
}
export default {
  id: 'budget-reservation',
  draw: drawBudgetReservation,
  cues: [
    'aa-budget-reservation-0',
    'budget-admit',
    'budget-no-write',
    'aa-budget-reservation-1',
    'budget-twohundred',
    'aa-budget-reservation-2',
  ],
};
