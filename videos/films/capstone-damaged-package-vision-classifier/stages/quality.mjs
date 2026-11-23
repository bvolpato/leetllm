import { photos } from '../fixtures.mjs';
import { route } from '../arithmetic.mjs';
import { sampleModel, visionFrame } from '../model.mjs';
import { originalCard, originalPhoto, originalText } from '../defaults.mjs';
export function drawQuality(ctx, scene, state, api) {
  const modelState = visionFrame('quality', state);
  let wrapped = api;
  wrapped = {
    ...api,
    components: {
      ...api.components,
      card: (options) =>
        api.components.card({
          ...options,
          label:
            options.y === 820 &&
            !modelState.after(
              modelState.beat === 0 ? 'original-dark-route' : 'original-empty-route',
              modelState.beat,
            )
              ? 'Checking quality'
              : options.label,
        }),
    },
  };
  const originalState = {
    ...state,
    visionScene: 'quality',
  };
  const { C: themeColors, teaching: teaching } = wrapped,
    originalModelState = sampleModel(originalState);
  {
    const plot = teaching.axes({
      x: 240,
      y: 390,
      width: 1000,
      height: 410,
      xDomain: [0, 1],
      yDomain: [0, 1],
      xTicks: [0, 0.2, 0.5, 1],
      yTicks: [0, 0.45, 1],
      xLabel: 'brightness',
      yLabel: 'blur score',
      fontSize: 27,
    });
    const bx = plot.point(0.2, 0).x,
      by = plot.point(0, 0.45).y;
    wrapped.focus.target('brightness-limit', () =>
      wrapped.line(ctx, bx, 390, bx, 800, themeColors.pink, 3),
    );
    wrapped.focus.target('blur-limit', () =>
      wrapped.line(ctx, 240, by, 1240, by, themeColors.pink, 3),
    );
    wrapped.focus.target('quality-points', () =>
      teaching.scatter({
        plot,
        points: photos.map((r, i) => ({
          x: r.brightness,
          y: r.blur,
          color: i === 1 ? themeColors.green : themeColors.pink,
          radius: 12,
        })),
      }),
    );
    photos.forEach((r, i) => {
      const at = plot.point(r.brightness, r.blur);
      originalText(
        ctx,
        wrapped,
        r.id,
        at.x + (i === 2 ? 70 : -25),
        at.y + (i === 2 ? -85 : -35),
        26,
        i === 1 ? themeColors.green : themeColors.pink,
        'center',
      );
    });
    const selected = photos[originalModelState.b ? 2 : 0];
    originalText(
      ctx,
      wrapped,
      selected.id + ' · schematic input',
      1565,
      345,
      28,
      themeColors.yellow,
      'center',
    );
    wrapped.focus.target('selected-photo', () =>
      originalPhoto(ctx, wrapped, 1370, 400, 390, {
        dark: selected.brightness < 0.2,
        empty: !selected.visible,
      }),
    );
    wrapped.focus.target('visibility-gate', () =>
      originalCard(
        ctx,
        wrapped,
        'Visible: ' + (selected.visible ? 'yes' : 'NO'),
        1370,
        700,
        390,
        selected.visible ? themeColors.cyan : themeColors.pink,
        82,
      ),
    );
    wrapped.focus.target('quality-route', () =>
      originalCard(ctx, wrapped, route(selected), 1370, 820, 390, themeColors.pink, 82),
    );
  }
}
export default {
  id: 'quality',
  draw: drawQuality,
  cues: [
    'quality-b1-1',
    'quality-b1-2',
    'quality-b1-3',
    'dv-original-dark-route',
    'quality-b2-1',
    'quality-b2-2',
    'dv-original-empty-route',
  ],
};
