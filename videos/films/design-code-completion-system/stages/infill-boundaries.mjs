import { completionCue } from '../construction.mjs';
import {
  completionBox,
  completionCode,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawInfillBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    done = (id) => completionCue(state, id) >= 1;
  const drawMechanism = () => {
    const pre = 'is_allowed =',
      mid = 'graph.allows(request)',
      suf = 'return is_allowed';
    completionHeading(ctx, api, 'The returned edit contains the middle only');
    const row = (label, items, y) => {
      completionText(ctx, api, label, 180, y + 45, 28, themeColors.muted);
      let x = 470;
      for (const [v, col, w] of items) {
        completionBox(ctx, api, v, x, y, w, 84, col);
        x += w + 20;
      }
    };
    {
      completionCode(ctx, api, 'is_allowed =', 230, 440, 35, themeColors.blue);
      api.rect(ctx, 580, 390, 840, 100, themeColors.panel, themeColors.green, 2, 5);
      completionCode(ctx, api, 'graph.allows(request)', 610, 455, 33, themeColors.green);
      completionCode(ctx, api, 'return is_allowed', 230, 610, 35, themeColors.cyan);
      if (currentBeat > 0 && done('cc-insert-middle')) {
        api.arrow(ctx, 1000, 510, 1000, 720, themeColors.green, 4);
        completionCode(
          ctx,
          api,
          'is_allowed = graph.allows(request)',
          230,
          825,
          31,
          themeColors.ink,
        );
        completionCode(ctx, api, 'return is_allowed', 230, 905, 31, themeColors.cyan);
      }
      completionFooter(
        ctx,
        api,
        currentBeat
          ? 'Encode marker-like source as ordinary content · preserve suffix exactly'
          : 'Check the method signature and test an allowed and a denied request',
      );
    }
  };
  api.focus.target('cc-infill-boundaries-mechanism', drawMechanism);
  return;
}
export default {
  id: 'infill-boundaries',
  draw: drawInfillBoundaries,
  cues: ['cc-infill-boundaries-0', 'cc-infill-boundaries-1', 'cc-insert-middle'],
};
