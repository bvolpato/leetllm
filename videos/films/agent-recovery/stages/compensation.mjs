import { centerText, cueProgress, line, note, rectangle, tag } from '../defaults.mjs';
export function drawCompensation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    done = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('compensation-mechanism', () => {
    const evicted = currentBeat > 0 ? 1 : cueProgress(ctx, api, 'pods-evicted'),
      uncordon = cueProgress(ctx, api, 'uncordon');
    const nodes = [420, 960, 1500];
    nodes.forEach((x, i) => {
      rectangle(ctx, api, x - 190, 430, 380, 350, themeColors.panel);
      line(
        ctx,
        api,
        x - 190,
        430,
        x + 190,
        430,
        i === 0 && !uncordon ? themeColors.pink : themeColors.blue,
        5,
      );
      centerText(ctx, api, 'node ' + ['A', 'B', 'C'][i], x, 385, 35, themeColors.blue);
    });
    const pods = [
      [420, 960, 560],
      [420, 1500, 680],
    ];
    pods.forEach(([start, end, y], i) => {
      const originalAlpha = Math.max(0, 1 - 2 * evicted);
      const replacementAlpha = Math.max(0, 2 * evicted - 1);
      ctx.save();
      ctx.globalAlpha *= originalAlpha;
      rectangle(ctx, api, start - 90, y - 35, 180, 70, i ? themeColors.yellow : themeColors.cyan);
      centerText(ctx, api, 'A' + (i + 1), start, y + 10, 31, themeColors.ink);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= replacementAlpha;
      rectangle(ctx, api, end - 90, y - 35, 180, 70, themeColors.green);
      centerText(ctx, api, 'R' + (i + 1), end, y + 10, 31, themeColors.ink);
      ctx.restore();
    });
    if (evicted >= 0.5)
      centerText(ctx, api, 'original Pods terminated', 420, 745, 26, themeColors.pink);
    if (evicted > 0.5)
      centerText(ctx, api, 'R: new Pod identities', 1240, 820, 28, themeColors.green);
    centerText(
      ctx,
      api,
      uncordon ? 'A admits future placement' : 'A cordoned: no new placement',
      420,
      850,
      28,
      uncordon ? themeColors.green : themeColors.pink,
    );
    if (done('image-unavailable'))
      tag(ctx, api, 'replacement image unavailable', 1280, 875, themeColors.pink, 900);
    if (done('uncordon'))
      centerText(
        ctx,
        api,
        'Replacement Pods stay put · health still needs evidence',
        960,
        950,
        32,
        themeColors.yellow,
      );
    if (currentBeat === 1) {
      const stage = cueProgress(ctx, api, 'saga-progress');
      [
        'cordon confirmed',
        'evict confirmed',
        'replacement failed',
        'compensation ' + (stage ? 'unknown' : 'planned'),
      ].forEach((s, i) => {
        api.circle(
          ctx,
          300 + i * 440,
          285,
          11,
          i === 3 ? (stage ? themeColors.pink : themeColors.yellow) : themeColors.blue,
        );
        centerText(
          ctx,
          api,
          s,
          300 + i * 440,
          335,
          26,
          i === 3 ? themeColors.pink : themeColors.muted,
        );
      });
      note(
        ctx,
        api,
        'Confirmed steps, repeat safety and reconciliation survive failed compensation; notification knowledge persists',
      );
    } else
      note(
        ctx,
        api,
        'Authorized authored maintenance scenario · uncordon does not restore old placement',
      );
  });
}
export default {
  id: 'compensation',
  draw: drawCompensation,
  cues: ['pods-evicted', 'image-unavailable', 'uncordon', 'saga-progress'],
};
