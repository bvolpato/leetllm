import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLine,
  drawConstructionPanel,
  drawConstructionText,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawStreamClocks(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('stream-clocks', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'stream-clocks', () => {
    const xx = (t) => 210 + t * 6.2;
    drawConstructionLine(ctx, api, xx(0), 550, xx(240), 550, themeColors.muted, 3);
    for (const t of [0, 100, 220, 240]) {
      drawConstructionLine(ctx, api, xx(t), 535, xx(t), 565, themeColors.muted, 3);
      drawConstructionCenter(ctx, api, t + ' ms', xx(t), 615, 28, themeColors.muted);
    }
    modelState.events.forEach((r, i) => {
      const shown =
        currentBeat > 0 ||
        r.id === 'arrival' ||
        (r.id === 'first' && modelState.firstVisible) ||
        (r.id === 'bundle' && modelState.bundleVisible) ||
        (r.id === 'terminal' && modelState.terminalVisible);
      if (!shown) return;
      api.circle(
        ctx,
        xx(r.at),
        550,
        9,
        [themeColors.muted, themeColors.cyan, themeColors.green, themeColors.yellow][i],
      );
      if (r.id === 'first')
        drawConstructionBox(ctx, api, 'token 1', xx(r.at) - 85, 385, 170, 90, themeColors.cyan, 28);
      if (r.id === 'bundle') {
        drawConstructionPanel(ctx, api, xx(r.at) - 128, 355, 256, 120, themeColors.green);
        for (let j = 0; j < 4; j++)
          drawConstructionBox(
            ctx,
            api,
            't' + (j + 2),
            xx(r.at) - 112 + j * 58,
            390,
            48,
            55,
            themeColors.green,
            22,
          );
        drawConstructionCenter(ctx, api, 'one output event', xx(r.at), 315, 27, themeColors.green);
      }
      if (r.id === 'terminal')
        drawConstructionText(
          ctx,
          api,
          'complete',
          xx(r.at) - 35,
          700,
          27,
          themeColors.yellow,
          'right',
        );
    });
    if (currentBeat === 0) {
      const now = Math.min(240, modelState.clock);
      drawConstructionLine(ctx, api, xx(now), 765, xx(now), 815, themeColors.yellow, 4);
      drawConstructionCenter(
        ctx,
        api,
        'Illustrated clock ' + Math.round(now) + ' ms',
        960,
        895,
        33,
        themeColors.yellow,
      );
    } else {
      if (modelState.gapVisible) {
        drawConstructionLine(ctx, api, xx(100), 750, xx(220), 750, themeColors.cyan, 4);
        drawConstructionCenter(
          ctx,
          api,
          'Observed event gap = ' + modelState.gap + ' ms',
          (xx(100) + xx(220)) / 2,
          805,
          32,
          themeColors.cyan,
        );
      }
      if (modelState.elapsedVisible)
        drawConstructionCenter(
          ctx,
          api,
          'Completion − first output = ' + modelState.elapsed + ' ms',
          960,
          865,
          31,
          themeColors.ink,
        );
      if (modelState.tpotVisible)
        drawConstructionCenter(
          ctx,
          api,
          'TPOT = 140 / 4 = ' + modelState.tpot + ' ms',
          960,
          930,
          35,
          themeColors.green,
        );
      if (modelState.overheadVisible)
        drawConstructionCenter(
          ctx,
          api,
          '20 ms completion overhead',
          1540,
          975,
          26,
          themeColors.yellow,
        );
    }
    if (currentBeat === 2)
      drawConstructionCenter(
        ctx,
        api,
        'External arrival → queue → adapter → prompt → first usable output',
        960,
        285,
        29,
        themeColors.yellow,
      );
    drawConstructionFoot(
      ctx,
      api,
      'Four tokens in one event have no separately observed internal decoding timestamps',
    );
  });
}
export default {
  id: 'stream-clocks',
  draw: drawStreamClocks,
  cues: [
    'mt-stream-clocks-b0',
    'mt-stream-clocks-s0-1',
    'mt-stream-clocks-first',
    'mt-stream-clocks-bundle',
    'mt-stream-clocks-terminal',
    'mt-stream-clocks-b1',
    'mt-stream-clocks-s1-0',
    'mt-stream-clocks-s1-1',
    'mt-stream-clocks-s1-2',
    'mt-stream-clocks-s1-3',
    'mt-stream-clocks-b2',
  ],
};
