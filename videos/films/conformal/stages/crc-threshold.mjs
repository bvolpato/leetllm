import { ROUTER } from '../fixtures.mjs';
import { clamp, cueDone } from '../construction.mjs';
import { routerState } from '../model.mjs';
import { caption, dot, equation, line, text } from '../defaults.mjs';
export function drawCrcThreshold(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    const lambda = currentBeat < 1 ? 0 : currentBeat === 1 ? 0.1 : 0.6,
      s = routerState(lambda),
      x = (v) => 300 + v * 1400,
      yy = 540;
    text(
      ctx,
      api,
      `accept iff score > λ · λ = ${lambda.toFixed(1)}`,
      960,
      310,
      35,
      themeColors.yellow,
      'center',
    );
    for (const r of ROUTER) {
      const xx = x(r.score),
        kept = r.score > lambda,
        col = kept ? (r.wrong ? themeColors.pink : themeColors.green) : themeColors.muted;
      line(ctx, api, xx, 540 + 40, xx, 540 - 140, col, 5);
      dot(ctx, api, xx, 540 - 140, col, 13);
      text(ctx, api, r.id, xx, 540 + 95, 26, themeColors.muted, 'center');
      text(ctx, api, r.score.toFixed(1), xx, 540 - 175, 28, col, 'center');
      text(ctx, api, r.wrong ? 'wrong' : 'correct', xx, 540 + 145, 22, col, 'center');
    }
    line(ctx, api, x(lambda), 375, x(lambda), 605, themeColors.yellow, 4);
    if (currentBeat === 1 && done('cf-crc-fail', 1, 0.65)) {
      equation(
        ctx,
        api,
        String.raw`\widehat R=\frac29<0.25\qquad\frac{2+1}{9+1}=0.30>0.25`,
        960,
        820,
        41,
        themeColors.pink,
      );
      caption(ctx, api, 'The empirical joint rate passes; the corrected criterion fails.');
    } else if (currentBeat === 2) {
      if (done('cf-crc-pass', 2, 0.3))
        equation(
          ctx,
          api,
          String.raw`\frac{1+1}{9+1}=0.20\le0.25`,
          960,
          795,
          45,
          themeColors.green,
        );
      if (done('cf-crc-denominators', 2, 0.65))
        text(
          ctx,
          api,
          '3 accepted · 1 wrong · joint 1/9 · selective 1/3',
          960,
          900,
          32,
          themeColors.ink,
          'center',
        );
      caption(
        ctx,
        api,
        done('cf-crc-fallback', 2, 0.85)
          ? 'λ = 1 accepts none and supplies the zero-loss fallback.'
          : 'Compare the corrected bound with its declared target.',
      );
    } else
      caption(
        ctx,
        api,
        'Wrong scores 0.1, 0.6, 0.9 · arbitrary verifier outputs, not truth probabilities.',
      );
  };
  if (api.focus) api.focus.target(`${'crc-threshold'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'crc-threshold',
  draw: drawCrcThreshold,
  cues: [
    'crc-threshold-b1',
    'crc-threshold-b2',
    'cf-crc-fail',
    'crc-threshold-b3',
    'cf-crc-pass',
    'cf-crc-denominators',
    'cf-crc-fallback',
  ],
};
