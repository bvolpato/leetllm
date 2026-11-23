import { drawText, footer, frame, mark, tokenRail } from '../defaults.mjs';
export function drawTelemetrySlices(ctx, scene, state, api) {
  return api.focus.target('telemetry-slices-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    {
      const version = currentBeat > 0,
        rows = version
          ? [
              {
                id: 'v6 / R1',
                read: 6000,
              },
              {
                id: 'v7 / R2',
                read: 6000,
              },
              {
                id: 'v7 / R3',
                read: 600,
              },
            ]
          : [
              {
                id: 'R1',
                read: 6000,
              },
              {
                id: 'R2',
                read: 600,
              },
            ];
      drawText(ctx, api, 'Read-token volume / total input volume', 150, 270, 35);
      rows.forEach((row, i) => {
        const y = 390 + i * 150,
          ready =
            version || i === 0
              ? currentBeat > 0 || cueVisible('yield-large')
              : cueVisible('yield-small');
        drawText(ctx, api, row.id, 150, y + 40, 28, themeColors.muted);
        frame(ctx, api, 400, y, 1000, 65, themeColors.muted);
        if (ready) {
          tokenRail(ctx, api, 400, y, 1000, [row.read, 6048 - row.read], 6048, [
            themeColors.blue,
            themeColors.panel,
          ]);
          drawText(ctx, api, row.read + ' / 6,048', 1460, y + 43, 27, themeColors.blue);
        }
      });
      if (!version)
        mark(ctx, api, 'yield-rule', () => {
          if (cueVisible('yield-rule'))
            drawText(
              ctx,
              api,
              'One hit each · 99.2% versus 9.9% token reuse',
              960,
              875,
              34,
              themeColors.yellow,
              'center',
            );
        });
      if (currentBeat === 1) {
        mark(ctx, api, 'yield-versions', () => {
          if (cueVisible('yield-versions'))
            drawText(
              ctx,
              api,
              'v6: 1 hit / 99.2% · v7: 2 hits / ' + ((6600 / 12096) * 100).toFixed(1) + '%',
              960,
              925,
              34,
              themeColors.yellow,
              'center',
            );
        });
        mark(ctx, api, 'yield-slice', () => {
          if (cueVisible('yield-slice'))
            footer(
              ctx,
              api,
              'Retain route, model, prompt version, verified scope and worker on each row.',
            );
        });
      }
      if (currentBeat === 2) {
        mark(ctx, api, 'yield-phases', () =>
          drawText(
            ctx,
            api,
            'queue → prefill → first token → decode → completion',
            960,
            925,
            32,
            themeColors.cyan,
            'center',
          ),
        );
        mark(ctx, api, 'yield-accounting', () => {
          if (cueVisible('yield-accounting'))
            footer(
              ctx,
              api,
              'Credited reads, physical availability, elapsed time and priced cost are separate evidence.',
            );
        });
      }
    }
  });
}
export default {
  id: 'telemetry-slices',
  draw: drawTelemetrySlices,
  cues: [
    'yield-large',
    'yield-small',
    'yield-rule',
    'yield-versions',
    'yield-slice',
    'yield-phases',
    'yield-accounting',
  ],
};
