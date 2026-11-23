import { cropSnapshot, parcelGeometry } from '../arithmetic.mjs';
import { sampleModel, visionFrame } from '../model.mjs';
import { originalPhoto, originalText } from '../defaults.mjs';
export function drawPreprocess(ctx, scene, state, api) {
  const modelState = visionFrame('preprocess', state);
  let wrapped = api;
  const originalState = {
    ...state,
    visionScene: 'preprocess',
  };
  const { C: themeColors } = wrapped,
    originalModelState = sampleModel(originalState);
  {
    wrapped.focus.target('original-photo', () => originalPhoto(ctx, wrapped, 300, 340, 900));
    const crop = cropSnapshot(originalModelState.b, originalState.beatP ?? 0);
    const transformedHeight = (390 * crop.h) / crop.w;
    const transformedBounds = {
      x: 1340,
      y: 500,
      width: 390,
      height: transformedHeight,
    };
    wrapped.rect(ctx, 1340, 500, 390, transformedHeight, themeColors.panel, undefined, 0);
    const scale = 390 / crop.w;
    for (const shape of parcelGeometry(300, 340, 900)) {
      const points = shape.points.map((point) => ({
        x: 1340 + (point.x - crop.x) * scale,
        y: 500 + (point.y - crop.y) * scale,
      }));
      wrapped.focus.target('transformed-photo', () =>
        wrapped.path(ctx, points, {
          ...shape,
          width: shape.width * scale,
          clip: transformedBounds,
        }),
      );
    }
    wrapped.focus.target('transformed-photo', () =>
      wrapped.rect(ctx, 1340, 500, 390, transformedHeight, 'rgba(0,0,0,0)', themeColors.cyan, 0),
    );
    wrapped.focus.target('crop-window', () =>
      wrapped.rect(ctx, crop.x, crop.y, crop.w, crop.h, 'rgba(0,0,0,0)', themeColors.yellow, 0),
    );
    originalText(
      ctx,
      wrapped,
      'Inspect the actual transformed input',
      1530,
      420,
      28,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'preprocess',
  draw: drawPreprocess,
  cues: ['preprocess-b1-1', 'preprocess-b1-2', 'preprocess-b2-1', 'preprocess-b2-2'],
};
