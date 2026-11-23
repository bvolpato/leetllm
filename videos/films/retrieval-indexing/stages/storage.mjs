import { storageDisplay } from '../storage.mjs';
import { TRACKS } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalText,
  drawVisualFocus,
} from '../defaults.mjs';
export function drawStorage(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const snapshot = TRACKS['storage'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    drawOriginalText(
      ctx,
      api,
      snapshot.mode === 'gaps'
        ? 'Sorted posting IDs become compact gaps'
        : snapshot.mode === 'decoded'
          ? 'Decoding reconstructs the same positions'
          : 'Posting lists follow sorted document IDs',
      960,
      285,
      35,
      themeColors.ink,
      'center',
    );
    const gapCue = state.cues?.['storage-gap-values'];
    const showIds =
      snapshot.mode !== 'gaps' || (gapCue ? gapCue.phase === 'before' : progress < 0.244);
    const labels = showIds ? snapshot.ids.map(String) : snapshot.gaps.map(String);
    const cardOpacity = () => 1;
    const display = storageDisplay(snapshot, progress, (_progress, index) => cardOpacity(index));
    const nodes = labels.map((value, index) =>
      drawVisualFocus(ctx, api, 'storage-values', () =>
        drawOriginalCard(
          ctx,
          api,
          'storage',
          value,
          330 + index * 460,
          480,
          245,
          104,
          themeColors.cyan,
          cardOpacity(index),
          36,
        ),
      ),
    );
    nodes.slice(0, -1).forEach((shape, index) =>
      teaching.transfer({
        source: {
          shape,
          opacity: cardOpacity(index),
        },
        target: {
          shape: nodes[index + 1],
          opacity: cardOpacity(index + 1),
        },
        progress: snapshot.mode === 'gaps' ? api.phase(progress, 0.739, 0.95) : 1,
        color: themeColors.yellow,
        particle: {
          radius: 8,
          fill: themeColors.yellow,
        },
        gap: 14,
      }),
    );
    drawOriginalText(
      ctx,
      api,
      showIds ? 'document ID' : 'difference from the previous ID',
      960,
      650,
      30,
      themeColors.muted,
      'center',
    );
    if (display.visibleCount > 0 || (snapshot.mode === 'gaps' && progress < 0.244)) {
      const gapSequence = display.visibleGaps.join(',\\;');
      const idSequence = display.visibleIds.join(',\\;');
      const equation =
        snapshot.mode === 'gaps'
          ? showIds
            ? String.raw`\text{ordered IDs: }${snapshot.ids.join(',\\;')}`
            : progress < 0.739
              ? String.raw`\Delta_{1..k}: ${gapSequence}\quad\text{running sum}=${display.partialSum}`
              : String.raw`\Delta_{1..k}: ${gapSequence}\quad\longrightarrow\quad IDs: ${idSequence}`
          : snapshot.mode === 'decoded'
            ? String.raw`\sum_{i=1}^{${display.visibleCount}}\Delta_i=${display.partialSum}\quad\longrightarrow\quad ID_${display.visibleCount}=${display.visibleIds.at(-1)}`
            : String.raw`\text{ordered IDs: }${idSequence}`;
      drawVisualFocus(ctx, api, 'storage-equation', () =>
        drawOriginalEquation(ctx, api, equation, 960, 815, 44, themeColors.green),
      );
    }
    drawOriginalText(
      ctx,
      api,
      'Small gaps can compress well; actual storage depends on the chosen codec.',
      960,
      925,
      28,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'storage',
  draw: drawStorage,
  cues: ['storage-ordered', 'storage-id-values', 'storage-gap-values', 'storage-decoding'],
};
