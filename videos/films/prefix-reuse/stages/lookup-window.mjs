import { arrow, drawText, footer, frame, line, mark } from '../defaults.mjs';
export function drawLookupWindow(ctx, scene, state, api) {
  return api.focus.target('lookup-window-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    {
      drawText(ctx, api, 'Claude eligible positions · twenty includes the endpoint', 150, 270, 31);
      const moved = currentBeat > 1 || (currentBeat === 1 && cueVisible('window-35')),
        repaired = currentBeat > 1 || (currentBeat === 1 && cueVisible('window-repair')),
        endpoint = moved ? 35 : 34;
      const x = (value) => 180 + (value - 12) * 64;
      for (let v = 12; v <= 36; v++) {
        const inside = v <= endpoint && v > endpoint - 20,
          entry = v === 15;
        frame(
          ctx,
          api,
          x(v),
          455,
          52,
          85,
          entry ? themeColors.blue : inside ? themeColors.cyan : themeColors.muted,
          inside ? themeColors.panel : themeColors.bg,
        );
        drawText(
          ctx,
          api,
          v,
          x(v) + 26,
          509,
          23,
          entry ? themeColors.blue : inside ? themeColors.cyan : themeColors.muted,
          'center',
        );
        if (entry) drawText(ctx, api, 'entry', x(v) + 26, 420, 24, themeColors.blue, 'center');
      }
      mark(ctx, api, 'window-twenty', () => {
        line(ctx, api, x(endpoint - 19), 590, x(endpoint) + 52, 590, themeColors.cyan, 5);
        drawText(
          ctx,
          api,
          'inclusive window [' + (endpoint - 19) + ', ' + endpoint + ']',
          960,
          665,
          31,
          themeColors.cyan,
          'center',
        );
      });
      const hit = 15 > endpoint - 20 || repaired;
      if (currentBeat === 1) {
        mark(ctx, api, 'window-34', () => {
          if (!moved && cueVisible('window-34'))
            drawText(ctx, api, 'Entry 15 reached', 500, 820, 32, themeColors.green);
        });
        mark(ctx, api, 'window-miss', () => {
          if (moved && cueVisible('window-miss') && !repaired)
            drawText(
              ctx,
              api,
              '15 is outside [16, 35] → miss',
              960,
              815,
              34,
              themeColors.pink,
              'center',
            );
        });
        mark(ctx, api, 'window-repair', () => {
          if (repaired) {
            arrow(ctx, api, x(15) + 26, 755, x(15) + 26, 555, themeColors.green);
            drawText(
              ctx,
              api,
              'Add marker 15 → direct compatible lookup',
              960,
              840,
              32,
              themeColors.green,
              'center',
            );
          }
        });
      } else if (currentBeat > 1) {
        mark(ctx, api, 'window-slots', () =>
          drawText(
            ctx,
            api,
            'Four slots · automatic placement uses one',
            180,
            755,
            29,
            themeColors.yellow,
          ),
        );
        mark(ctx, api, 'window-ready', () => {
          if (cueVisible('window-ready'))
            drawText(
              ctx,
              api,
              'First response starts → concurrent read becomes available',
              180,
              835,
              29,
              themeColors.blue,
            );
        });
        mark(ctx, api, 'window-longest', () => {
          if (cueVisible('window-longest'))
            drawText(
              ctx,
              api,
              'Longest reachable prefix; overlapping lengths are not summed',
              180,
              915,
              28,
              themeColors.green,
            );
        });
      } else
        footer(
          ctx,
          api,
          'Tool-use groups and tool-result groups have documented eligible-position rules.',
        );
      if (currentBeat > 0 && !hit) api.circle(ctx, x(15) + 26, 497, 40, null, themeColors.pink, 3);
    }
  });
}
export default {
  id: 'lookup-window',
  draw: drawLookupWindow,
  cues: [
    'window-twenty',
    'window-34',
    'window-35',
    'window-miss',
    'window-repair',
    'window-slots',
    'window-ready',
    'window-longest',
  ],
};
