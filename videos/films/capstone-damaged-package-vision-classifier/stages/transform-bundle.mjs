import { parcelGeometry } from '../arithmetic.mjs';
import { visionFrame } from '../model.mjs';
import { visionNote, visionPhoto, visionText } from '../defaults.mjs';
export function drawTransformBundle(ctx, scene, state, api) {
  const frameState = visionFrame('transform-bundle', state);
  return api.focus.target('dv-transform-bundle-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      const source = visionPhoto(ctx, api, 180, 350, 680);
      const cropSide = (source.height * 224) / 256;
      const crop = {
        x: source.x + (source.width - cropSide) / 2,
        y: source.y + (source.height - cropSide) / 2,
        width: cropSide,
        height: cropSide,
      };
      api.rect(
        ctx,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        'rgba(0,0,0,0)',
        themeColors.yellow,
        0,
      );
      visionText(
        ctx,
        api,
        '256 short side → central 224',
        520,
        300,
        34,
        themeColors.yellow,
        'center',
      );
      const output = {
        x: 1190,
        y: 390,
        width: 400,
        height: 400,
      };
      api.rect(
        ctx,
        output.x,
        output.y,
        output.width,
        output.height,
        themeColors.panel,
        themeColors.cyan,
        0,
      );
      if (resultComplete('resnet-transform', 0))
        for (const shape of parcelGeometry(source.x, source.y, source.width))
          api.path(
            ctx,
            shape.points.map((p) => ({
              x: output.x + ((p.x - crop.x) * output.width) / crop.width,
              y: output.y + ((p.y - crop.y) * output.height) / crop.height,
            })),
            {
              ...shape,
              clip: output,
            },
          );
      api.arrow(ctx, 910, 540, 1130, 540, themeColors.cyan, 4);
      visionText(
        ctx,
        api,
        '256-pixel short side · central square crop',
        520,
        840,
        26,
        themeColors.muted,
        'center',
      );
      if (currentBeat === 0) {
        const show = resultComplete('channel-normalization', 0);
        visionText(
          ctx,
          api,
          show ? '(RGB / 255 − mean) / std' : 'RGB normalization follows the crop',
          1370,
          865,
          30,
          show ? themeColors.yellow : themeColors.muted,
          'center',
        );
        if (show)
          visionText(
            ctx,
            api,
            'μ .485 .456 .406 · σ .229 .224 .225',
            960,
            922,
            28,
            themeColors.ink,
            'center',
          );
      } else if (currentBeat === 1) {
        api.circle(ctx, source.x + 15, source.y + 15, 12, themeColors.pink);
        visionText(
          ctx,
          api,
          resultComplete('lost-corner', 1)
            ? 'Outside crop → absent from input'
            : 'Inspect the corner before cropping',
          960,
          915,
          34,
          themeColors.pink,
          'center',
        );
      } else
        visionText(
          ctx,
          api,
          'Pin transform + weights + precision + labels + route policy',
          960,
          920,
          32,
          themeColors.ink,
          'center',
        );
      visionNote(
        ctx,
        api,
        'A missing input region does not determine the learned damage probability.',
      );
    }
  });
}
export default {
  id: 'transform-bundle',
  draw: drawTransformBundle,
  cues: [
    'dv-transform-bundle-0',
    'dv-transform-bundle-operation-0',
    'dv-resnet-transform',
    'dv-channel-normalization',
    'dv-transform-bundle-1',
    'dv-transform-bundle-operation-1',
    'dv-lost-corner',
    'dv-transform-bundle-2',
    'dv-transform-bundle-operation-2',
  ],
};
