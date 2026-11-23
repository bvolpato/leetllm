import { equation, line, ownedState, rectangle, text } from '../defaults.mjs';
export function drawLlmPolicy(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const body = () => {
    if (currentBeat === 0) {
      text(
        ctx,
        api,
        'Prompt + generated prefix = state',
        960,
        285,
        40,
        themeColors.yellow,
        'center',
      );
      ['Please', 'review', 'this', 'request', 'EOS'].forEach((token, i) => {
        const x = 210 + i * 330;
        rectangle(
          ctx,
          api,
          x,
          490,
          280,
          125,
          i === Math.min(4, Math.floor(progress * 5)) ? themeColors.yellow : themeColors.blue,
        );
        text(
          ctx,
          api,
          token,
          x + 140,
          565,
          42,
          i === 4 ? themeColors.pink : themeColors.blue,
          'center',
        );
        if (i < 4) line(ctx, api, x + 285, 552, x + 325, 552, themeColors.muted, 3);
      });
      text(
        ctx,
        api,
        'An external tool introduces another observation boundary',
        960,
        870,
        35,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      const roles = [
        ['actor', 'generates completions', themeColors.blue],
        ['critic', 'prefix value', themeColors.green],
        ['reference', 'divergence control', themeColors.pink],
        ['reward', 'scores completion', themeColors.yellow],
      ];
      roles.forEach(([role, job, color], i) => {
        const x = 310 + i * 440;
        ownedState(ctx, api, role, x, 495, color, job);
      });
      text(
        ctx,
        api,
        'Old sampling policy controls PPO ratios; frozen reference controls KL',
        960,
        870,
        35,
        themeColors.yellow,
        'center',
      );
    } else {
      const rewards = currentBeat === 3 ? [1, 1, 1] : [0, 1, 2],
        mean = rewards.reduce((a, v) => a + v) / 3,
        sd = Math.sqrt(rewards.reduce((a, v) => a + (v - mean) ** 2, 0) / 3),
        scores = rewards.map((r) => (r - mean) / (sd + 1e-8));
      text(
        ctx,
        api,
        'One prompt · three sampled completions',
        960,
        280,
        39,
        themeColors.yellow,
        'center',
      );
      scores.forEach((score, i) => {
        const x = 410 + i * 550;
        rectangle(
          ctx,
          api,
          x - 190,
          395,
          380,
          150,
          [themeColors.pink, themeColors.blue, themeColors.green][i],
        );
        text(ctx, api, `completion ${i + 1}`, x, 450, 31, themeColors.muted, 'center');
        text(ctx, api, `reward ${rewards[i]}`, x, 510, 40, themeColors.ink, 'center');
        line(ctx, api, x, 570, x, 680, themeColors.muted, 4);
        text(
          ctx,
          api,
          score.toFixed(3),
          x,
          765,
          67,
          score < 0 ? themeColors.pink : themeColors.green,
          'center',
        );
      });
      equation(
        ctx,
        api,
        String.raw`A_i=\frac{r_i-\bar r}{\operatorname{std}(r)+\epsilon}`,
        960,
        950,
        51,
        themeColors.yellow,
      );
      text(
        ctx,
        api,
        currentBeat === 3
          ? 'Equal rewards: reward component 0; KL may still update'
          : 'An empirical group statistic, not exact Q − V',
        960,
        1030,
        32,
        themeColors.muted,
        'center',
      );
    }
  };
  if (api.focus) api.focus.target('llm-policy-construction', body);
  else body();
}
export default {
  id: 'llm-policy',
  draw: drawLlmPolicy,
  cues: ['llm-policy-voice-1', 'llm-policy-voice-2', 'llm-policy-voice-3', 'llm-policy-voice-4'],
};
