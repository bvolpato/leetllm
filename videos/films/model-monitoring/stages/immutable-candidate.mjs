import { chip, cueProgress, cueVisible, footer, line, panel, text } from '../defaults.mjs';
function drawMonitoring(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const smooth = (q) => q * q * (3 - 2 * q);
  const lerp = (a, z, q) => a + (z - a) * q;
  {
    const fields = [
      'model v4',
      'labels through Feb 3',
      'training pipeline v4',
      'features-v3',
      'decision τ .50',
      'evaluation policy v1',
      'previous model v3',
    ];
    fields.forEach((v, i) => {
      const y = 300 + i * 65;
      chip(ctx, api, v, 175, y, 510, i === 6 ? themeColors.blue : themeColors.cyan, 52, 26);
      line(ctx, api, 685, y + 26, 900, 520, themeColors.muted, 1);
    });
    panel(ctx, api, 920, 350, 700, 320, themeColors.blue);
    text(ctx, api, 'canonical compact sorted JSON', 1270, 410, 30, themeColors.blue);
    if (cueVisible(ctx, api, 'immutable-candidate', 'digest') || currentBeat > 0)
      text(ctx, api, 'display …edde9c2176', 1270, 480, 38, themeColors.blue);
    if (currentBeat > 0) {
      chip(
        ctx,
        api,
        cueVisible(ctx, api, 'immutable-candidate', 'change')
          ? 'latest → new bytes B'
          : 'latest → model bytes A',
        1020,
        555,
        510,
        cueVisible(ctx, api, 'immutable-candidate', 'change')
          ? themeColors.yellow
          : themeColors.cyan,
        66,
        29,
      );
      text(
        ctx,
        api,
        'same manifest digest',
        1270,
        currentBeat === 2 ? 705 : 720,
        29,
        themeColors.muted,
      );
      text(
        ctx,
        api,
        'content digests + immutable references',
        1270,
        currentBeat === 2 ? 750 : 790,
        30,
        themeColors.cyan,
      );
    }
    if (currentBeat === 2) {
      const q = cueProgress(ctx, api, 'immutable-candidate', 'alias');
      chip(ctx, api, 'production alias', 730, 845, 450, themeColors.green);
      line(ctx, api, 955, 845, lerp(510, 1280, smooth(q)), 810, themeColors.green, 4);
      text(ctx, api, 'bundle v3', 510, 795, 30, themeColors.blue);
      text(ctx, api, 'bundle v4', 1280, 795, 30, themeColors.cyan);
    }
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'Changing the alias requires compatibility and an exact saved previous artifact.'
        : 'A manifest digest identifies its bytes; it cannot freeze a mutable referenced file.',
    );
  }
}
export function drawImmutableCandidate(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target('immutable-candidate-mechanism', () =>
        drawMonitoring(ctx, scene, state, api),
      )
    : drawMonitoring(ctx, scene, state, api);
}
export default {
  id: 'immutable-candidate',
  draw: drawImmutableCandidate,
  cues: [
    'immutable-candidate-beat-0',
    'm-immutable-candidate-digest',
    'immutable-candidate-beat-1',
    'm-immutable-candidate-change',
    'immutable-candidate-beat-2',
    'm-immutable-candidate-alias',
    'm-immutable-candidate-compatibility',
  ],
};
