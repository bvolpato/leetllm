import { centerText, cueProgress, line, note, rectangle, tag } from '../defaults.mjs';
export function drawFallbackEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    done = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('fallback-evidence-mechanism', () => {
    const switchProvider = cueProgress(ctx, api, 'fallback-switch');
    tag(
      ctx,
      api,
      switchProvider ? 'approved backup' : 'primary route',
      400,
      380,
      switchProvider ? themeColors.pink : themeColors.blue,
      600,
    );
    tag(ctx, api, 'same unresolved operation key', 1350, 380, themeColors.yellow, 820);
    line(ctx, api, 750, 380, 900, 380, themeColors.yellow, 3);
    if (currentBeat === 0) {
      ['processor +data', 'roles +tools +schema', 'context +refusal +incomplete'].forEach(
        (s, i) => {
          const y = 540 + i * 130,
            ready = cueProgress(
              ctx,
              api,
              ['fallback-processor', 'fallback-format', 'fallback-refusal'][i],
            );
          tag(ctx, api, s, 960, y, ready ? themeColors.blue : themeColors.muted, 900);
          rectangle(ctx, api, 520, y + 48, 880 * ready, 8, themeColors.blue);
        },
      );
      if (done('fallback-switch'))
        centerText(
          ctx,
          api,
          'shared remaining deadline, spend and cancellation',
          960,
          940,
          34,
          themeColors.yellow,
        );
    } else {
      tag(ctx, api, 'job-1 · queued · observed 40min ago', 960, 540, themeColors.blue, 1150);
      centerText(ctx, api, 'dated prior observation', 960, 670, 34, themeColors.blue);
      if (done('stale-evidence'))
        centerText(ctx, api, 'current-status evidence unavailable', 960, 805, 41, themeColors.pink);
      if (currentBeat === 2)
        centerText(
          ctx,
          api,
          'Allowlisted handoff: identity, payload, last receipt, unknown state, stop reason',
          960,
          930,
          29,
          themeColors.yellow,
        );
      note(
        ctx,
        api,
        'A provider switch and a generated live-evidence flag cannot refresh a source observation',
      );
    }
  });
}
export default {
  id: 'fallback-evidence',
  draw: drawFallbackEvidence,
  cues: [
    'fallback-switch',
    'fallback-processor',
    'fallback-format',
    'fallback-refusal',
    'stale-evidence',
  ],
};
