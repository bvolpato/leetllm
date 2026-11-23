import { prefBound, prefLerp, prefLoss, sigmoid } from '../arithmetic.mjs';
import {
  caption,
  constructionEquation,
  constructionText,
  focusTarget,
  functionCurve,
  heading,
  line,
  table,
} from '../defaults.mjs';
export function drawIpoTarget(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue ipo-target/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : prefBound((progress - 0.12) / 0.76);
  };
  const construction = () => {
    if (currentBeat < 2) {
      const returning = currentBeat === 1 ? cueProgress('pa-ipo-return', 1) : 0,
        m = currentBeat === 0 ? 0 : prefLerp(7, 5, returning),
        plot = functionCurve(
          ctx,
          api,
          (x) => (x - 5) ** 2,
          [-1, 11],
          [0, 36],
          260,
          420,
          1100,
          420,
          themeColors.cyan,
        ),
        at = plot.point(5, 0);
      heading(ctx, api, 'τ = 0.1 → finite reference-relative margin target 5');
      line(ctx, api, at.x, 405, at.x, 850, themeColors.yellow, 3);
      teaching.scatter({
        plot,
        points: [
          {
            x: m,
            y: (m - 5) ** 2,
            color: themeColors.green,
            radius: 13,
          },
        ],
      });
      constructionText(ctx, api, 'm = ' + m.toFixed(3), 1450, 470, 34, themeColors.green);
      constructionText(
        ctx,
        api,
        'L = ' + ((m - 5) ** 2).toFixed(3),
        1450,
        600,
        34,
        themeColors.cyan,
      );
      constructionText(
        ctx,
        api,
        '∂L/∂m = ' + (2 * (m - 5)).toFixed(3),
        1410,
        735,
        30,
        themeColors.yellow,
      );
      constructionEquation(
        ctx,
        api,
        String.raw`L_{\rm IPO}=(m-5)^2`,
        960,
        345,
        43,
        themeColors.cyan,
      );
      constructionText(ctx, api, 'margin m', 810, 935, 28, themeColors.muted, 'center');
      caption(
        ctx,
        api,
        currentBeat === 1
          ? 'An overshoot is actually moved back toward the target on the same quadratic.'
          : 'The target is not a hard clamp on a neural-network margin.',
      );
    } else {
      heading(ctx, api, 'A concentrated two-answer policy can have bounded forward KL');
      table(
        ctx,
        api,
        ['margin m', 'IPO (m−5)²', 'DPO −ln σ(m)', 'KL to uniform'],
        [0, 5, 10].map((m) => {
          const p = sigmoid(m),
            kl = p * Math.log(2 * p) + (1 - p) * Math.log(2 * (1 - p));
          return [m, ((m - 5) ** 2).toFixed(0), prefLoss(m).toFixed(6), kl.toFixed(6)];
        }),
        170,
        440,
        1580,
        140,
      );
      constructionText(
        ctx,
        api,
        'As m → ∞, P(A) → 1 and KL → ln 2 ≈ 0.693147',
        170,
        955,
        34,
        themeColors.yellow,
      );
      caption(
        ctx,
        api,
        'Complete two-response universe; this forward-KL bound does not prevent mode concentration.',
      );
    }
    return;
  };
  focusTarget(ctx, api, 'ipo-target-construction', construction);
}
export default {
  id: 'ipo-target',
  draw: drawIpoTarget,
  cues: ['ipo-target-b0', 'ipo-target-b1', 'pa-ipo-return', 'ipo-target-b2', 'pa-ipo-kl'],
};
