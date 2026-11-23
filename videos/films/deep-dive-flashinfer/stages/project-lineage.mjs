import { mix } from '../arithmetic.mjs';
import { clauseEnded, tile } from '../cache-picture.mjs';
import { flashCue } from '../construction.mjs';
import { requests } from '../fixtures.mjs';

export function drawProjectLineage(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('fi-project-lineage-mechanism', () => {
    if (state.beat === 0) {
      api.text(ctx, 'FlashInfer operators', 160, 310, 52, C.ink);
      const ops = [
        'Attention',
        'Matrix multiply',
        'Mixture of experts',
        'Sampling',
        'Cache update',
      ];
      const progress = flashCue(state, 'fi-project-lineage-0', 0);
      ops.forEach((label, i) => {
        const color = i === Math.round(progress * (ops.length - 1)) ? C.cyan : C.muted;
        tile(api, label, 150 + i * 332, 394, 300, 105, color, color, 30);
      });
      api.text(ctx, 'Summer 2023', 160, 654, 41, C.blue);
      api.text(ctx, 'University of Washington  /  Carnegie Mellon  /  OctoAI', 160, 739, 48, C.ink);
      api.text(ctx, 'Community and NVIDIA contributors', 160, 826, 39, C.cyan);
      if (clauseEnded(state, 'fi-project-lineage-0-result', 0, 0.85))
        api.text(ctx, 'Core source: Apache 2.0', 160, 948, 36, C.muted);
    } else if (state.beat === 1) {
      const rows = [
        ['Paged-prefill call', 'v0.6.18', '29 Aug 2026', 'fi-project-lineage-1'],
        ['cuDNN element offsets', 'v0.7.1', '9 Oct 2026', 'lineage-offset-version'],
        ['Latency benchmarks', 'v0.2', 'MLSys 2025', 'fi-project-lineage-1-result'],
      ];
      rows.forEach(([use, version, date, cue], i) => {
        const y = 395 + i * 200;
        api.text(ctx, use, 180, y, 55, C.ink);
        if (clauseEnded(state, cue, 1, [0.38, 0.66, 0.95][i])) {
          api.text(ctx, version, 1010, y, 68, C.cyan);
          api.text(ctx, date, 1550, y, 41, C.muted, 'center');
        }
      });
    } else {
      const progress = flashCue(state, 'fi-project-lineage-2', 2);
      const read = clauseEnded(state, 'fi-project-lineage-2-result', 2, 0.92);
      api.text(ctx, 'Serving engine', 445, 365, 61, C.blue, 'center');
      api.text(ctx, 'Allocate the pages', 445, 455, 37, C.ink, 'center');
      api.text(ctx, 'Attention kernel', 1435, 365, 61, C.cyan, 'center');
      api.text(ctx, 'Read keys and values', 1435, 455, 37, C.ink, 'center');
      const x = mix(445, 1435, progress);
      api.text(ctx, 'R2 page list', x, 613, 40, C.yellow, 'center');
      requests[2].pages.forEach((page, i) => {
        tile(api, String(page), x - 223 + i * 155, 663, 138, 109, C.yellow, C.yellow, 58);
      });
      if (read) api.text(ctx, 'Key 5  →  page 14, slot 1', 1435, 894, 42, C.cyan, 'center');
    }
  });
}

export default {
  id: 'project-lineage',
  draw: drawProjectLineage,
  cues: [
    'fi-project-lineage-0',
    'fi-project-lineage-0-result',
    'fi-project-lineage-1',
    'lineage-offset-version',
    'fi-project-lineage-1-result',
    'fi-project-lineage-2',
    'fi-project-lineage-2-result',
  ],
};
