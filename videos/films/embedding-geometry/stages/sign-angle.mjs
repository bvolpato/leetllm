import { cosine } from '../arithmetic.mjs';
import { cell, geometryText, heading, line } from '../defaults.mjs';
export function drawSignAngle(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'before' ? 0 : c?.phase === 'after' ? 1 : (c?.progress ?? cueProgress());
    };
  {
    const left = [1, 0.01, -1, -0.01],
      right = [0.01, 1, -0.01, -1],
      cos = cosine(left, right),
      theta = Math.acos(cos);
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Same mean 0 and two positive signs · different magnitude patterns'
        : currentBeat === 1
          ? 'A planar view of the same angle · independent random orientations'
          : 'Fixed query · 384 sign bits · only 385 distance bins',
    );
    if (currentBeat === 0) {
      [left, right].forEach((v, i) => {
        const y = 390 + i * 210;
        v.forEach((x, j) => {
          cell(ctx, api, x, 240 + j * 350, y, 270, 75, x > 0 ? themeColors.blue : themeColors.pink);
          geometryText(
            ctx,
            api,
            x > 0 ? '1' : '0',
            375 + j * 350,
            y + 135,
            40,
            x > 0 ? themeColors.blue : themeColors.pink,
            'center',
          );
        });
      });
      api.focus.target('sign-collision', () =>
        geometryText(
          ctx,
          api,
          cue('sign-result') > 0.6
            ? 'Identical sign codes → Hamming 0 · cosine ' + cos.toFixed(6)
            : 'Predict the Hamming distance and directional similarity',
          960,
          1000,
          38,
          themeColors.yellow,
          'center',
        ),
      );
    }
    if (currentBeat === 1) {
      const center = {
          x: 650,
          y: 650,
        },
        radius = 270,
        q = cueProgress(),
        n = Math.min(32, 1 + Math.floor(q * 32));
      let seed = 314159;
      const angles = Array.from(
          {
            length: 32,
          },
          () => {
            seed = (1664525 * seed + 1013904223) >>> 0;
            return (seed / 2 ** 32) * 2 * Math.PI;
          },
        ),
        phi = angles[n - 1],
        point = (a) => ({
          x: center.x + Math.cos(a) * radius,
          y: center.y - Math.sin(a) * radius,
        }),
        u = point(0),
        v = point(theta),
        normal = point(phi + Math.PI / 2),
        neg = point(phi - Math.PI / 2);
      line(ctx, api, center.x, center.y, u.x, u.y, themeColors.blue, 6);
      line(ctx, api, center.x, center.y, v.x, v.y, themeColors.cyan, 6);
      line(ctx, api, normal.x, normal.y, neg.x, neg.y, themeColors.muted, 3);
      api.circle(ctx, center.x, center.y, 7, themeColors.ink);
      geometryText(ctx, api, 'u', u.x + 35, u.y + 10, 30, themeColors.blue);
      geometryText(ctx, api, 'v', v.x, v.y - 35, 30, themeColors.cyan, 'center');
      const mismatches = angles
        .slice(0, n)
        .filter((a) => Math.cos(a) > 0 !== Math.cos(theta - a) > 0).length;
      geometryText(
        ctx,
        api,
        'Supplied random-orientation simulation',
        1430,
        400,
        30,
        themeColors.muted,
        'center',
      );
      geometryText(
        ctx,
        api,
        mismatches + ' differing / ' + n + ' bits',
        1430,
        590,
        39,
        themeColors.pink,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Expected fraction θ/π = ' + (theta / Math.PI).toFixed(6),
        1430,
        790,
        33,
        themeColors.yellow,
        'center',
      );
      geometryText(
        ctx,
        api,
        'The expectation averages random hyperplanes, not the original fixed sign axes',
        960,
        1030,
        29,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 2) {
      geometryText(
        ctx,
        api,
        '384 bits → only385 possible Hamming distances to one query',
        960,
        380,
        37,
        themeColors.ink,
        'center',
      );
      line(ctx, api, 300, 650, 1660, 650, themeColors.muted, 4);
      for (let i = 0; i <= 384; i++)
        line(
          ctx,
          api,
          300 + (i / 384) * 1360,
          640,
          300 + (i / 384) * 1360,
          660,
          i % 64 ? themeColors.muted : themeColors.yellow,
          i % 64 ? 1 : 4,
        );
      for (let i = 0; i <= 384; i += 64)
        geometryText(ctx, api, i, 300 + (i / 384) * 1360, 735, 29, themeColors.muted, 'center');
      geometryText(
        ctx,
        api,
        '100,000 rows must share distance values',
        960,
        860,
        40,
        themeColors.yellow,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Ties alone do not establish relevance or which rows cross the shortlist cutoff',
        960,
        1020,
        30,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'sign-angle',
  draw: drawSignAngle,
  cues: ['sign-result'],
};
