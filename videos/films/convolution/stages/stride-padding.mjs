import { scanSnapshot, stridePaddingFrame } from '../construction.mjs';
import { IMAGE, KERNEL } from '../fixtures.mjs';
import { equation, featureGrid, imageGrid, text } from '../defaults.mjs';
import { cueClock, footprint } from '../footprint.mjs';

const unpadded = scanSnapshot(IMAGE, KERNEL, 1, { order: [0, 2, 3, 4, 5, 6, 7, 8, 1] });

export function drawStridePadding(ctx, scene, state, api) {
  const cue = cueClock(scene, state, api);
  const beat = state.beat;
  const padded = cue('padding-build') > 0;
  const unit = cue('restore-stride') === 1;
  const progress =
    beat === 0 ? cue('stride-scan') : beat === 1 ? cue('boundary-calculate') : cue('padded-sweep');
  let f;
  if (padded) f = stridePaddingFrame(beat, progress);
  else if (unit) f = unpadded;
  else f = stridePaddingFrame(0, cue('stride-scan'));
  const { C } = api;
  const pitch = 89,
    x = 150 + (f.padding ? 0 : pitch),
    y = 301 + (f.padding ? 0 : pitch);
  api.focus.target('stride-source-grid', () => {
    text(
      ctx,
      api,
      'Stride ' + f.stride + '     Padding ' + f.padding,
      457,
      247,
      37,
      C.ink,
      'center',
    );
    imageGrid(ctx, api, f.input, x, y, pitch, {
      padded: !!f.padding,
      borderReveal: cue('padding-build'),
    });
    footprint(ctx, api, x, y, pitch, ...f.active, 3, 3, C.yellow);
  });
  api.focus.target('boundary-products', () => {
    text(ctx, api, 'Pixel × weight', 1005, 330, 36, C.ink, 'center');
    featureGrid(ctx, api, f.products, 855, 396, 104, {
      visible: padded && beat === 1 ? Math.floor(progress * 9) : Infinity,
    });
    const ready = padded && beat === 1 ? progress === 1 : f.count > 0;
    text(ctx, api, 'Sum   ' + (ready ? f.sum : '?'), 1005, 823, 42, C.yellow, 'center');
  });
  api.focus.target('stride-response-grid', () => {
    const visible = new Set(f.visible);
    if (beat === 2) visible.add(2);
    const cols = f.result[0].length;
    const values = f.result.map((row, r) =>
      row.map((v, c) => (visible.has(r * cols + c) ? v : '?')),
    );
    text(ctx, api, 'Response map', 1510, 247, 37, C.ink, 'center');
    const cell = f.padding ? 83 : 120;
    featureGrid(ctx, api, values, 1510 - (cols * cell) / 2, 395, cell, {
      active: f.output[0] * cols + f.output[1],
    });
  });
  if (beat === 2)
    api.focus.target('output-size-rule', () =>
      equation(
        ctx,
        api,
        'H_{\\rm out}=\\left\\lfloor\\frac{H+2P-K}{S}\\right\\rfloor+1',
        1300,
        985,
        43,
        C.ink,
      ),
    );
}
export default {
  id: 'stride-padding',
  draw: drawStridePadding,
  cues: [
    'stride-scan',
    'restore-stride',
    'padding-build',
    'boundary-calculate',
    'padded-sweep',
    'shape-rule',
  ],
};
