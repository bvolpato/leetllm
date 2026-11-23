import { clamp, cueDone } from '../construction.mjs';
import { caption, equation, line, text } from '../defaults.mjs';
export function drawSelectedError(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    const selected = currentBeat > 0;
    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / 20),
        col = i % 20,
        x = 220 + col * 75,
        yy = 380 + row * 78,
        isWrong = i >= 90,
        color = isWrong ? themeColors.pink : selected ? themeColors.border : themeColors.green;
      api.rect(ctx, x, yy, 58, 42, color, undefined, 0);
      if (!selected || isWrong) {
        if (!isWrong) line(ctx, api, x + 29, yy, x + 29, yy + 42, themeColors.panel, 3);
        if (isWrong) text(ctx, api, '×', x + 29, yy + 30, 29, themeColors.panel, 'center');
      }
    }
    text(
      ctx,
      api,
      '90 two-label sets contain truth · 10 wrong singletons',
      960,
      295,
      33,
      themeColors.ink,
      'center',
    );
    if (currentBeat > 0) {
      if (done('cf-selected100', 1, 0.5))
        equation(
          ctx,
          api,
          String.raw`\mathrm{joint}=\frac{10}{100}=10\%\qquad\mathrm{selected}=\frac{10}{10}=100\%`,
          960,
          855,
          42,
          themeColors.pink,
        );
      else if (done('cf-joint-error', 1, 0.2))
        equation(
          ctx,
          api,
          String.raw`\mathrm{joint}=\frac{10}{100}=10\%`,
          960,
          855,
          42,
          themeColors.pink,
        );
      caption(
        ctx,
        api,
        currentBeat === 2
          ? 'A singleton can trigger a policy; it does not grant action permission.'
          : 'Accepting only the ten singletons changes the denominator.',
      );
    } else {
      if (done('cf-population90', 0, 0.5))
        text(
          ctx,
          api,
          'marginal inclusion 90/100 = 90%',
          960,
          855,
          36,
          themeColors.green,
          'center',
        );
      caption(ctx, api, 'Each rectangle is one request’s supplied set outcome.');
    }
  };
  if (api.focus) api.focus.target(`${'selected-error'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'selected-error',
  draw: drawSelectedError,
  cues: [
    'selected-error-b1',
    'cf-population90',
    'selected-error-b2',
    'cf-selected100',
    'cf-joint-error',
    'selected-error-b3',
  ],
};
