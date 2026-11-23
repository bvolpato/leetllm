import { completed, operation } from '../construction.mjs';
import { underflowTraceSnapshot } from '../model.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const trace = underflowTraceSnapshot(state),
      xAt = (exponent) => 300 + (exponent + 27) * 130,
      axisY = 480;
    text(
      ctx,
      api,
      'One gradient, followed through the cast and back',
      960,
      255,
      38,
      themeColors.ink,
      'center',
    );
    text(
      ctx,
      api,
      'log₂ magnitude · FP16 subnormal step = 2⁻²⁴',
      960,
      315,
      29,
      themeColors.muted,
      'center',
    );
    api.line(ctx, 300, 480, 1600, 480, themeColors.muted, 3);
    [-26, -24, -22, -20, -18].forEach((exponent) => {
      const x = xAt(exponent);
      api.line(ctx, x, 480 - 13, x, 480 + 13, themeColors.muted, 3);
      equation(ctx, api, '2^{' + exponent + '}', x, 480 + 54, 26, themeColors.muted, 'center');
    });
    const thresholdX = xAt(-25),
      minimumX = xAt(-24);
    api.focus.target('underflow-threshold', () =>
      api.line(ctx, thresholdX, 480 - 90, thresholdX, 480 + 115, themeColors.pink, 3),
    );
    text(ctx, api, 'half-step threshold', thresholdX, 480 - 115, 25, themeColors.pink, 'center');
    text(ctx, api, 'first subnormal', minimumX, 480 + 100, 23, themeColors.cyan, 'center');
    if (currentBeat === 0) {
      if (trace.zeroProgress === 0)
        text(
          ctx,
          api,
          'Predict the stored value for g = 2⁻²⁶',
          960,
          780,
          35,
          themeColors.ink,
          'center',
        );
      const x = xAt(-26);
      api.circle(ctx, x, 480, 14, themeColors.yellow);
      equation(ctx, api, 'g = 2^{-26}', x, 480 - 48, 30, themeColors.yellow, 'center');
      {
        api.focus.target('zero-gradient-result', () => {
          if (trace.zeroProgress > 0)
            api.arrow(ctx, x, 480 + 150, 780, 480 + 150, themeColors.pink, 5);
          card(
            ctx,
            api,
            completed(state, 'tiny-gradient') ? 'FP16 cast → 0' : 'Cast result pending',
            810,
            480 + 100,
            470,
            completed(state, 'tiny-gradient') ? themeColors.pink : themeColors.muted,
          );
        });
      }
    } else if (currentBeat === 1) {
      const startX = xAt(-26),
        currentX = xAt(trace.scaledExponent),
        endX = xAt(-18);
      api.circle(ctx, startX, 480, 11, themeColors.blue);
      api.focus.target('scale-path', () => {
        api.arrow(ctx, startX, 480 - 65, currentX, 480 - 65, themeColors.green, 5);
        api.circle(ctx, currentX, 480, 14, themeColors.yellow);
      });
      equation(
        ctx,
        api,
        completed(state, 'transfer-scaled-exponent')
          ? '2^{-26} × 256 = 2^{-18}'
          : '2^{-26} × 256 = ?',
        960,
        675,
        42,
        themeColors.green,
        'center',
      );
      api.focus.target('scale-path', () =>
        text(
          ctx,
          api,
          currentX <= thresholdX
            ? 'FP16 would round this gradient to zero'
            : 'FP16 would keep a nonzero gradient',
          960,
          747,
          36,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('scaled-storage', () =>
        card(
          ctx,
          api,
          completed(state, 'scaled-storage')
            ? 'FP16 stores 2⁻¹⁸ ≈ 3.81 × 10⁻⁶'
            : 'Storage result pending',
          960,
          835,
          780,
          completed(state, 'scaled-storage') ? themeColors.green : themeColors.muted,
        ),
      );
    } else {
      const scaledX = xAt(-18),
        currentX = xAt(-18 - 8 * trace.unscaleProgress);
      api.circle(ctx, scaledX, 480, 11, themeColors.green);
      api.focus.target('unscale-path', () => {
        api.circle(ctx, scaledX, 480, 11, themeColors.green);
        api.arrow(ctx, scaledX, 480 + 115, currentX, 480 + 115, themeColors.cyan, 5);
        api.circle(ctx, currentX, 480, 14, themeColors.yellow);
      });
      equation(
        ctx,
        api,
        completed(state, 'recovered-gradient') ? '2^{-18} ÷ 256 = 2^{-26}' : '2^{-18} ÷ 256 = ?',
        960,
        675,
        42,
        themeColors.cyan,
        'center',
      );
      api.focus.target('recovered-gradient', () =>
        card(
          ctx,
          api,
          completed(state, 'recovered-gradient')
            ? 'Recovered g = 2⁻²⁶ ≈ 1.49 × 10⁻⁸'
            : 'Recovery result pending',
          960,
          760,
          780,
          completed(state, 'recovered-gradient') ? themeColors.cyan : themeColors.muted,
        ),
      );
      if (
        operation(state, 'transfer-forward-cast') > 0 ||
        completed(state, 'transfer-forward-cast')
      )
        api.focus.target('forward-rounding', () => {
          const before = components.card({
            label: 'Forward input 1.0001',
            x: 210,
            y: 910,
            width: 480,
            height: 88,
            fontSize: 27,
            fill: themeColors.panel,
            stroke: themeColors.yellow,
            textColor: themeColors.yellow,
          });
          const after = components.card({
            label: completed(state, 'transfer-forward-cast')
              ? 'FP16 stored 1.0'
              : 'Forward cast pending',
            x: 1230,
            y: 910,
            width: 480,
            height: 88,
            fontSize: 27,
            fill: themeColors.panel,
            stroke: completed(state, 'transfer-forward-cast')
              ? themeColors.pink
              : themeColors.muted,
            textColor: completed(state, 'transfer-forward-cast')
              ? themeColors.pink
              : themeColors.muted,
          });
          teaching.transfer({
            source: {
              shape: before,
              opacity: 1,
            },
            target: {
              shape: after,
              opacity: 1,
            },
            progress: operation(state, 'transfer-forward-cast'),
            color: themeColors.pink,
            gap: 18,
          });
          text(
            ctx,
            api,
            completed(state, 'forward-rounding')
              ? 'Backward scaling cannot restore this rounded forward input'
              : completed(state, 'transfer-forward-cast')
                ? 'Forward cast result: the distinguishing input has been lost'
                : 'Follow the supplied forward value through its own cast',
            960,
            1040,
            26,
            themeColors.muted,
            'center',
          );
        });
    }
  }
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'tiny-gradient',
    'scale-gradient',
    'scaled-storage',
    'transfer-scaled-exponent',
    'unscale-gradient',
    'recovered-gradient',
    'forward-rounding',
    'transfer-forward-cast',
  ],
};
