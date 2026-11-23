import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionPanel,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawDispatchCommit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('dispatch-commit', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'dispatch-commit', () => {
    const db = drawConstructionPanel(ctx, api, 130, 355, 720, 490, themeColors.blue),
      gpu = drawConstructionPanel(ctx, api, 1120, 355, 660, 490, themeColors.cyan);
    drawConstructionCenter(ctx, api, 'Database authority', 490, 410, 32, themeColors.blue);
    drawConstructionCenter(ctx, api, 'External worker / GPU', 1450, 410, 32, themeColors.cyan);
    if (currentBeat === 0) {
      drawConstructionBox(
        ctx,
        api,
        modelState.committed ? 'Reservation COMMITTED' : 'Reservation transaction pending',
        200,
        490,
        580,
        125,
        modelState.committed ? themeColors.green : themeColors.yellow,
        30,
      );
      drawConstructionBox(
        ctx,
        api,
        modelState.intentReady ? 'Durable dispatch intent' : 'Intent remains local',
        200,
        665,
        580,
        100,
        modelState.intentReady ? themeColors.green : themeColors.muted,
        29,
      );
      if (modelState.intentReady) {
        drawConstructionArrow(ctx, api, 890, 680, 1085, 680, themeColors.green);
        drawConstructionBox(
          ctx,
          api,
          'Delivery may now begin',
          1190,
          635,
          520,
          120,
          themeColors.green,
          29,
        );
      }
    } else if (currentBeat === 1) {
      drawConstructionCenter(
        ctx,
        api,
        'Unsafe branch · restart with uncommitted intent',
        960,
        285,
        31,
        themeColors.yellow,
      );
      drawConstructionBox(
        ctx,
        api,
        modelState.rolledBack ? 'ROLLBACK: reservation erased' : 'Uncommitted reservation',
        200,
        500,
        580,
        140,
        modelState.rolledBack ? themeColors.pink : themeColors.yellow,
        30,
      );
      if (modelState.unsafeGPU) {
        drawConstructionArrow(ctx, api, 880, 540, 1090, 540, themeColors.pink);
        drawConstructionBox(
          ctx,
          api,
          'Kernels already running',
          1190,
          490,
          520,
          140,
          themeColors.pink,
          32,
        );
      }
      if (modelState.missingRecord)
        drawConstructionCenter(
          ctx,
          api,
          'Database rollback cannot unrun GPU work',
          960,
          945,
          36,
          themeColors.pink,
        );
    } else {
      drawConstructionBox(
        ctx,
        api,
        'Definite failure before execution',
        200,
        495,
        580,
        140,
        themeColors.yellow,
        29,
      );
      drawConstructionBox(
        ctx,
        api,
        'ACK missing · worker may run',
        1190,
        495,
        520,
        140,
        themeColors.yellow,
        29,
      );
      if (modelState.definiteFailure)
        drawConstructionCenter(ctx, api, 'Release staged hold', 490, 750, 29, themeColors.green);
      if (modelState.uncertain)
        drawConstructionCenter(
          ctx,
          api,
          'Keep hold · reconcile attempt',
          1450,
          750,
          29,
          themeColors.pink,
        );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Committed intent, external acceptance and execution retirement are separate events',
    );
  });
}
export default {
  id: 'dispatch-commit',
  draw: drawDispatchCommit,
  cues: [
    'mt-dispatch-commit-b0',
    'mt-dispatch-commit-s0-2',
    'mt-dispatch-commit-s0-3',
    'mt-dispatch-commit-b1',
    'mt-dispatch-commit-s1-0',
    'mt-dispatch-commit-s1-1',
    'mt-dispatch-commit-s1-2',
    'mt-dispatch-commit-b2',
    'mt-dispatch-commit-s2-1',
    'mt-dispatch-commit-s2-2',
  ],
};
