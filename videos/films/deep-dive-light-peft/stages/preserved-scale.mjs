import { beatCue, rankFixture } from '../model.mjs';

const alpha = 16;
const pair = rankFixture();
const oldScale = alpha / pair.activation.length;
const newScale = alpha / pair.kept.length;

export function drawPreservedScale(ctx, scene, state, api) {
  const { C } = api;
  const baseline = beatCue(state, 0, 'lp-scale-output', 0.42, 0.76);
  const reload = beatCue(state, 1, 'lp-new-scale', 0.07, 0.48);
  const compared = beatCue(state, 1, 'lp-double-output', 0.53, 0.77);
  const restore = beatCue(state, 2, 'lp-scale-restore', 0.05, 0.45);
  const beat = state.beat ?? 0;
  const scale = api.lerp(1, oldScale, baseline) + (newScale - oldScale) * reload * (1 - restore);
  const x = (value) => 445 + value * 2.95;
  api.focus.target('lp-scale', () => {
    api.text(ctx, 'Pair r2, r4   ·   [' + pair.output.join(', ') + ']', 135, 269, 39, C.cyan);
    const label =
      beat === 0
        ? 'Saved scale   16 / 4 = ' + oldScale
        : restore === 1
          ? 'Reloaded scale   16 / 4 = ' + oldScale
          : 'Reload from rank 2    16 / 2 = ' + (reload === 1 ? newScale : '?');
    api.text(ctx, label, 1760, 269, 39, C.yellow, 'right');
  });

  api.focus.target('lp-scale-output', () => {
    pair.output.forEach((v, i) => {
      const y = 485 + i * 250;
      const ref = v * oldScale,
        current = v * scale;
      api.text(ctx, 'Output ' + (i + 1), 130, y + 14, 46, C.ink);
      api.line(ctx, x(0), y, x(450), y, C.muted, 3);
      [0, 100, 200, 300, 400].forEach((tick) => {
        api.line(ctx, x(tick), y + 3, x(tick), y + 14, C.muted, 2);
        api.text(ctx, String(tick), x(tick), y + 55, 27, C.muted, 'center');
      });
      if (baseline === 1) {
        api.line(ctx, x(ref), y - 54, x(ref), y - 15, C.blue, 6);
        api.text(ctx, 'Saved ' + ref, x(ref), y - 76, 33, C.blue, 'center');
      }
      api.circle(ctx, x(current), y, 11, compared === 1 && restore === 0 ? C.pink : C.yellow);
      const atRest = [1, oldScale, newScale].includes(scale);
      if (atRest) api.text(ctx, String(current), x(current), y + 106, 41, C.yellow, 'center');
    });
  });

  const question =
    beat === 0
      ? baseline === 1
        ? 'If the loader divides by the two surviving ranks, where will the dots land?'
        : 'Each ruler tracks one component of the adapter update.'
      : restore === 1
        ? 'Export the original scale with the selected IDs and tensor shapes.'
        : 'Same rows. Same columns. Compare each dot with the saved update.';
  api.text(ctx, question, 960, 977, 36, C.ink, 'center');
}
export default {
  id: 'preserved-scale',
  draw: drawPreservedScale,
  cues: ['lp-old-scale', 'lp-scale-output', 'lp-new-scale', 'lp-double-output', 'lp-scale-restore'],
};
