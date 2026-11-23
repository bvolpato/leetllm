import { backupHeading, equation, rectangle, requestGraph, text } from '../defaults.mjs';
export function drawValueIteration(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const step = (i, a = 0.1, z = 0.72) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    const iter = true,
      q = step(1),
      nodes = requestGraph(ctx, api, q, currentBeat === 0 ? 'initial' : true);
    const v =
      currentBeat === 0
        ? {
            e: 0,
            r: 0,
          }
        : {
            e: 70,
            r: 80,
          };
    backupHeading(
      ctx,
      api,
      `Synchronous sweep ${currentBeat === 0 ? 1 : currentBeat === 1 ? 2 : 3}`,
      nodes.evidence,
    );
    text(ctx, api, `V = ${v.e}`, 1240, 320, 31, themeColors.green, 'center');
    text(ctx, api, `V = ${v.r}`, 960, 895, 31, themeColors.cyan, 'center');
    rectangle(ctx, api, 115, 705, 400, 120, themeColors.yellow);
    text(
      ctx,
      api,
      currentBeat === 0 || q >= 1 ? 'Q(new, evidence)' : 'Partial evidence backup',
      315,
      750,
      29,
      themeColors.ink,
      'center',
    );
    text(ctx, api, `${(-4 + 0.9 * v.e * q).toFixed(1)}`, 315, 805, 43, themeColors.green, 'center');
    equation(
      ctx,
      api,
      currentBeat === 0
        ? String.raw`-4+0.9\cdot0=-4\qquad-18+0.9\cdot0=-18`
        : (q < 1 ? String.raw`\text{Target: }` : String.raw``) +
            String.raw`-4+0.9\cdot70=59\qquad-18+0.9\cdot80=54`,
      960,
      1010,
      q < 1 ? 39 : 43,
      themeColors.yellow,
    );
  };
  if (api.focus) api.focus.target('value-iteration-construction', body);
  else body();
}
export default {
  id: 'value-iteration',
  draw: drawValueIteration,
  cues: [
    'value-iteration-voice-1',
    'value-iteration-voice-2',
    'value-iteration-voice-3',
    'value-iteration-voice-4',
  ],
};
