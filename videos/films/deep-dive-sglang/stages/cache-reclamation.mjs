import { phase } from '../arithmetic.mjs';
import { reclamationState } from '../model.mjs';
import { arrow, bar, box, cells, extensionText, footer, title } from '../defaults.mjs';
export function drawCacheReclamation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('cache-reclamation-mechanism', () => {
    const s = reclamationState(state);
    title(ctx, api, 'Keep the physical segment until its last device reader');
    cells(
      ctx,
      api,
      s.reclaimed >= 1 ? ['free', 'free', 'free', 'free'] : ['KV12', 'KV13', 'KV14', 'KV15'],
      390,
      450,
      1140,
      120,
      s.evictable ? themeColors.green : themeColors.cyan,
      4,
    );
    box(ctx, api, 'R0 · released', 200, 300, 440, 80, themeColors.muted);
    box(
      ctx,
      api,
      s.owners.includes('R1') ? 'R1 · owner held' : 'R1 · released',
      1270,
      300,
      440,
      80,
      s.evictable ? themeColors.muted : themeColors.yellow,
    );
    if (!s.readerDone) arrow(ctx, api, 1490, 390, 1490, 435, themeColors.yellow);
    bar(
      ctx,
      api,
      'R1 outstanding GPU reader',
      s.readerProgress,
      1,
      360,
      695,
      1200,
      s.readerDone ? themeColors.green : themeColors.yellow,
      s.readerDone ? 'completed' : 'pending',
    );
    if (s.evictable)
      extensionText(
        ctx,
        api,
        s.reclaimed >= 1 ? 'Illustrated policy choice: reclaimed' : 'Eligible · still resident',
        960,
        850,
        40,
        themeColors.green,
        'center',
      );
    else
      extensionText(
        ctx,
        api,
        'Eviction blocked by live device ownership',
        960,
        850,
        38,
        themeColors.yellow,
        'center',
      );
    footer(
      ctx,
      api,
      'Cancellation / response completion alone cannot release a still-referenced segment',
    );
  });
}
export default {
  id: 'cache-reclamation',
  draw: drawCacheReclamation,
  cues: [
    'sg-cache-reclamation-beat-0',
    'sg-cache-reclamation-beat-1',
    'sg-reader-pending',
    'sg-reader-complete',
    'sg-owner-release',
    'sg-reclaim',
  ],
};
