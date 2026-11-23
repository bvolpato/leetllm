import { rectangle, requestGraph, text } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const step = (i, a = 0.1, z = 0.72) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    requestGraph(ctx, api, step(0), false);
    text(
      ctx,
      api,
      'P-7: evidence or human review is required',
      960,
      1035,
      38,
      themeColors.yellow,
      'center',
    );
    rectangle(ctx, api, 140, 875, 580, 105, themeColors.blue);
    text(ctx, api, 'evidence: absent → verified', 430, 940, 34, themeColors.green, 'center');
    rectangle(ctx, api, 1120, 875, 580, 105, themeColors.cyan);
    text(ctx, api, 'review: cost −18 → verified', 1410, 940, 34, themeColors.cyan, 'center');
  };
  if (api.focus) api.focus.target('intro-construction', body);
  else body();
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-voice-1', 'intro-voice-2', 'intro-voice-3'],
};
