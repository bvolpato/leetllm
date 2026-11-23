import { floatAdds, halfAdds, phase } from '../encoding.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { originalText } from '../defaults.mjs';
export function drawAccumulation(ctx, scene, state, api) {
  {
    const { C, components: c, teaching: t } = api,
      s = sampleOriginalModel('accumulation', state),
      b = s.step;
    {
      originalText(
        ctx,
        api,
        'Start at 1,024 · add 0.25 four times · round after each addition',
        140,
        260,
        32,
      );
      const plot = api.focus.target('accumulation-additions-completed-stored-running-sum', () =>
        t.axes({
          x: 310,
          y: 405,
          width: 980,
          height: 380,
          xDomain: [0, 4.5],
          yDomain: [1023.8, 1025.4],
          xTicks: [0, 1, 2, 3, 4],
          yTicks: [1024, 1024.5, 1025],
          xLabel: 'additions completed',
          yLabel: 'stored running sum',
          formatY: (value) => value.toFixed(2),
        }),
      );
      const points = (trace) =>
        trace.slice(0, s.count + 1).map((y, x) => ({
          x,
          y,
        }));
      api.focus.target('accumulation-fp16-trace', () => {
        t.curve({
          plot,
          points: points(halfAdds),
          color: C.pink,
          width: 5,
        });
        t.scatter({
          plot,
          points: points(halfAdds).map((v) => ({
            ...v,
            color: C.pink,
            radius: 8,
          })),
        });
        originalText(ctx, api, `FP16: ${s.half.toFixed(2)}`, 1390, 500, 31, C.pink);
      });
      if (b > 0)
        api.focus.target('accumulation-fp32-trace', () => {
          t.curve({
            plot,
            points: points(floatAdds),
            color: C.cyan,
            width: 4,
          });
          t.scatter({
            plot,
            points: points(floatAdds).map((v) => ({
              ...v,
              color: C.cyan,
              radius: 8,
            })),
          });
          originalText(ctx, api, `FP32: ${s.wide.toFixed(2)}`, 1390, 650, 31, C.cyan);
        });
      api.focus.target('accumulation-update-count', () =>
        originalText(
          ctx,
          api,
          `Current update count: ${s.count}`,
          960,
          920,
          32,
          C.yellow,
          'center',
        ),
      );
      originalText(
        ctx,
        api,
        'Exact toy operands · FP16 RNE and explicitly rounded FP32 additions',
        960,
        980,
        27,
        C.muted,
        'center',
      );
    }
  }
  const currentBeat = state.beat,
    progress = phase(state.beatP);
  return;
}
export default {
  id: 'accumulation',
  draw: drawAccumulation,
  cues: [
    'accumulation-beat-1-focus-1',
    'accumulation-beat-1-focus-2',
    'accumulation-replay-fp32',
    'accumulation-finer-grid-retained',
    'accumulation-beat-3-focus-1',
  ],
};
