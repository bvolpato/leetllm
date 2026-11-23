import { scalingEvent } from '../construction.mjs';
import { band, dot, rectangle, text } from '../defaults.mjs';
export function drawArchitectureAware(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-architecture-aware-construction', () => {
    band(ctx, api, 'One tile represents two billion weights');
    if (currentBeat < 2) {
      const active = Math.floor(progress * 5);
      for (let i = 0; i < 40; i++) {
        const x = 280 + (i % 10) * 135,
          y = 360 + Math.floor(i / 10) * 110;
        const col = i < 2 ? themeColors.blue : i < 5 ? themeColors.cyan : themeColors.muted;
        rectangle(ctx, api, x, y, 102, 76, i < active ? col : themeColors.panel, col);
        if (i < 5)
          text(
            ctx,
            api,
            i < 2 ? 'Shared' : 'Selected',
            x + 51,
            y + 45,
            20,
            i < active ? themeColors.bg : col,
            'center',
          );
      }
      const tokenSlot = Math.min(4, Math.floor(progress * 5));
      dot(ctx, api, 331 + tokenSlot * 135, 325, themeColors.yellow, 12);
      text(ctx, api, 'current token', 331 + tokenSlot * 135, 300, 23, themeColors.yellow, 'center');
      text(
        ctx,
        api,
        'Each tile = 2B parameters · all 40 tiles remain stored',
        960,
        850,
        31,
        themeColors.muted,
        'center',
      );
      result(
        currentBeat === 0
          ? 'A routed batch can touch additional experts; routing/communication remain extra'
          : '80B total × 2 bytes = 160 GB · 6 × 10B active × 100B tokens = 6 × 10²¹ proxy FLOPs',
      );
    } else {
      const contexts = Math.floor(4 + 8 * progress);
      text(ctx, api, 'Cached attention history', 600, 340, 34, themeColors.cyan, 'center');
      for (let i = 0; i < contexts; i++)
        rectangle(ctx, api, 300 + i * 52, 400, 40, 170, themeColors.cyan);
      text(ctx, api, 'Fixed recurrent state', 1350, 340, 34, themeColors.blue, 'center');
      for (let i = 0; i < 4; i++)
        rectangle(ctx, api, 1160 + i * 95, 400, 65, 170, themeColors.blue);
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++)
          rectangle(
            ctx,
            api,
            360 + j * 44,
            680 + i * 27,
            34,
            18,
            j <= i ? themeColors.cyan : themeColors.panel,
            themeColors.muted,
          );
      text(ctx, api, 'Full-sequence pairwise work', 600, 925, 30, themeColors.cyan, 'center');
      text(ctx, api, 'One recurrent update', 1350, 760, 31, themeColors.blue, 'center');
      if (end)
        text(
          ctx,
          api,
          'Measure the actual architecture and phase; dense frontier fits do not transfer automatically',
          960,
          1010,
          29,
          themeColors.green,
          'center',
        );
    }
  });
}
export default {
  id: 'architecture-aware',
  draw: drawArchitectureAware,
  cues: ['sl-architecture-aware-0', 'sl-architecture-aware-1', 'sl-architecture-aware-2'],
};
