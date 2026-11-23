import { L, memory, rectangle, text } from '../defaults.mjs';
export function drawRetryBoundaries(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    text(
      ctx,
      api,
      'R4219 · same semantics, one authoritative owner',
      960,
      285,
      37,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 0) {
      rectangle(ctx, api, 180, 440, 600, 200, themeColors.blue);
      text(ctx, api, 'op17 commit acknowledgement', 480, 505, 31, themeColors.blue, 'center');
      text(ctx, api, 'LOST', 480, 585, 45, themeColors.pink, 'center');
      rectangle(ctx, api, 1140, 440, 600, 200, themeColors.yellow);
      text(ctx, api, 'authoritative owner op17', 1440, 515, 32, themeColors.yellow, 'center');
      text(
        ctx,
        api,
        q(0) > 0.6 ? 'query before a new owner' : 'outcome UNKNOWN',
        1440,
        595,
        34,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Fence old owner · preserve semantics · check deadline and retry budget',
        960,
        855,
        32,
        themeColors.cyan,
        'center',
      );
    } else if (currentBeat === 1) {
      ['token1', 'token2', 'token3', 'token4', 'token5'].forEach((v, i) => {
        const x = 230 + i * 300;
        rectangle(ctx, api, x, 440, 240, 110, i < 2 ? themeColors.green : themeColors.muted);
        text(
          ctx,
          api,
          v,
          x + 120,
          510,
          36,
          i < 2 ? themeColors.green : themeColors.muted,
          'center',
        );
      });
      L(ctx, api, 810, 585, 810, 625, themeColors.yellow, 5);
      text(
        ctx,
        api,
        'client acknowledged through token2',
        960,
        680,
        36,
        themeColors.yellow,
        'center',
      );
      rectangle(ctx, api, 320, 845, 1280, 105, themeColors.pink);
      text(
        ctx,
        api,
        'cursor + dedup + sampling state + owner, or interrupted stream',
        960,
        910,
        32,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 2) {
      memory(
        ctx,
        api,
        210,
        455,
        8,
        4,
        32,
        'source KV retained while transport reads',
        themeColors.blue,
        70,
      );
      const u = q(2),
        x = 850 + 200 * u;
      rectangle(ctx, api, x, 500, 180, 90, themeColors.yellow);
      text(ctx, api, 'read KV', x + 90, 558, 30, themeColors.yellow, 'center');
      rectangle(ctx, api, 1300, 455, 430, 240, themeColors.green);
      text(ctx, api, 'decode group', 1515, 515, 36, themeColors.green, 'center');
      text(ctx, api, 'rank0 failed', 1515, 590, 35, themeColors.pink, 'center');
      text(ctx, api, 'recover collective group', 1515, 655, 28, themeColors.yellow, 'center');
      text(
        ctx,
        api,
        'Source memory charge and expiry remain owned lifecycle obligations',
        960,
        1000,
        32,
        themeColors.cyan,
        'center',
      );
    } else {
      const tests = [
          '8 manifest mismatches',
          'duplicate / missing coverage',
          'stale attempt + expiry',
          '720 serialized event orders',
        ],
        n = Math.max(1, Math.ceil(q(3) * 4));
      tests.slice(0, n).forEach((v, i) => {
        rectangle(ctx, api, 180, 390 + i * 135, 700, 100, themeColors.blue);
        text(ctx, api, v, 530, 455 + i * 135, 31, themeColors.blue, 'center');
      });
      rectangle(ctx, api, 1100, 455, 660, 310, themeColors.pink);
      text(ctx, api, 'Backend + coordinator evidence', 1430, 520, 31, themeColors.pink, 'center');
      text(ctx, api, 'distributed atomicity', 1430, 600, 34, themeColors.muted, 'center');
      text(
        ctx,
        api,
        'real cancellation + CUDA visibility',
        1430,
        690,
        29,
        themeColors.muted,
        'center',
      );
      text(
        ctx,
        api,
        'Local transition checks assume trusted callbacks; they prove that modeled layer',
        960,
        1010,
        31,
        themeColors.yellow,
        'center',
      );
    }
  };
  if (api.focus)
    api.focus.target('retry-boundaries-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'retry-boundaries',
  draw: drawRetryBoundaries,
  cues: [
    'retry-boundaries-b1',
    'retry-boundaries-b2',
    'retry-boundaries-b3',
    'retry-boundaries-b4',
  ],
};
