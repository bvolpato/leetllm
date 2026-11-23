import { accumulationSnapshot, cue } from '../construction.mjs';
import { axes, caption, equation, focusTarget, interval, text, percent } from '../defaults.mjs';
export function drawAccumulatingEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const f = accumulationSnapshot(currentBeat, state.beatP, state.cues);
    text(
      ctx,
      api,
      'Controlled groups · 4 specialist cases / 25 labels',
      600,
      295,
      29,
      themeColors.muted,
      'center',
    );
    focusTarget(ctx, api, 'label-groups', () => {
      const makeRoom = Math.min(1, 2 * f.secondTray);
      const incoming = Math.max(0, 2 * f.secondTray - 1);
      for (let i = 0; i < 16; i++) {
        const arriving = i === 1 && incoming > 0 && incoming < 1;
        if (i >= f.groups && !arriving) continue;
        const slotX = 165 + (i % 4) * 205;
        const slotY = 355 + Math.floor(i / 4) * 115;
        const scale = i < 2 ? api.lerp(api.lerp(2.45, 1.78, makeRoom), 1, f.reflow) : 1;
        const x =
          i === 0
            ? api.lerp(api.lerp(348, 180, makeRoom), slotX, f.reflow)
            : i === 1
              ? api.lerp(api.lerp(710, 590, incoming), slotX, f.reflow)
              : slotX;
        const y = i < 2 ? api.lerp(450, slotY, f.reflow) : slotY;
        api.rect(
          ctx,
          x,
          y,
          178 * scale,
          93 * scale,
          themeColors.panel,
          i < f.groups ? themeColors.cyan : themeColors.muted,
          1,
          7,
        );
        for (let j = 0; j < 25; j++)
          api.circle(
            ctx,
            x + (25 + (j % 5) * 31) * scale,
            y + (14 + Math.floor(j / 5) * 16) * scale,
            5 * scale,
            j < 4 ? themeColors.pink : themeColors.blue,
          );
      }
    });
    equation(ctx, api, f.k + '/' + f.n + '=16\\%', 560, 915, 49, themeColors.yellow, 'center');
    const plot = axes(
      ctx,
      api,
      1100,
      400,
      640,
      370,
      [0, 0.4],
      [0, 2],
      [0, 0.1, 0.16, 0.2, 0.3, 0.4],
      [],
      'population rate',
      '',
    );
    interval(ctx, api, plot, f.reference, 1.5, themeColors.muted, 1, 0.16);
    focusTarget(ctx, api, 'contracting-interval', () =>
      interval(ctx, api, plot, f.interval, 0.5, themeColors.cyan, 1, 0.16),
    );
    if (currentBeat === 2 && cue(state, 'interval-midpoints', 0.21, 0.42) > 0)
      focusTarget(ctx, api, 'wilson-midpoints', () => {
        for (const [range, row] of [
          [f.reference, 1.5],
          [f.interval, 0.5],
        ]) {
          const p = plot.point(range.center, row);
          api.line(ctx, p.x, p.y - 38, p.x, p.y - 11, themeColors.ink, 3);
          text(
            ctx,
            api,
            'Midpoint ' + (100 * range.center).toFixed(2) + '%',
            p.x,
            p.y - 55,
            27,
            themeColors.ink,
            'center',
          );
        }
      });
    text(ctx, api, '25 labels · held reference', 1420, 345, 28, themeColors.muted, 'center');
    text(
      ctx,
      api,
      f.n + ' labels · ' + percent(f.interval.low) + ' – ' + percent(f.interval.high),
      1420,
      890,
      29,
      themeColors.cyan,
      'center',
    );
    caption(ctx, api, 'Yellow dot · sample estimate');
  }
}
export default {
  id: 'accumulating-evidence',
  draw: drawAccumulatingEvidence,
  cues: ['second-tray', 'add-groups', 'interval-midpoints'],
};
