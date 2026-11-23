import { card, equation } from '../defaults.mjs';
export function drawBatchDeadline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.9) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    api.focus.target('live-request', () =>
      card(
        ctx,
        api,
        'live customer · immediate response',
        190,
        390,
        themeColors.cyan,
        620,
        90,
        state.cues ? 1 : phaseForBeat(0),
      ),
    );
    api.focus.target('evaluation-task', () =>
      card(
        ctx,
        api,
        'nightly evaluation · 48 h deadline',
        1110,
        390,
        themeColors.yellow,
        620,
        90,
        phaseForBeat(1),
      ),
    );
    api.focus.target('live-request', () => api.line(ctx, 250, 610, 930, 610, themeColors.cyan, 7));
    api.focus.target('live-request', () =>
      api.circle(ctx, api.lerp(280, 910, phaseForBeat(0)), 610, 14, themeColors.cyan),
    );
    api.focus.target('evaluation-task', () =>
      api.line(ctx, 1010, 755, 1650, 755, themeColors.yellow, 7),
    );
    const time = api.lerp(0, 24, phaseForBeat(1));
    api.focus.target('evaluation-task', () =>
      api.circle(ctx, 1010 + (time / 48) * 640, 755, 14, themeColors.yellow),
    );
    api.focus.target('batch-window', () =>
      card(
        ctx,
        api,
        'Batch window · 24 h',
        660,
        810,
        themeColors.green,
        600,
        60,
        state.cues?.['batch-window'] ? Number(api.focus.visible('batch-window')) : phaseForBeat(2),
      ),
    );
    if (!state.cues || api.focus.visible('batch-window'))
      api.focus.target('batch-price', () =>
        equation(ctx, api, String.raw`C_{\mathrm{batch}}=2.82`, 960, 930, 40, themeColors.ink),
      );
  }
}
export default {
  id: 'batch-deadline',
  draw: drawBatchDeadline,
  cues: ['interactive-work', 'batch-window', 'deadline-fit'],
};
