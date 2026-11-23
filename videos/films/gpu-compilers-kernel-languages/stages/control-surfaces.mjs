import {
  arrow,
  box,
  codeText,
  detailText,
  focusTarget,
  footer,
  line,
  visible,
} from '../defaults.mjs';
export function drawControlSurfaces(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0)
      focusTarget(ctx, api, 'control-geometry', () => {
        detailText(
          ctx,
          api,
          'One 16-value tile · compare who owns the mapping',
          150,
          290,
          31,
          themeColors.yellow,
        );
        const x0 = 180,
          y0 = 385;
        for (let r = 0; r < 4; r++)
          for (let col = 0; col < 4; col++) {
            box(ctx, api, x0 + col * 150, y0 + r * 105, 130, 85, themeColors.cyan);
            if (visible(ctx, api, 'thread-addresses'))
              detailText(
                ctx,
                api,
                `t${r * 4 + col}`,
                x0 + col * 150 + 65,
                y0 + r * 105 + 54,
                27,
                themeColors.cyan,
                'center',
              );
          }
        detailText(ctx, api, 'CUDA: explicit thread addresses', 150, 900, 29, themeColors.cyan);
        if (visible(ctx, api, 'cute-layout')) {
          detailText(ctx, api, 'CuTe: a hierarchical layout', 1110, 355, 31, themeColors.green);
          for (let r = 0; r < 4; r++)
            for (let col = 0; col < 4; col++) {
              const x = 1030 + col * 160,
                y = 410 + r * 100;
              box(ctx, api, x, y, 145, 85, themeColors.green);
              detailText(ctx, api, r * 4 + col, x + 72, y + 53, 27, themeColors.green, 'center');
            }
          for (let r = 0; r < 2; r++)
            for (let col = 0; col < 2; col++)
              api.rect(
                ctx,
                1024 + col * 320,
                404 + r * 200,
                312,
                191,
                null,
                themeColors.yellow,
                3,
                6,
              );
          detailText(
            ctx,
            api,
            '2 × 2 groups of 2 × 2 elements',
            1020,
            895,
            26,
            themeColors.yellow,
          );
        }
      });
    else if (currentBeat === 1) {
      focusTarget(ctx, api, 'control-geometry', () => {
        detailText(
          ctx,
          api,
          'Collective block owns an immutable 4×4 tile',
          150,
          300,
          32,
          themeColors.yellow,
        );
        if (visible(ctx, api, 'tile-collective')) {
          teaching.grid({
            x: 170,
            y: 390,
            width: 650,
            height: 420,
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
                  (_, c) => String(r * 4 + c),
                ),
            ),
            fill: themeColors.panel,
            stroke: themeColors.cyan,
            fontSize: 29,
            textColor: themeColors.cyan,
          });
          arrow(ctx, api, 860, 600, 1050, 600, themeColors.cyan);
          teaching.grid({
            x: 1110,
            y: 390,
            width: 560,
            height: 420,
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
                  (_, c) => String(r * 4 + c + 1),
                ),
            ),
            fill: themeColors.panel,
            stroke: themeColors.green,
            fontSize: 29,
            textColor: themeColors.green,
          });
          detailText(ctx, api, 'new tile after +1', 1390, 875, 29, themeColors.green, 'center');
        }
      });
      focusTarget(ctx, api, 'control-version', () => {
        if (visible(ctx, api, 'tile-version'))
          detailText(
            ctx,
            api,
            'CUDA Tile C++ requires 13.3+ · installed SIMT build is 13.2',
            960,
            960,
            29,
            themeColors.pink,
            'center',
          );
      });
    } else {
      focusTarget(ctx, api, 'pallas-grid', () => {
        if (visible(ctx, api, 'pallas-grid')) {
          detailText(
            ctx,
            api,
            'Pallas: grid + block specs + JAX references',
            150,
            290,
            31,
            themeColors.cyan,
          );
          for (let i = 0; i < 4; i++) {
            const x = 180 + i * 360,
              r = Math.floor(i / 2) * 2,
              col = (i % 2) * 2;
            box(ctx, api, x, 340, 310, 130, themeColors.cyan);
            detailText(ctx, api, 'program ' + i, x + 155, 390, 27, themeColors.cyan, 'center');
            codeText(
              ctx,
              api,
              '[' + r + ':' + (r + 2) + ', ' + col + ':' + (col + 2) + ']',
              x + 45,
              442,
              26,
            );
          }
        }
      });
      focusTarget(ctx, api, 'neuron-movement', () => {
        const moved = visible(ctx, api, 'neuron-move'),
          stored = visible(ctx, api, 'neuron-store');
        detailText(
          ctx,
          api,
          'NKI on Neuron · illustrative +1 tile',
          150,
          560,
          32,
          themeColors.yellow,
        );
        const xs = [180, 760, 1340],
          names = ['HBM', 'SBUF', 'NeuronCore engine'];
        names.forEach((v, i) => {
          box(ctx, api, xs[i], 620, 400, 200, i === 1 ? themeColors.green : themeColors.cyan);
          detailText(
            ctx,
            api,
            v,
            xs[i] + 200,
            670,
            30,
            i === 1 ? themeColors.green : themeColors.cyan,
            'center',
          );
          const values =
            i === 0
              ? stored
                ? [3, 5, 7, 9]
                : [2, 4, 6, 8]
              : i === 1 && moved
                ? [2, 4, 6, 8]
                : i === 2 && stored
                  ? [3, 5, 7, 9]
                  : null;
          if (values)
            teaching.grid({
              x: xs[i] + 30,
              y: 710,
              width: 340,
              height: 65,
              rows: 1,
              columns: 4,
              labels: [values.map(String)],
              fill: themeColors.panel,
              stroke: i === 1 ? themeColors.green : themeColors.cyan,
              fontSize: 27,
              textColor: themeColors.ink,
            });
        });
        if (moved) {
          arrow(ctx, api, 610, 670, 730, 670, themeColors.green);
          arrow(ctx, api, 1190, 670, 1310, 670, themeColors.green);
        }
        if (stored) {
          line(ctx, api, 1540, 840, 1540, 900, themeColors.green);
          arrow(ctx, api, 1540, 900, 380, 900, themeColors.green);
          detailText(
            ctx,
            api,
            'store the new tile to HBM',
            960,
            950,
            29,
            themeColors.green,
            'center',
          );
        }
      });
    }
    footer(
      ctx,
      api,
      'Start with a framework or library that meets the workload; validate each actual target.',
    );
  }
}
export default {
  id: 'control-surfaces',
  draw: drawControlSurfaces,
  cues: [
    'thread-addresses',
    'cute-layout',
    'tile-collective',
    'tile-version',
    'pallas-grid',
    'neuron-move',
    'neuron-store',
  ],
};
