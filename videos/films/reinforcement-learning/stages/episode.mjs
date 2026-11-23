import { gamma } from '../fixtures.mjs';
import { episodeLink, equation, moveValue, ownedState, text } from '../defaults.mjs';
export function drawEpisode(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const step = (i, a = 0.1, z = 0.72) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    text(
      ctx,
      api,
      'Same request · alternative complete trajectories',
      960,
      275,
      36,
      themeColors.muted,
      'center',
    );
    const routes = [
      {
        name: 'unsupported approval',
        now: -120,
        later: 0,
        color: themeColors.red,
      },
      {
        name: 'request evidence',
        now: -4,
        later: 70,
        color: themeColors.green,
      },
      {
        name: 'human review',
        now: -18,
        later: 80,
        color: themeColors.cyan,
      },
    ];
    routes.forEach((r, i) => {
      const y = 400 + i * 185,
        q = step(1),
        future = r.later * gamma;
      const route = i === 1 ? 'evidence' : 'review';
      const complete = (suffix, fallback) =>
        api.focus.progress(`episode-${route}-${suffix}`, fallback) >= 1;
      const discountedReady =
        !r.later ||
        complete(
          'discount',
          currentBeat > 1
            ? 1
            : currentBeat === 1
              ? api.phase(progress, i === 1 ? 0.25 : 0.55, i === 1 ? 0.4 : 0.7)
              : 0,
        );
      const returnReady =
        !r.later ||
        complete(
          'return',
          currentBeat > 1
            ? 1
            : currentBeat === 1
              ? api.phase(progress, i === 1 ? 0.4 : 0.7, i === 1 ? 0.5 : 0.82)
              : 0,
        );
      text(ctx, api, r.name, 145, y + 12, 31, r.color);
      episodeLink(ctx, api, y, r.color);
      ownedState(ctx, api, String(r.now), 610, y, r.color);
      ownedState(ctx, api, r.later ? String(r.later) : 'closed', 1270, y, r.color);
      if (r.later) {
        if (q > 0.01)
          moveValue(
            ctx,
            api,
            discountedReady ? String(future) : 'apply γ',
            [1120, y],
            [865, y],
            q,
            r.color,
            discountedReady ? 34 : 22,
          );
        if (currentBeat >= 1)
          text(ctx, api, 'γ = 0.9', 960, y + 94, 28, themeColors.muted, 'center');
      }
      text(
        ctx,
        api,
        returnReady ? String(r.now + future) : '…',
        1600,
        y + 17,
        58,
        r.color,
        'center',
      );
    });
    if (currentBeat >= 2)
      equation(ctx, api, String.raw`G_t=R_{t+1}+\gamma G_{t+1}`, 960, 1040, 42, themeColors.yellow);
  };
  if (api.focus) api.focus.target('episode-construction', body);
  else body();
}
export default {
  id: 'episode',
  draw: drawEpisode,
  cues: [
    'episode-voice-1',
    'episode-voice-2',
    'episode-evidence-discount',
    'episode-evidence-return',
    'episode-review-discount',
    'episode-review-return',
    'episode-voice-3',
    'episode-voice-4',
  ],
};
