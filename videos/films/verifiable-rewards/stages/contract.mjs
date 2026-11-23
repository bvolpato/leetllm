import { card } from '../defaults.mjs';
export function drawContract(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.94);
  {
    const syntax = api.focus.target('answer-parser', () =>
        card(ctx, api, 'Parse answer', 210, 450, 360, themeColors.blue),
      ),
      run = api.focus.target('verifier', () =>
        card(ctx, api, 'Run check', 780, 450, 360, themeColors.cyan),
      ),
      reward = api.focus.target('outcome-reward', () =>
        card(ctx, api, 'Reward 0 or 1', 1350, 450, 360, themeColors.green),
      );
    api.connect(ctx, api.groupBounds(syntax), api.groupBounds(run), {
      color: themeColors.cyan,
      gap: 10,
    });
    api.connect(ctx, api.groupBounds(run), api.groupBounds(reward), {
      color: themeColors.green,
      gap: 10,
    });
    components.fade(phaseForBeat(1), () => {
      const fail = api.focus.target('candidate-failure', () =>
        card(ctx, api, 'Wrong candidate → 0', 300, 690, 560, themeColors.pink),
      );
      const infra = api.focus.target('infrastructure-fault', () =>
        card(ctx, api, 'Checker crash → quarantine', 1060, 690, 620, themeColors.yellow),
      );
      api.connect(ctx, api.groupBounds(run), api.groupBounds(fail), {
        color: themeColors.pink,
        gap: 10,
      });
      api.connect(ctx, api.groupBounds(run), api.groupBounds(infra), {
        color: themeColors.yellow,
        gap: 10,
      });
    });
  }
}
export default {
  id: 'contract',
  draw: drawContract,
  cues: ['contract-b1-1', 'contract-b1-2', 'contract-b2-1', 'contract-b3-1', 'contract-b3-2'],
};
