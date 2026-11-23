import {
  drawBox,
  drawCenteredText,
  drawEquation,
  drawFocusTarget,
  drawFooter,
  drawLine,
} from '../defaults.mjs';
export function drawBoundedContext(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    operationProgress = state.beatP ?? 0,
    mix = (a, z, u) => a + (z - a) * u;
  const paintMechanism = () => {
    if (currentBeat === 0) {
      drawCenteredText(
        ctx,
        api,
        'Canonical read request · same resource and arguments',
        960,
        285,
        33,
        themeColors.yellow,
      );
      drawFocusTarget(ctx, api, 'repeated-actions', () => {
        for (let i = 0; i < 3; i++) {
          drawBox(
            ctx,
            api,
            'read hours / Art / today',
            170 + i * 575,
            435,
            460,
            105,
            themeColors.blue,
          );
          drawCenteredText(
            ctx,
            api,
            'evidence version 1',
            400 + i * 575,
            650,
            29,
            themeColors.muted,
          );
        }
        drawLine(ctx, api, 250, 760, 1650, 760, themeColors.pink, 4);
        drawCenteredText(ctx, api, 'Progress marker unchanged', 960, 840, 36, themeColors.pink);
      });
    } else if (currentBeat === 1) {
      const rows = [
        'hours-17 · Art closed',
        'hours-24 · History open',
        'train-22 · cancelled',
        'route-31 · current History bus',
      ];
      drawFocusTarget(ctx, api, 'stored-receipts', () => {
        drawCenteredText(ctx, api, 'Complete stored receipts', 480, 300, 33, themeColors.blue);
        rows.forEach((s, i) =>
          drawBox(
            ctx,
            api,
            s,
            170,
            380 + i * 120,
            660,
            85,
            i === 1 || i === 3 ? themeColors.green : themeColors.muted,
          ),
        );
      });
      drawFocusTarget(ctx, api, 'selected-context', () => {
        const u = cueProgress('bounded-context-b2-2');
        if (u === 1) api.rect(ctx, 1160, 350, 580, 510, themeColors.panel, themeColors.cyan, 2, 12);
        drawCenteredText(ctx, api, 'Next model context', 1450, 420, 32, themeColors.cyan);
        for (const [i, s] of [rows[1], rows[3]].entries())
          if (u > 0)
            drawBox(
              ctx,
              api,
              s,
              mix(880, 1200, u),
              mix(510 + i * 190, 510 + i * 190, u),
              500,
              90,
              themeColors.green,
            );
      });
    } else {
      drawFocusTarget(ctx, api, 'submitted-tokens', () => {
        drawCenteredText(
          ctx,
          api,
          'Each submitted request repeats the retained prefix',
          960,
          285,
          33,
          themeColors.yellow,
        );
        for (let i = 0; i < 4; i++) {
          const x = 280 + i * 410;
          api.rect(ctx, x, 800 - 1000 * 0.25, 270, 1000 * 0.25, themeColors.blue);
          for (let j = 0; j < i; j++)
            api.rect(
              ctx,
              x,
              800 - (1000 + (j + 1) * 200) * 0.25,
              270,
              200 * 0.25 - 2,
              [themeColors.cyan, themeColors.yellow, themeColors.pink][j],
            );
          drawCenteredText(ctx, api, 'Call ' + (i + 1), x + 135, 865, 28, themeColors.muted);
          drawCenteredText(
            ctx,
            api,
            1000 + i * 200,
            x + 135,
            760 - (1000 + i * 200) * 0.25,
            35,
            themeColors.cyan,
          );
        }
        drawEquation(ctx, api, '1000+1200+1400+1600=5200', 960, 945, 43, themeColors.green);
      });
    }
    drawFooter(
      ctx,
      api,
      'Receipts remain complete outside the prompt; selected context and submitted volume are separate',
    );
  };
  drawFocusTarget(ctx, api, 'aa-bounded-context-mechanism', paintMechanism);
}
export default {
  id: 'bounded-context',
  draw: drawBoundedContext,
  cues: [
    'bounded-context-b1-1',
    'bounded-context-b2-1',
    'bounded-context-b2-2',
    'bounded-context-b3-1',
  ],
};
