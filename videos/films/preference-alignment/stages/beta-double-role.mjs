import { prefBound, sigmoid } from '../arithmetic.mjs';
import { twoLogitState } from '../model.mjs';
import {
  caption,
  cell,
  constructionEquation,
  constructionText,
  focusTarget,
  heading,
  signedValue,
  table,
} from '../defaults.mjs';
export function drawBetaDoubleRole(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue beta-double-role/' + id);
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
  const resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construction = () => {
    if (currentBeat === 1) {
      const q = cueProgress('beta-double-role-b1', 1),
        initial = twoLogitState([0, 0]),
        v = twoLogitState([0.1 * q, -0.1 * q]);
      heading(ctx, api, 'Replay the earlier two-logit route update · β = .5 · η = .4');
      for (let i = 0; i < 2; i++) {
        const x = 470 + i * 900,
          color = i === 0 ? themeColors.green : themeColors.pink;
        cell(ctx, api, i === 0 ? 'chosen' : 'rejected', x - 220, 405, 440, 85, color, 35);
        constructionText(
          ctx,
          api,
          'initial derivative ' + initial.gradient[i].toFixed(2),
          x,
          590,
          33,
          themeColors.yellow,
          'center',
        );
        api.arrow(ctx, x, 700, x, 700 + initial.gradient[i] * 360, themeColors.yellow, 5);
        constructionText(ctx, api, 'logit ' + v.logits[i].toFixed(3), x, 865, 35, color, 'center');
      }
      constructionText(
        ctx,
        api,
        'Comparison σ(βm) = ' + v.preferenceProbability.toFixed(3),
        170,
        965,
        29,
        themeColors.cyan,
      );
      constructionText(
        ctx,
        api,
        'Policy softmax P(chosen) = ' + v.probabilities[0].toFixed(3),
        1020,
        965,
        29,
        themeColors.green,
      );
      caption(ctx, api, 'One gradient step moves the chosen logit up and the rejected logit down.');
      return;
    }
    if (currentBeat < 2) {
      heading(ctx, api, 'Initialization at m = 0 · same ln 2 loss, different derivative scale');
      constructionEquation(
        ctx,
        api,
        String.raw`z=\beta m\qquad {\partial L\over\partial m}=\beta[\sigma(z)-1]`,
        960,
        405,
        45,
        themeColors.cyan,
      );
      for (const [i, beta] of [0.1, 0.5, 1].entries()) {
        const y = 560 + i * 125;
        constructionText(ctx, api, 'β = ' + beta, 190, y, 35, themeColors.blue);
        constructionText(ctx, api, 'L = ' + Math.log(2).toFixed(3), 570, y, 33, themeColors.muted);
        focusTarget(ctx, api, 'pa-beta-gradient', () => {
          if (currentBeat > 0 || resultComplete('pa-beta-initial', 0))
            signedValue(ctx, api, -beta / 2, 1290, y - 10, 550);
          else constructionText(ctx, api, 'gradient: ?', 1300, y, 31, themeColors.muted);
        });
      }
      caption(
        ctx,
        api,
        'The scalar loss can be equal at initialization while its coordinate gradients are nonzero.',
      );
    } else {
      heading(ctx, api, 'Complete two-answer population · true A preference = 0.75');
      const values = [0.1, 0.5, 1],
        rows = values.map((beta) => [
          beta.toFixed(1),
          Math.log(3).toFixed(3),
          (Math.log(3) / beta).toFixed(3),
          sigmoid(Math.log(3) / beta).toFixed(6),
        ]);
      table(
        ctx,
        api,
        ['β', 'fitted βm = ln 3', 'ideal margin m', 'ideal policy P(A)'],
        rows,
        170,
        440,
        1580,
        140,
      );
      constructionEquation(
        ctx,
        api,
        String.raw`p(A)=\sigma\!\left({\ln3\over\beta}\right)`,
        960,
        345,
        40,
        themeColors.yellow,
      );
      constructionText(
        ctx,
        api,
        'Larger β: larger initial gradient, less concentrated ideal policy',
        170,
        950,
        32,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        'Ideal population targets; actual drift also depends on optimizer, update count and data coverage.',
      );
    }
    return;
  };
  focusTarget(ctx, api, 'beta-double-role-construction', construction);
}
export default {
  id: 'beta-double-role',
  draw: drawBetaDoubleRole,
  cues: [
    'beta-double-role-b0',
    'pa-beta-initial',
    'beta-double-role-b1',
    'beta-double-role-b2',
    'pa-beta-target',
    'beta-double-role-b3',
  ],
};
