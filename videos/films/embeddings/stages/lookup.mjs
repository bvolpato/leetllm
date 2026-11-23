import { V } from '../fixtures.mjs';
import { focusTarget, rowMatrix, text } from '../defaults.mjs';
export function drawLookup(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = (i) => (currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.07, 0.9));
  {
    const values = Object.values(V),
      names = Object.keys(V),
      entry = currentBeat === 0 ? q(0) : 1,
      second = currentBeat === 0 ? 0 : currentBeat === 1 ? q(1) : 1;
    text(ctx, api, 'ID', 560, 300, 30, themeColors.muted, 'center');
    names.forEach((name, i) =>
      text(
        ctx,
        api,
        i + ' · ' + name,
        560,
        395 + i * 125,
        32,
        i === 0 ? themeColors.yellow : themeColors.muted,
        'right',
      ),
    );
    focusTarget(ctx, api, 'lookup-matrix', () => rowMatrix(ctx, api, values, 700, 310));
    const source = {
      x: 1110,
      y: 372,
    };
    [
      ['river bank', entry, 400, themeColors.cyan],
      ['deposit money at bank', second, 700, themeColors.green],
    ].forEach(([label, amount, y, color], copyIndex) => {
      text(ctx, api, label, 1460, y - 90, 30, color, 'center');
      const end = {
        x: 1460,
        y,
      };
      const horizontal = copyIndex === 1 ? api.phase(amount, 0.6, 1) : amount;
      const vertical = copyIndex === 1 ? api.phase(amount, 0, 0.6) : amount;
      const point = {
        x: source.x + (end.x - source.x) * horizontal,
        y: source.y + (end.y - source.y) * vertical,
      };
      if (amount > 0)
        components.matrix({
          values: [V.bank],
          x: point.x - 125,
          y: point.y - 60,
          cellSize: 115,
          gap: 8,
          format: (v) => v.toFixed(2),
          style: {
            fill: themeColors.panel,
            stroke: color,
            textColor: color,
            fontSize: 31,
            font: 'mono',
            padding: 8,
          },
        });
      if (amount > 0) api.line(ctx, 970, 372, point.x - 145, point.y, color, 3);
    });
    text(ctx, api, 'Both occurrences select ID 0', 960, 930, 36, themeColors.yellow, 'center');
    text(
      ctx,
      api,
      'One stored row · two copies for two positions',
      960,
      1010,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'lookup',
  draw: drawLookup,
  cues: ['lookup-beat-1-focus-1', 'lookup-beat-2-focus-1', 'lookup-beat-3-focus-1'],
};
