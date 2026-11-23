import { cueProgress } from '../latency-ruler.mjs';
import {
  drawExtensionArrow,
  drawExtensionCaption,
  drawExtensionEquation,
  drawExtensionPanel,
  drawExtensionText,
  formatGradientValue,
  withTarget,
} from '../defaults.mjs';
export function drawSavedOutput(ctx, scene, state, api) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0;
  const paint = () => {
    const b = 1 / (1 + Math.exp(-2));
    const changed = currentBeat === 1 && cueProgress(state, api, 'saved-output-b2', 1, 0.02, 0.2) === 1;
    const separate = currentBeat === 2 && cueProgress(state, api, 'saved-output-b3', 2, 0.12, 0.32) === 1;
    const rejected = changed && cueProgress(state, api, 'saved-rejection', 1, 0.65, 0.8) === 1;
    const returned = separate && cueProgress(state, api, 'saved-gradient', 2, 0.42, 0.6) === 1;
    drawExtensionText(ctx, api, 'a = 2    →    sigmoid    →    b    →    c = 3b', 960, 310, 38, themeColors.cyan, 'center');
    components.matrix({
      values: [[formatGradientValue(ctx, api, b + Number(changed), 6)]],
      x: 450,
      y: 400,
      cellSize: 165,
      style: {
        fill: themeColors.panel,
        fontSize: 30,
      },
      cellStyle: () => ({
        stroke: changed ? themeColors.pink : themeColors.cyan,
        textColor: changed ? themeColors.pink : themeColors.cyan,
      }),
    });
    drawExtensionArrow(ctx, api, 650, 475, 1070, 475, themeColors.cyan);
    withTarget(ctx, api, 'saved-buffer', () =>
      drawExtensionPanel(
        ctx,
        api,
        1100,
        390,
        600,
        175,
        () => {
          drawExtensionText(
            ctx,
            api,
            'backward requires original b',
            1400,
            438,
            30,
            themeColors.cyan,
            'center',
          );
          drawExtensionEquation(ctx, api, String.raw`3b(1-b)`, 1400, 515, 45, themeColors.pink);
        },
        themeColors.cyan,
      ),
    );
    if (changed || separate)
      withTarget(ctx, api, 'saved-version', () => {
        drawExtensionText(
          ctx,
          api,
          changed ? 'b += 1 · same storage' : 'changed = b + 1 · separate storage',
          960,
          675,
          36,
          changed ? themeColors.pink : themeColors.green,
          'center',
        );
        drawExtensionText(
          ctx,
          api,
          `saved version 0 · b now at version ${Number(changed)}`,
          960,
          765,
          33,
          changed ? themeColors.pink : themeColors.green,
          'center',
        );
        if (rejected || returned) drawExtensionText(
          ctx,
          api,
          rejected
            ? 'backward rejected: saved output was modified'
            : 'input gradient ≈ ' + (3 * b * (1 - b)).toFixed(6),
          960,
          900,
          31,
          rejected ? themeColors.pink : themeColors.green,
          'center',
        );
      });
    if (separate) drawExtensionCaption(ctx, api, 'New tensor ≈ ' + (b + 1).toFixed(6) + '    ·    b ≈ ' + b.toFixed(6));
  };
  withTarget(ctx, api, 'saved-output-mechanism', paint);
  ctx.restore();
}
export default {
  id: 'saved-output',
  draw: drawSavedOutput,
  cues: ['saved-output-b1', 'saved-output-b2', 'saved-output-b3', 'saved-rejection', 'saved-gradient'],
};
