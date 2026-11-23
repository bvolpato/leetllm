import { complete, event } from '../construction.mjs';
import { precisionFrame } from '../model.mjs';
import { equation, target, text } from '../defaults.mjs';

export function drawPrecision(ctx, scene, state, api) {
  const { C } = api;
  const p = precisionFrame();
  const beat = state.beat ?? 0;
  const origin = p.inputs[0];
  const exact = event(state, 0, 'exact-halfway');
  const compareBits = beat === 1 && event(state, 1, 'compare-last-bits') > 0;
  const round = event(state, 1, 'narrow-accumulator');
  const widen = event(state, 2, 'wide-accumulator');
  const x = (offset) => 365 + offset * 310;

  equation(
    ctx,
    api,
    String.raw`x=[2^{24},\ 1,\ -2^{24}]\quad\mathrm{float32}`,
    960,
    286,
    49,
    C.ink,
  );
  if (!compareBits)
    text(ctx, api, 'First addition  ·  integer ticks shown', x(1), 390, 31, C.ink, 'center');
  [0, 1, 2].forEach((i) =>
    text(ctx, api, (origin + i).toLocaleString('en-US'), x(i), 468, 32, C.ink, 'center'),
  );

  function lane(y, name, offset, wide, color) {
    text(ctx, api, name, 235, y + 10, 38, color, 'right');
    api.line(ctx, x(0) - 35, y, x(2) + 35, y, C.muted, 3);
    for (const i of wide ? [0, 1, 2] : [0, 2]) api.line(ctx, x(i), y - 17, x(i), y + 17, color, 4);
    if (!wide) {
      api.circle(ctx, x(p.narrowFirst - origin), y, 9, color, color, 2);
      if (exact > 0) api.circle(ctx, x(offset), y, 14, 'transparent', C.yellow, 4);
    } else {
      api.circle(ctx, x(offset), y, 10, color, color, 2);
    }
  }

  const narrowCancel = event(state, 1, 'narrow-cancel');
  const narrowMean = event(state, 1, 'narrow-mean');
  if (narrowCancel > 0) text(ctx, api, 'After cancellation', 1245, 390, 31, C.ink, 'center');
  if (narrowMean > 0) text(ctx, api, 'Returned mean', 1600, 390, 31, C.ink, 'center');
  function result(y, color, cancel, sum, divide, mean, dtype) {
    if (complete(cancel)) text(ctx, api, String(sum), 1245, y + 13, 54, color, 'center');
    if (complete(divide)) {
      text(ctx, api, String(mean), 1600, y + 11, 34, color, 'center');
      text(ctx, api, dtype, 1600, y + 55, 27, color, 'center');
    }
  }

  target(ctx, api, 'precision-narrow', () => {
    const offset = api.lerp(exact, p.narrowFirst - origin, round);
    lane(555, 'float32', offset, false, C.blue);
    if (compareBits) {
      text(ctx, api, 'Default rounding  ·  ties to even', x(1), 390, 31, C.ink, 'center');
      for (const tick of [0, 2]) {
        const [bits] = new Uint32Array(Float32Array.of(origin + tick).buffer);
        text(ctx, api, 'last bit ' + (bits & 1), x(tick), 623, 30, C.blue, 'center');
      }
    }
    result(555, C.blue, narrowCancel, p.narrowSum, narrowMean, p.narrowMean, 'float32');
  });
  if (beat === 2)
    target(ctx, api, 'precision-wide', () => {
      lane(710, 'float64', (p.wideFirst - origin) * widen, true, C.green);
      result(
        710, C.green, event(state, 2, 'wide-cancel'), p.wideSum,
        event(state, 2, 'wide-mean'), p.wideMean, 'float64',
      );
    });
  if (beat === 0 && complete(exact))
    text(ctx, api, 'Can float32 store the value at the ring?', 960, 900, 39, C.yellow, 'center');
  if (beat > 0) {
    const call = beat === 1 ? 'x.mean()' : 'x.mean(dtype=np.float64)';
    api.text(ctx, call, 960, 900, 40, C.ink, 'center', 'mono');
  }
}

export default {
  id: 'precision',
  draw: drawPrecision,
  cues: [
    'exact-halfway', 'compare-last-bits', 'narrow-accumulator', 'narrow-cancel', 'narrow-mean',
    'wide-accumulator', 'wide-cancel', 'wide-mean',
  ],
};
