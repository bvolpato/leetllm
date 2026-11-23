import { lerp, segment } from '../arithmetic.mjs';
import { systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, footer, header } from '../defaults.mjs';
export function drawParallelPlacement(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('parallel-placement', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-parallel-placement-mechanism', () => {
    const mode = currentBeat === 0 ? Math.min(2, Math.floor(progress * 3)) : 0;
    header(
      ctx,
      api,
      currentBeat === 0
        ? [
            'Tensor parallel: divide one layer by columns',
            'Pipeline parallel: successive layers stay on their stages',
            'Expert parallel: route only to the selected expert',
          ][mode]
        : currentBeat === 1
          ? 'Place the layer’s exchange on a physical link'
          : 'The scheduler places workers; it does not choose their model shards',
    );
    const owners = mode === 1 ? ['GPU 0 · layer 1', 'GPU 1 · layer 2'] : ['GPU 0', 'GPU 1'];
    owners.forEach((owner, i) =>
      chapterCard(
        ctx,
        api,
        owner,
        180 + i * 900,
        365,
        660,
        i ? themeColors.cyan : themeColors.blue,
        85,
        34,
      ),
    );
    if (mode === 0) {
      for (let rank = 0; rank < 2; rank++) {
        const x = 180 + rank * 900,
          labels = Array.from(
            {
              length: 4,
            },
            (_, row) =>
              Array.from(
                {
                  length: 2,
                },
                (_, col) => 'W' + row + (2 * rank + col),
              ),
          );
        api.teaching.grid({
          x,
          y: 510,
          width: 660,
          height: 270,
          rows: 4,
          columns: 2,
          labels,
          fontSize: 27,
          fill: themeColors.panel,
          stroke: rank ? themeColors.cyan : themeColors.blue,
          textColor: themeColors.ink,
        });
        chapterText(
          ctx,
          api,
          'Same layer W · columns ' + (rank ? '2 and 3' : '0 and 1'),
          x + 330,
          835,
          28,
          rank ? themeColors.cyan : themeColors.blue,
          'center',
        );
      }
    } else if (mode === 1) {
      for (let rank = 0; rank < 2; rank++) {
        const x = 180 + rank * 900;
        api.teaching.grid({
          x,
          y: 510,
          width: 660,
          height: 270,
          rows: 4,
          columns: 4,
          labels: Array.from(
            {
              length: 4,
            },
            (_, r) =>
              Array.from(
                {
                  length: 4,
                },
                (_, col) => (rank ? 'V' : 'W') + r + col,
              ),
          ),
          fontSize: 25,
          fill: themeColors.panel,
          stroke: rank ? themeColors.cyan : themeColors.blue,
          textColor: themeColors.ink,
        });
      }
      chapterCard(ctx, api, 'Activation', 870, 650, 150, themeColors.yellow, 75, 23);
      chapterText(
        ctx,
        api,
        'Layer 1 output becomes layer 2 input',
        960,
        900,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      for (let rank = 0; rank < 2; rank++)
        for (let e = 0; e < 2; e++) {
          const expert = rank * 2 + e,
            selected = expert === 3;
          chapterCard(
            ctx,
            api,
            'Expert ' + expert + (selected ? ' · SELECTED' : ''),
            210 + rank * 900,
            530 + e * 170,
            600,
            selected ? themeColors.yellow : themeColors.muted,
            110,
            30,
          );
        }
      chapterCard(ctx, api, 'Token T0', 870, 535, 150, themeColors.yellow, 75, 25);
      chapterText(
        ctx,
        api,
        'Supplied route: T0 → expert 3; other experts stay idle for this token',
        960,
        920,
        29,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 1) {
      const link = ['NVLink', 'PCIe', 'inter-node network'][Math.min(2, Math.floor(progress * 3))];
      chapterCard(
        ctx,
        api,
        'Partial',
        lerp(850, 920, segment((progress * 3) % 1, 0.05, 0.9)),
        425,
        150,
        themeColors.yellow,
        65,
        23,
      );
      chapterText(
        ctx,
        api,
        link + ' · transfer latency must be measured',
        960,
        925,
        30,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2)
      chapterText(
        ctx,
        api,
        'Slurm or Kubernetes + KubeRay · same logical layer partition underneath',
        960,
        925,
        28,
        themeColors.muted,
        'center',
      );
    footer(
      ctx,
      api,
      'Illustrated ownership, not measured execution · fit and latency remain separate requirements',
    );
  });
}
export default {
  id: 'parallel-placement',
  draw: drawParallelPlacement,
  cues: [
    'sd-parallel-placement-0-operation',
    'sd-parallel-placement-0-result',
    'sd-parallel-placement-1-operation',
    'sd-parallel-placement-1-result',
    'sd-parallel-placement-2-operation',
    'sd-parallel-placement-2-result',
  ],
};
