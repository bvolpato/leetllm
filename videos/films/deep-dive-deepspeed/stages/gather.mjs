import { sampleModel } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawGather(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    modelState = sampleModel('gather', state),
    currentBeat = modelState.b;
  {
    drawOriginalText(
      ctx,
      api,
      modelState.firstAllocated
        ? 'One rank · separate allocations coexist'
        : 'One rank · full layer view required',
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    const labels = [
      'Resident shard elements',
      modelState.firstAllocated ? 'Full layer 0 buffer' : 'Required layer 0 view',
      'Prefetched layer 1 buffer',
    ];
    [8, modelState.firstAllocated ? 8 : 0, modelState.nextAllocated ? 8 : 0].forEach((n, i) => {
      const y = 375 + i * 160;
      drawOriginalText(
        ctx,
        api,
        labels[i],
        150,
        y + 55,
        29,
        i === 0 ? themeColors.blue : themeColors.cyan,
      );
      if (!n && i !== 1) return;
      const owners =
        i === 0
          ? Array(8).fill(0)
          : Array.from(
              {
                length: 8,
              },
              (_, j) => Math.floor(j / 2),
            );
      const copied =
        i === 0
          ? 8
          : i === 1
            ? modelState.firstCopied
            : Math.min(8, Math.floor(modelState.nextProgress * 8));
      const names =
        i === 0
          ? Array.from(
              {
                length: 8,
              },
              (_, j) => `L${Math.floor(j / 2)}p${j % 2}`,
            )
          : Array.from(
              {
                length: 8,
              },
              (_, j) => (j < copied ? `L${i - 1}p${j}` : '…'),
            );
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
      api.focus.target(
        i === 0
          ? 'gather-resident-shards'
          : i === 1
            ? 'gather-full-view'
            : 'gather-prefetched-view',
        () =>
          api.focus.target('gather-names', () =>
            teaching.grid({
              x: 670,
              y,
              width: 1000,
              height: 95,
              rows: 1,
              columns: 8,
              labels: [names],
              fontSize: 25,
              fill: themeColors.panel,
              stroke: themeColors.muted,
              textColor: themeColors.ink,
              highlights: owners.slice(0, copied).map((owner, column) => ({
                row: 0,
                column,
                fill: themeColors.panel,
                stroke: colors[owner],
              })),
            }),
          ),
      );
      const receive =
        i === 1 && currentBeat === 0 && modelState.firstAllocated
          ? modelState.firstProgress
          : i === 2 && currentBeat === 2
            ? modelState.nextProgress
            : 1;
      if (i > 0 && receive < 1) {
        const column = Math.min(7, Math.floor(receive * 8)),
          progress = (receive * 8) % 1,
          x = 732.5 + column * 125;
        const points = [
          {
            x,
            y: y - 48,
          },
          {
            x,
            y,
          },
        ];
        api.path(ctx, points, {
          color: colors[owners[column]],
          width: 3,
        });
        components.particle({
          points: [
            points[0],
            {
              x,
              y: y - 11,
            },
          ],
          progress,
          radius: 8,
          fill: colors[owners[column]],
        });
        if (i === 1 && column < 2)
          drawOriginalText(ctx, api, 'Copy retained local value', 150, 510, 27, themeColors.blue);
      }
    });
    drawOriginalText(
      ctx,
      api,
      'Owner ranks: blue R0 · cyan R1 · pink R2 · yellow R3',
      960,
      845,
      27,
      themeColors.muted,
      'center',
    );
    api.focus.target('gather-storage-total', () =>
      drawOriginalText(
        ctx,
        api,
        `Live parameter storage: ${modelState.resident} + ${modelState.gathered} = ${modelState.total} elements`,
        960,
        920,
        40,
        themeColors.green,
        'center',
      ),
    );
    drawOriginalText(
      ctx,
      api,
      'Storage model excludes activations, gradients and optimizer arrays',
      960,
      1005,
      28,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'gather',
  draw: drawGather,
  cues: [
    'gather-beat-1-focus-1',
    'gather-beat-1-focus-2',
    'gather-layer-zero',
    'gather-local-coexist',
    'ds-gather-b0-s0',
    'ds-gather-b0-s1',
    'ds-gather-b0-s2',
    'ds-gather-b0-s3',
    'gather-beat-2-focus-1',
    'ds-gather-b1-s0',
    'ds-gather-b1-s1',
    'ds-gather-b1-s2',
    'ds-gather-b1-s3',
    'gather-beat-3-focus-1',
    'ds-gather-b2-s0',
    'ds-gather-b2-s1',
    'ds-gather-b2-s2',
    'ds-gather-b2-s3',
  ],
};
