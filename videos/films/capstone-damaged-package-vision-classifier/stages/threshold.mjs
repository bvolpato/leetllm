import { cases } from '../fixtures.mjs';
import { sampleModel, visionFrame } from '../model.mjs';
import { originalText } from '../defaults.mjs';
export function drawThreshold(ctx, scene, state, api) {
  const modelState = visionFrame('threshold', state);
  let wrapped = api;
  if (!modelState.after('original-threshold', 0))
    wrapped = {
      ...api,
      text: (...args) =>
        api.text(
          ...(args[2] === 1650
            ? [...args.slice(0, 1), 'pending', ...args.slice(2, 5), api.C.muted, ...args.slice(6)]
            : args),
        ),
    };
  const originalState = {
    ...state,
    visionScene: 'threshold',
  };
  const { C: themeColors } = wrapped,
    originalModelState = sampleModel(originalState);
  {
    const x = (v) => 500 + v * 1050;
    cases.forEach((r, i) => {
      const y = 390 + i * 140;
      originalText(ctx, wrapped, r.id, 190, y + 10, 31, themeColors.ink);
      wrapped.line(ctx, x(0), y, x(1), y, themeColors.muted, 2);
      wrapped.focus.target('usable-scores', () =>
        wrapped.circle(
          ctx,
          x(r.score),
          y,
          14,
          r.score >= 0.7 ? themeColors.yellow : themeColors.blue,
        ),
      );
      wrapped.focus.target('usable-scores', () =>
        originalText(
          ctx,
          wrapped,
          r.score.toFixed(2),
          x(r.score),
          y - 30,
          27,
          themeColors.ink,
          'center',
        ),
      );
      wrapped.focus.target('damage-threshold', () =>
        wrapped.line(ctx, x(0.7), y - 15, x(0.7), y + 25, themeColors.pink, 4),
      );
      wrapped.focus.target('review-routes', () =>
        originalText(
          ctx,
          wrapped,
          r.score >= 0.7 ? 'Priority' : 'Normal',
          1650,
          y + 10,
          29,
          r.score >= 0.7 ? themeColors.yellow : themeColors.blue,
          'center',
        ),
      );
    });
    wrapped.focus.target('threshold-contract', () =>
      originalText(
        ctx,
        wrapped,
        'Fixed threshold 0.70 · accepted usable photos',
        960,
        990,
        29,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'threshold',
  draw: drawThreshold,
  cues: [
    'threshold-b1-1',
    'threshold-b1-2',
    'dv-original-threshold',
    'threshold-b2-1',
    'threshold-b2-2',
  ],
};
