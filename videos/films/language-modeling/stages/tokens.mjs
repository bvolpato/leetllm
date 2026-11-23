import { bound, phase } from '../arithmetic.mjs';
import { cue, finished, started } from '../construction.mjs';
import { card, equation, heading, row, target, text } from '../defaults.mjs';
export function drawTokens(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bound(state.beatP ?? 0),
    cues = state.cues;
  const amount = (id, fallback = phase(progress)) => cue(cues, id, fallback);
  const begins = (id, fallback = progress > 0.15) => started(cues, id, fallback);
  const done = (id, fallback = progress > 0.4) => finished(cues, id, fallback);
  {
    heading(ctx, api, 'Recorded sentence · whole-word toy tokens');
    row(ctx, api, ['The', 'cat'], 410);
    target(ctx, api, 'token-target', () =>
      card(
        ctx,
        api,
        done('token-target', progress > 0.72) ? 'sat' : 'covered',
        1050,
        410,
        260,
        90,
        themeColors.green,
      ),
    );
    api.line(ctx, 990, 350, 990, 720, themeColors.yellow, 4);
    text(ctx, api, 'Visible prefix', 650, 330, 36, themeColors.cyan, 'center');
    text(ctx, api, 'Observed next token', 1180, 330, 31, themeColors.green, 'center');
    target(ctx, api, 'token-ids', () => {
      const lookup = amount('token-ids', phase(progress, 0.2, 0.45));
      ['12', '31', done('token-target', progress > 0.72) ? '8' : '?'].forEach((id, i) => {
        const x = [480, 780, 1180][i],
          y = 650 - 100 * lookup;
        card(
          ctx,
          api,
          begins('token-ids', progress > 0.2) ? 'ID ' + id : 'ID ?',
          x - 70,
          y,
          140,
          60,
          themeColors.blue,
          29,
        );
        if (lookup >= 1) api.arrow(ctx, x, y - 5, x, 515, themeColors.blue, 3);
      });
    });
    equation(ctx, api, 'P(w_t\\mid w_{<t})', 960, 900, 53, themeColors.cyan);
  }
}
export default {
  id: 'tokens',
  draw: drawTokens,
  cues: ['token-ids', 'token-target'],
};
