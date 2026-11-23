import { beatCue, built, clamped, cueAmount } from '../arithmetic.mjs';
import { freeBitsState } from '../model.mjs';
import { bar, chapterText, line, note, point } from '../defaults.mjs';

function drawFloor(ctx, state, api) {
  const { C } = api;
  const mean = 0.2 + 0.6 * beatCue(state, 0, 'below-floor', 0.59, 0.82);
  const score = freeBitsState([mean]);
  const x = (n) => 340 + 435 * n;
  const y = (n) => 780 - 215 * n;
  line(ctx, api, x(0), y(0), x(2), y(0), C.muted, 2);
  line(ctx, api, x(0), y(0), x(0), y(2), C.muted, 2);
  for (const n of [0, 1, 2]) {
    chapterText(ctx, api, String(n), x(n), y(0) + 52, 32, C.ink, 'center');
    chapterText(ctx, api, String(n), x(0) - 40, y(n) + 11, 32, C.ink, 'right');
  }
  chapterText(ctx, api, 'KL charge (nats)', x(0), y(2) - 58, 36, C.ink);
  chapterText(ctx, api, 'Group average (nats)', x(1), y(0) + 132, 36, C.ink, 'center');
  line(ctx, api, x(0), y(1), x(1), y(1), C.green, 6);
  line(ctx, api, x(1), y(1), x(2), y(2), C.green, 6);
  line(ctx, api, x(mean), y(0), x(mean), y(score.groupCharge), C.yellow, 3);
  point(ctx, api, x(mean), y(score.groupCharge), C.yellow, 14);
  chapterText(ctx, api, 'Group average', 1520, 453, 33, C.ink, 'center');
  chapterText(ctx, api, mean.toFixed(2), 1520, 529, 52, C.yellow, 'center');
  chapterText(ctx, api, 'KL charge', 1520, 648, 33, C.ink, 'center');
  chapterText(ctx, api, score.groupCharge.toFixed(2), 1520, 724, 52, C.green, 'center');
}

export function drawFreeBits(ctx, scene, state, api) {
  if (state.beat === 0) return drawFloor(ctx, state, api);
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamped(state.beatP ?? 0),
    q = cueAmount(state, 'vae-free-bits-' + currentBeat + '-build', progress),
    ready = (id) => built(state, 'vae-free-bits-' + id);
  {
    chapterText(
      ctx,
      api,
      'One group, two examples, a floor of 1 nat',
      960,
      300,
      35,
      themeColors.ink,
      'center',
    );
    const base = 780,
      k = 160;
    [
      [0.2, 'example A'],
      [2.2, 'example B'],
    ].forEach(([v, label], i) => {
      const x = 330 + i * 350;
      bar(ctx, api, x, base - v * k, 140, v * k, themeColors.cyan);
      chapterText(ctx, api, label, x + 70, 850, 30, themeColors.ink, 'center');
      chapterText(ctx, api, String(v), x + 70, base - v * k - 25, 34, themeColors.cyan, 'center');
    });
    line(ctx, api, 270, base - k, 1690, base - k, themeColors.yellow, 3);
    chapterText(ctx, api, 'floor 1', 1700, base - k - 28, 28, themeColors.yellow, 'right');
    if (currentBeat === 2) {
      bar(ctx, api, 1110, base - 1.2 * k, 145, 1.2 * k, themeColors.green);
      bar(ctx, api, 1460, base - 1.6 * k, 145, 1.6 * k, themeColors.pink);
      chapterText(ctx, api, 'group first: 1.2', 1180, 420, 30, themeColors.green, 'center');
      chapterText(ctx, api, 'example first: 1.6', 1530, 420, 30, themeColors.pink, 'center');
      chapterText(ctx, api, 'grad [0.5, 0.5]', 1180, 885, 27, themeColors.green, 'center');
      chapterText(ctx, api, 'grad [0, 0.5]', 1530, 885, 27, themeColors.pink, 'center');
      chapterText(ctx, api, 'intended objective', 1180, 835, 27, themeColors.green, 'center');
      chapterText(ctx, api, 'different objective', 1530, 835, 27, themeColors.pink, 'center');
    } else if (!ready('each')) {
      const v = 1.2 * clamped(q * 1.8);
      bar(ctx, api, 1130, base - v * k, 160, v * k, themeColors.green);
      chapterText(ctx, api, 'mean, then floor', 1210, 850, 31, themeColors.green, 'center');
      chapterText(
        ctx,
        api,
        currentBeat === 1 && ready('group')
          ? 'charge 1.2 · gradients [0.5, 0.5]'
          : 'average → max(1, average)',
        1290,
        420,
        32,
        themeColors.ink,
        'center',
      );
    } else {
      bar(ctx, api, 1130, base - 1 * k, 150, 1 * k, themeColors.pink);
      bar(ctx, api, 1430, base - 2.2 * k, 150, 2.2 * k, themeColors.pink);
      chapterText(ctx, api, 'floor each, then mean', 1360, 850, 31, themeColors.pink, 'center');
      chapterText(
        ctx,
        api,
        currentBeat === 1
          ? 'charge 1.6 · gradients [0, 0.5]'
          : 'same values, different reduction order',
        1310,
        420,
        32,
        themeColors.pink,
        'center',
      );
    }
    note(
      ctx,
      api,
      currentBeat === 2
        ? 'The chain rule carries these gradients back to the encoder.'
        : 'Each bar on the left is one example’s KL in nats.',
    );
  }
}
export default {
  id: 'free-bits',
  draw: drawFreeBits,
  cues: [
    'vae-free-bits-0-build',
    'below-floor',
    'vae-free-bits-1-build',
    'vae-free-bits-group',
    'vae-free-bits-each',
    'vae-free-bits-2-build',
  ],
};
