import { visionBound, visionCueProgress } from '../construction.mjs';
import { arrow, card, detailText, footer, line, title } from '../defaults.mjs';
export function drawRotaryGrid(ctx, scene, state, api) {
  api.focus.target('rotary-grid-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = visionBound(state.beatP ?? 0);
    const q = (name, fallback = progress) => visionCueProgress(state.cues, name, fallback);
    {
      const move = currentBeat === 0 ? 0 : currentBeat > 1 ? 1 : q('rotary-key-row', progress),
        translation = currentBeat === 1 ? q('rotary-translate', 0) : currentBeat > 1 ? 1 : 0,
        angle = (move * Math.PI) / 2,
        at = (x, y, a, r = 145) => ({
          x: x + r * Math.cos(a),
          y: y - r * Math.sin(a),
        });
      title(ctx, api, 'Toy head: row pair + column pair · 90° per coordinate unit');
      [
        ['row coordinates', 540, angle],
        ['column coordinates', 1380, 0],
      ].forEach(([name, x, a]) => {
        api.circle(ctx, x, 590, 145, 'transparent', themeColors.border, 2);
        line(ctx, api, x - 200, 590, x + 200, 590);
        line(ctx, api, x, 390, x, 790);
        const query = at(x, 590, (translation * Math.PI) / 2),
          key = at(x, 590, a + (translation * Math.PI) / 2);
        arrow(ctx, api, x, 590, query.x, query.y, themeColors.cyan);
        arrow(ctx, api, x, 590, key.x, key.y, themeColors.pink);
        detailText(ctx, api, name, x, 350, 32, themeColors.muted, 'center');
        detailText(ctx, api, 'query', x - 140, 845, 28, themeColors.cyan, 'center');
        detailText(ctx, api, 'key', x + 140, 845, 28, themeColors.pink, 'center');
      });
      const score = Math.cos(angle) + 1;
      card(
        ctx,
        api,
        `row cos(${Math.round(move * 90)}°) + column 1 = ${score.toFixed(3)}`,
        400,
        915,
        1120,
        75,
        themeColors.green,
        31,
      );
      footer(
        ctx,
        api,
        translation > 0
          ? 'Shared translation preserves relative offsets and the resulting score'
          : 'The score depends on relative position and content; actual axis allocations vary',
      );
    }
    return true;
  });
}
export default {
  id: 'rotary-grid',
  draw: drawRotaryGrid,
  cues: [
    'rotary-grid-beat-0',
    'rotary-grid-beat-1',
    'rotary-key-row',
    'rotary-translate',
    'rotary-grid-beat-2',
  ],
};
