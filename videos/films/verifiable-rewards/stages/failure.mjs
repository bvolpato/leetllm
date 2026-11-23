import { card, equation } from '../defaults.mjs';
export function drawFailure(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.94);
  {
    api.focus.target('format-score', () =>
      card(ctx, api, 'Correct format', 350, 430, 480, themeColors.cyan),
    );
    api.focus.target('answer-score', () =>
      card(ctx, api, 'Correct answer', 1090, 430, 480, themeColors.green),
    );
    components.fade(
      Math.max(phaseForBeat(1), Number(api.focus.progress('failure-b2-1', 0) > 0)),
      () => {
        api.focus.target('combined-reward', () =>
          equation(
            ctx,
            api,
            String.raw`r=\alpha r_{\mathrm{answer}}+\gamma r_{\mathrm{format}}`,
            960,
            625,
            45,
            themeColors.yellow,
          ),
        );
        card(ctx, api, 'Format passes, answer fails', 590, 735, 740, themeColors.pink);
      },
    );
  }
}
export default {
  id: 'failure',
  draw: drawFailure,
  cues: ['failure-b1-1', 'failure-b1-2', 'failure-b2-1', 'failure-b3-1'],
};
