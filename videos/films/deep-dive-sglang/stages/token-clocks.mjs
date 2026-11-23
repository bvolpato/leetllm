import { clamp, phase } from '../arithmetic.mjs';
import { sgProgress } from '../construction.mjs';
import { arrow, box, cells, extensionText, footer, line, title } from '../defaults.mjs';
export function drawTokenClocks(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('token-clocks-mechanism', () => {
    title(ctx, api, 'One request on the client’s clock');
    const first = sgProgress(state, 'clock-first', q),
      gaps = sgProgress(state, 'clock-gaps', q),
      x = (v) => 260 + (v / 350) * 1400;
    line(ctx, api, x(0), 540, x(350), 540, themeColors.muted, 3);
    [0, 240, 280, 350].forEach((v) => {
      line(ctx, api, x(v), 525, x(v), 555);
      extensionText(ctx, api, v + ' ms', x(v), 605, 27, themeColors.muted, 'center');
    });
    box(ctx, api, 'arrival', x(0) - 75, 375, 150, 80, themeColors.blue);
    arrow(ctx, api, x(0), 470, x(240) * first + x(0) * (1 - first), 470, themeColors.blue);
    if (first >= 1) {
      box(ctx, api, 'first token', x(240) - 100, 375, 200, 80, themeColors.green);
      extensionText(ctx, api, 'TTFT = 240 ms', x(120), 430, 32, themeColors.blue, 'center');
    }
    if (gaps > 0)
      [
        [240, 280, 40],
        [280, 350, 70],
      ].forEach(([a, z, v], i) => {
        const p = clamp(gaps * 2 - i);
        arrow(
          ctx,
          api,
          x(a),
          710 + i * 80,
          x(a) + (x(z) - x(a)) * p,
          710 + i * 80,
          themeColors.cyan,
        );
        if (p >= 1)
          extensionText(
            ctx,
            api,
            v + ' ms',
            x((a + z) / 2),
            675 + i * 80,
            30,
            themeColors.cyan,
            'center',
          );
      });
    if (currentBeat)
      cells(
        ctx,
        api,
        ['tokenize', 'queue / cache', 'forward', 'sample / deliver'],
        240,
        875,
        1440,
        65,
        themeColors.blue,
      );
    footer(ctx, api, 'Example arrival times in milliseconds');
  });
}
export default {
  id: 'token-clocks',
  draw: drawTokenClocks,
  cues: ['sg-token-clocks-beat-0', 'sg-clock-first', 'sg-clock-gaps', 'sg-token-clocks-beat-1'],
};
