import { memorySnapshot } from '../model.mjs';
import { cueProgress, drawEstablishedBatchingColor, drawEstablishedBatchingText } from '../defaults.mjs';
export function drawMemory(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {});
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    api.focus.target('memory-kv-capacity-grows-with-the-scheduled-histories', () =>
      drawEstablishedBatchingText(
        ctx,
        api,
        'Pages used by full-attention histories',
        960,
        310,
        39,
        themeColors.ink,
        'center',
      ),
    );
    const { retired, replaced, blocks } = memorySnapshot(
      currentBeat,
      currentBeat === 0 ? cueProgress(state, 'growing-state', 0.3, 0.45) : progress,
      {
        release: cueProgress(state, 'retire-pages', 0.43, 0.47) >= 1,
        reassign: cueProgress(state, 'memory-reassign', 0.47, 0.54) >= 1,
      },
    );
    blocks.forEach((count, i) => {
      api.focus.target('memory-readout', () =>
        drawEstablishedBatchingText(
          ctx,
          api,
          [replaced ? 'Request D' : 'Request A', 'Request B', 'Request C'][i],
          250,
          480 + i * 145,
          31,
          drawEstablishedBatchingColor(ctx, api, [replaced ? 'D' : 'A', 'B', 'C'][i]),
        ),
      );
      for (let j = 0; j < 4; j++)
        api.focus.target('memory-readout-2', () =>
          components.card({
            label: currentBeat === 2 && !retired && i === 0 && j < count ? 'writing' : j < count ? 'KV' : 'free',
            x: 650 + j * 230,
            y: 420 + i * 145,
            width: 180,
            height: 95,
            fontSize: 31,
            fill: themeColors.panel,
            stroke:
              j < count
                ? drawEstablishedBatchingColor(ctx, api, [replaced ? 'D' : 'A', 'B', 'C'][i])
                : themeColors.muted,
            textColor:
              j < count
                ? drawEstablishedBatchingColor(ctx, api, [replaced ? 'D' : 'A', 'B', 'C'][i])
                : themeColors.muted,
          }),
        );
    });
    api.focus.target('memory-readout-3', () =>
      drawEstablishedBatchingText(
        ctx,
        api,
        currentBeat === 1
          ? 'Logical KV pages map to available physical storage'
          : retired
            ? replaced
              ? 'Freed pages now back request D'
              : 'All prior access has finished. Both private pages are free.'
            : currentBeat === 2
              ? 'A finished. A transfer still holds its two pages.'
              : 'Reserve enough state for the next scheduled work',
        960,
        940,
        31,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'memory',
  draw: drawMemory,
  cues: [
    'growing-state',
    'state-budget',
    'physical-pages',
    'independent-pages',
    'retire-pages',
    'memory-reassign',
    'shared-references',
  ],
};
