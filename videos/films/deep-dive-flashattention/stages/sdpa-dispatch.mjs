import { gradientFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawExtensionCell,
  drawExtensionFooter,
  drawExtensionL,
  drawExtensionText,
} from '../defaults.mjs';
export function drawSdpaDispatch(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('sdpa-dispatch', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      drawExtensionCell(
        ctx,
        api,
        'Request: shape / mask / dtype / device',
        180,
        330,
        1550,
        90,
        themeColors.yellow,
      );
      const names = ['fused', 'memory-efficient', 'math'];
      names.forEach((v, i) => {
        const x = 220 + i * 560;
        drawExtensionCell(
          ctx,
          api,
          v,
          x,
          540,
          450,
          100,
          currentBeat === 1 ? (i === 0 ? themeColors.pink : themeColors.muted) : themeColors.cyan,
        );
        drawExtensionL(ctx, api, x + 225, 420, x + 225, 540);
        if (currentBeat === 1)
          drawExtensionText(
            ctx,
            api,
            i === 0
              ? modelState.error
                ? 'rejected / diagnostic'
                : 'guard mismatch'
              : 'disabled by forced-only choice',
            x + 225,
            770,
            26,
            i === 0 ? themeColors.pink : themeColors.muted,
            'center',
          );
      });
      if (currentBeat === 2) {
        drawExtensionCell(ctx, api, 'model.eval()', 220, 810, 450, 90, themeColors.blue);
        drawExtensionCell(
          ctx,
          api,
          modelState.dropout ? 'dropout_p =0' : 'dropout_p remains explicit',
          1010,
          810,
          650,
          90,
          modelState.dropout ? themeColors.green : themeColors.yellow,
        );
      }
      drawExtensionFooter(
        ctx,
        api,
        currentBeat === 0
          ? 'Framework backend selection does not identify a separately installed Dao wheel'
          : currentBeat === 1
            ? 'No eligible forced path → error; float64 math uses a separate valid path'
            : 'Evaluation mode does not override the functional dropout argument',
      );
    }
  });
}
export default {
  id: 'sdpa-dispatch',
  draw: drawSdpaDispatch,
  cues: [
    'fa-sdpa-dispatch-0',
    'fa-sdpa-dispatch-1',
    'fa-dispatch-error',
    'fa-sdpa-dispatch-2',
    'fa-dropout-zero',
  ],
};
