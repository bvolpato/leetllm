import { pixels } from '../fixtures.mjs';
import { codeSwapFrame, probePixels } from '../model.mjs';
import { box, cueProgress, pixelGrid, text } from '../defaults.mjs';
export function drawCodeTest(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress2, 0.12, 0.86),
    F = components.fade;
  const vector = (values) => '[' + values.map((value) => Number(value.toFixed(4))).join(', ') + ']';
  {
    const frame = codeSwapFrame(),
      swapped = currentBeat > 0 || cueProgress(ctx, api, 'code-swap', phaseForBeat(0)) > 0;
    api.focus.target('original-crop', () => pixelGrid(ctx, api, pixels, 190, 360, 80));
    text(ctx, api, 'original badge stays fixed', 390, 285, 31, themeColors.cyan, 'center');
    if (currentBeat === 0)
      api.focus.target('probe-crop', () => {
        pixelGrid(ctx, api, probePixels, 820, 330, 50);
        text(ctx, api, 'lower-region probe', 945, 285, 28, themeColors.muted, 'center');
      });
    const code = api.focus.target('swapped-code', () =>
      box(
        ctx,
        api,
        [
          swapped ? 'replacement code' : 'original code',
          vector(swapped ? frame.replacementCode : frame.originalCode),
        ],
        780,
        655,
        440,
        160,
        themeColors.yellow,
        32,
      ),
    );
    if (currentBeat === 0) {
      const destination = box(
        ctx,
        api,
        'Predict the output',
        1410,
        435,
        320,
        180,
        themeColors.green,
        33,
      );
      api.connect(ctx, code, destination, {
        color: themeColors.green,
        width: 4,
      });
    } else
      api.focus.target('swapped-output', () =>
        F(cueProgress(ctx, api, 'swapped-decode', phaseForBeat(1)), () => {
          const destination = api.groupBounds(
            ...pixelGrid(ctx, api, frame.changedOutput, 1360, 360, 80),
          );
          api.connect(ctx, code, destination, {
            color: themeColors.green,
            width: 4,
          });
        }),
      );
    api.focus.target('swap-error', () =>
      box(
        ctx,
        api,
        [
          `original code MSE ≈ ${frame.originalMSE.toFixed(4)}`,
          currentBeat > 0 && cueProgress(ctx, api, 'swap-error', phaseForBeat(1)) === 1
            ? `replacement code MSE ≈ ${frame.changedMSE.toFixed(4)}`
            : 'replacement code MSE = ?',
        ],
        670,
        870,
        1100,
        120,
        themeColors.pink,
        30,
      ),
    );
  }
}
export default {
  id: 'code-test',
  draw: drawCodeTest,
  cues: ['probe-crop', 'code-swap', 'swapped-decode', 'swap-error'],
};
