import { pixels } from '../fixtures.mjs';
import { recon, reconstructionFrame } from '../model.mjs';
import { box, outline, pixelGrid, text } from '../defaults.mjs';
export function drawReconstruction(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    F = components.fade;
  {
    const frame = reconstructionFrame(currentBeat, progress2, state.cues);
    const input = api.focus.target('reconstruction-input', () =>
      pixelGrid(ctx, api, pixels, 170, 350, 78),
    );
    const output = api.focus.target('reconstruction-output', () =>
      pixelGrid(ctx, api, recon, 750, 350, 78),
    );
    const selected = currentBeat === 0 ? frame.selected : Math.max(0, frame.count - 1);
    outline(ctx, api, input[selected]);
    outline(ctx, api, output[selected], themeColors.green);
    text(ctx, api, 'input', 360, 290, 35, themeColors.ink, 'center');
    text(ctx, api, 'decoded', 940, 290, 35, themeColors.green, 'center');
    if (currentBeat === 0) {
      text(ctx, api, 'one matched pixel', 1535, 300, 32, themeColors.muted, 'center');
      api.focus.target('pixel-difference', () =>
        box(
          ctx,
          api,
          [
            `x = ${pixels[6]}   x̂ = ${recon[6].toFixed(4)}`,
            frame.differenceReady ? `x − x̂ = ${frame.differences[6].toFixed(4)}` : 'x − x̂ = ?',
          ],
          1280,
          365,
          510,
          185,
          themeColors.yellow,
          32,
        ),
      );
      api.focus.target('pixel-square', () =>
        box(
          ctx,
          api,
          frame.squareReady
            ? `(${frame.differences[6].toFixed(4)})² ≈ ${frame.errors[6].toFixed(6)}`
            : '(x − x̂)² = ?',
          1270,
          635,
          530,
          120,
          themeColors.pink,
          31,
        ),
      );
    } else {
      text(ctx, api, 'squared error · intensity ×35', 1535, 300, 27, themeColors.pink, 'center');
      api.focus.target('pixel-squared-errors', () => {
        const cells = pixelGrid(
          ctx,
          api,
          frame.errors.map((value, i) => (i < frame.count ? 35 * value : 0)),
          1350,
          350,
          70,
        );
        if (frame.count) outline(ctx, api, cells[selected], themeColors.pink);
      });
      api.focus.target('error-ledger', () =>
        box(
          ctx,
          api,
          [
            `${frame.count} / 25 pixels · sum ≈ ${frame.sum.toFixed(6)}`,
            frame.meanReady ? `MSE = sum / 25 ≈ ${frame.mean.toFixed(4)}` : 'MSE = sum / 25 = ?',
          ],
          1235,
          775,
          610,
          170,
          themeColors.green,
          31,
        ),
      );
      if (frame.count)
        text(
          ctx,
          api,
          `current squared error ≈ ${frame.errors[selected].toFixed(6)}`,
          940,
          840,
          29,
          themeColors.pink,
          'center',
        );
    }
  }
}
export default {
  id: 'reconstruction',
  draw: drawReconstruction,
  cues: ['pixel-subtract', 'pixel-square', 'error-sum', 'error-mean'],
};
