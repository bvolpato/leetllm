import { neuralFrame } from '../construction.mjs';
import { equation, focusTarget, head, note, pill, text } from '../defaults.mjs';
export function drawStable(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'stable-mechanism', () => {
    head(ctx, api, 'The mathematical probability exists; the naive evaluation path fails');
    equation(ctx, api, String.raw`z=-1000,\quad y=1`, 960, 365, 51, themeColors.yellow);
    focusTarget(ctx, api, 'unstable-exponential', () => {
      if (currentBeat === 0) {
        equation(ctx, api, String.raw`\frac{1}{1+e^{1000}}`, 960, 600, 72, themeColors.pink);
        if (S('overflow-example', 0))
          pill(ctx, api, 'exp(1000) → OverflowError', 960, 805, 920, themeColors.pink, 39);
      } else {
        equation(
          ctx,
          api,
          String.raw`\frac{1}{1+e^{-z}}\cdot\frac{e^z}{e^z}=\frac{e^z}{1+e^z}`,
          960,
          560,
          62,
          themeColors.cyan,
        );
        text(
          ctx,
          api,
          'e⁻¹⁰⁰⁰ safely underflows · sigmoid rounds to 0',
          960,
          710,
          33,
          themeColors.cyan,
          'center',
        );
      }
    });
    focusTarget(ctx, api, 'logit-loss', () => {
      if (currentBeat === 1)
        equation(
          ctx,
          api,
          String.raw`-\log(0)=\infty\quad\text{loses the finite logit loss}`,
          960,
          915,
          42,
          themeColors.pink,
        );
      if (currentBeat === 2) {
        equation(
          ctx,
          api,
          String.raw`L=\max(z,0)-yz+\log(1+e^{-|z|})`,
          960,
          815,
          45,
          themeColors.green,
        );
        if (resultComplete('stable-logit-loss', 2))
          equation(
            ctx,
            api,
            String.raw`0-1(-1000)+\log(1+e^{-1000})\approx1000`,
            960,
            940,
            43,
            themeColors.green,
          );
        else text(ctx, api, 'Fixed-logit loss pending', 960, 940, 34, themeColors.muted, 'center');
      }
    });
    note(
      ctx,
      api,
      'Keep the logit available; stable BCE avoids taking the logarithm of the rounded score.',
    );
    return;
  });
}
export default {
  id: 'stable',
  draw: drawStable,
  cues: ['overflow-example', 'stable-sigmoid', 'stable-logit-loss'],
};
