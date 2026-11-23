import { line, moveValue, text } from '../defaults.mjs';
export function drawRewardDesign(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const step = (i, a = 0.1, z = 0.72) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    const fresh = currentBeat === 3,
      cue = (id, fallback) => api.focus.progress(id, fallback),
      returned = fresh && cue('reward-fresh-return', step(3, 0.15, 0.22)) >= 1,
      proposal = fresh ? cue('reward-fresh-proposal', step(3, 0.4, 0.6)) : step(0),
      rejected = fresh ? cue('reward-fresh-rejection', step(3, 0.65, 0.75)) >= 1 : step(1) > 0.6,
      executed = fresh ? cue('reward-fresh-execution', step(3, 0.75, 0.85)) >= 1 : step(1) > 0.8;
    api.focus.target('reward-fresh-return', () =>
      text(
        ctx,
        api,
        fresh
          ? returned
            ? 'p =0.10 → evidence47.7 < review54'
            : 'New case: abandonment p =0.10 · predict the return'
          : 'Change the reward; keep policy P-7 fixed',
        960,
        280,
        37,
        themeColors.yellow,
        'center',
      ),
    );
    const speedIds = ['reward-speed-approval', 'reward-speed-evidence', 'reward-speed-review'],
      speedValues = [100, 45, 15],
      base = [-120, returned ? 47.7 : '?', 54],
      names = ['unsupported approval', 'evidence', 'human review'];
    api.focus.target('reward-speed-values', () =>
      names.forEach((name, i) => {
        const x = 350 + i * 600;
        text(ctx, api, name, x, 425, 31, i ? themeColors.cyan : themeColors.pink, 'center');
        const known = fresh && cue(speedIds[i], step(3, 0.25 + i * 0.05, 0.3 + i * 0.05)) >= 1;
        text(
          ctx,
          api,
          fresh
            ? String(known ? speedValues[i] : base[i])
            : ['quick-closure incentive', 'evidence cost', 'review delay'][i],
          x,
          550,
          fresh ? 72 : 35,
          i ? themeColors.cyan : themeColors.pink,
          'center',
        );
      }),
    );
    api.focus.target('reward-fresh-proposal', () => {
      if (proposal > 0)
        moveValue(ctx, api, 'approve', [380, 710], [1290, 710], proposal, themeColors.pink, 28);
    });
    line(ctx, api, 1385, 630, 1385, 790, themeColors.red, 13);
    text(ctx, api, 'P-7 gate', 1450, 625, 33, themeColors.yellow);
    api.focus.target('reward-fresh-rejection', () =>
      text(
        ctx,
        api,
        rejected
          ? 'REJECTED: evidence absent'
          : proposal >= 1
            ? 'proposal reached trusted gate'
            : proposal > 0
              ? 'proposal in flight toward trusted gate'
              : 'Predict which action the reward proposes',
        960,
        880,
        41,
        rejected ? themeColors.pink : themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('reward-fresh-execution', () => {
      if (executed)
        text(ctx, api, 'Executed action → human review', 960, 990, 37, themeColors.green, 'center');
      else if (fresh)
        text(ctx, api, 'Executed action pending', 960, 990, 32, themeColors.muted, 'center');
    });
  };
  if (api.focus) api.focus.target('reward-design-construction', body);
  else body();
}
export default {
  id: 'reward-design',
  draw: drawRewardDesign,
  cues: [
    'reward-design-voice-1',
    'reward-design-voice-2',
    'reward-design-voice-3',
    'reward-design-voice-4',
    'reward-fresh-return',
    'reward-speed-approval',
    'reward-speed-evidence',
    'reward-speed-review',
    'reward-fresh-proposal',
    'reward-fresh-rejection',
    'reward-fresh-execution',
  ],
};
