import { spokenProgress } from '../construction.mjs';
import { drawClipRectangle, drawClipText, rackPhoto, withClipFocus } from '../defaults.mjs';
export function drawAdaptiveReduction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    const names = ['vent', 'tag', 'layout', 'decoration'],
      colors = [themeColors.blue, themeColors.yellow, themeColors.cyan, themeColors.pink];
    drawClipText(ctx, api, 'Keep task evidence attached to each retained token', 960, 285, 38);
    rackPhoto(ctx, api, 220, 380, 510, 430, {
      selected: currentBeat === 0 ? 'decoration' : currentBeat === 1 ? 'tag' : 'vent',
    });
    const q = clauseProgress(
      currentBeat === 0
        ? 'reducer-build'
        : currentBeat === 1
          ? 'reducer-floor'
          : currentBeat === 2
            ? 'reducer-repair'
            : 'reducer-metrics',
      Math.min(currentBeat, 3),
    );
    names.forEach((name, i) => {
      const x = 870 + i * 240,
        remove =
          (currentBeat > 2 || (currentBeat === 2 && clauseProgress('reducer-repair', 2) > 0.5)) &&
          i === 3,
        y = 480 + (remove ? (currentBeat > 2 ? 220 : 220 * q) : 0);
      drawClipRectangle(
        ctx,
        api,
        x,
        y,
        175,
        110,
        remove ? themeColors.panel : colors[i],
        remove ? themeColors.muted : undefined,
      );
      drawClipText(ctx, api, name, x + 87, y + 70, 27, remove ? themeColors.muted : themeColors.bg);
      drawClipText(
        ctx,
        api,
        i < 3 ? 'protected floor' : remove ? 'discarded' : 'high saliency',
        x + 87,
        y + 155,
        23,
        i < 3 ? themeColors.yellow : remove ? themeColors.muted : themeColors.pink,
      );
    });
    withClipFocus(ctx, api, 'reducer-contract', () => {
      if (currentBeat === 0)
        drawClipText(
          ctx,
          api,
          'Prune: drop a token · merge: combine evidence into a representative',
          960,
          950,
          31,
          themeColors.yellow,
        );
      else if (currentBeat === 1)
        drawClipText(
          ctx,
          api,
          clauseProgress('reducer-question', 1) > 0
            ? 'Can two slots keep the vent, tag and layout?'
            : 'Keep space for the tag, the vent and the layout.',
          960,
          950,
          29,
          themeColors.yellow,
        );
      else if (currentBeat === 2) {
        const fail = clauseProgress('reducer-fail', 2),
          repair = clauseProgress('reducer-repair', 2);
        drawClipText(
          ctx,
          api,
          repair > 0.8
            ? 'cap 3 → vent + tag + layout; decoration discarded'
            : fail > 0.8
              ? 'cap 2 < 3 required regions → review'
              : 'Can cap 2 preserve all 3 required regions?',
          960,
          950,
          34,
          repair > 0.8 ? themeColors.green : fail > 0.8 ? themeColors.pink : themeColors.yellow,
        );
      } else {
        drawClipText(
          ctx,
          api,
          'Measure work and evidence on the same slices',
          1100,
          840,
          28,
          themeColors.muted,
        );
        const n = Math.floor(4 * q);
        ['count tail', 'vision time', 'prefill / TTFT', 'quality by slice']
          .slice(0, n)
          .forEach((v, i) =>
            drawClipText(
              ctx,
              api,
              v,
              970 + (i % 2) * 520,
              890 + Math.floor(i / 2) * 95,
              29,
              themeColors.yellow,
            ),
          );
      }
    });
  }
}
export default {
  id: 'adaptive-reduction',
  draw: drawAdaptiveReduction,
  cues: ['reducer-build', 'reducer-floor', 'reducer-question', 'reducer-fail', 'reducer-repair', 'reducer-metrics'],
};
