import { prefBound } from '../arithmetic.mjs';
import {
  caption,
  cell,
  constructionEquation,
  constructionText,
  focusTarget,
  heading,
} from '../defaults.mjs';
export function drawRewardCancellation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue reward-cancellation/' + id);
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
    heading(ctx, api, 'The same prompt gives both responses the same log-partition constant');
    const cancel = currentBeat > 0 ? cueProgress('pa-reward-cancel', 1) : 0;
    for (let i = 0; i < 2; i++) {
      const y = 440 + i * 200,
        col = i === 0 ? themeColors.green : themeColors.pink;
      constructionText(ctx, api, i === 0 ? 'r(A)' : 'r(B)', 190, y + 45, 39, col);
      constructionEquation(
        ctx,
        api,
        i === 0
          ? String.raw`\beta\ln{\pi^*(A|x)\over\pi_{\rm ref}(A|x)}`
          : String.raw`\beta\ln{\pi^*(B|x)\over\pi_{\rm ref}(B|x)}`,
        800,
        y + 45,
        38,
        col,
      );
      focusTarget(ctx, api, 'pa-common-constant', () => {
        api.components.fade(Math.max(0, 1 - 2 * cancel), () =>
          cell(ctx, api, '+ β ln Z(x)', 1270, y, 430, 95, themeColors.yellow, 34),
        );
      });
    }
    if (cancel > 0.5)
      api.components.fade(2 * cancel - 1, () =>
        constructionEquation(
          ctx,
          api,
          String.raw`\beta\ln Z(x)-\beta\ln Z(x)=0`,
          1485,
          590,
          31,
          themeColors.yellow,
        ),
      );
    if (cancel === 1)
      constructionEquation(
        ctx,
        api,
        String.raw`r(A)-r(B)=\beta\left[\ln{\pi^*(A|x)\over\pi_{\rm ref}(A|x)}-\ln{\pi^*(B|x)\over\pi_{\rm ref}(B|x)}\right]`,
        960,
        850,
        35,
        themeColors.cyan,
      );
    if (currentBeat === 2)
      constructionEquation(
        ctx,
        api,
        String.raw`L_{\rm DPO}=-\ln\sigma\!\left(\beta[\Delta_A-\Delta_B]\right)`,
        960,
        940,
        40,
        themeColors.green,
      );
    caption(
      ctx,
      api,
      'Cancellation requires the same prompt; finite DPO and clipped PPO need not reach the same checkpoint.',
    );
    return;
  };
  focusTarget(ctx, api, 'reward-cancellation-construction', construction);
}
export default {
  id: 'reward-cancellation',
  draw: drawRewardCancellation,
  cues: [
    'reward-cancellation-b0',
    'reward-cancellation-b1',
    'pa-reward-cancel',
    'reward-cancellation-b2',
  ],
};
