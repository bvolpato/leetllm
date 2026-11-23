import { phase } from '../arithmetic.mjs';
import { sgBegun } from '../construction.mjs';
import { arrow, box, cells, extensionText, footer, rectangle, title } from '../defaults.mjs';
export function drawParallelAxes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('parallel-axes-mechanism', () => {
    if (currentBeat === 0) {
      const mode = sgBegun(state, 'parallel-expert', false)
        ? 3
        : sgBegun(state, 'parallel-data', false)
          ? 2
          : sgBegun(state, 'parallel-pipeline', false)
            ? 1
            : 0;
      title(
        ctx,
        api,
        [
          'TP: split the same projection dimensions',
          'PP: move activation between layer ranges',
          'DP: assign different requests to complete replicas',
          'EP: route token work to selected experts',
        ][mode],
      );
      if (mode === 0) {
        extensionText(
          ctx,
          api,
          'One projection matrix',
          960,
          365,
          31,
          themeColors.yellow,
          'center',
        );
        for (let r = 0; r < 4; r++)
          for (let col = 0; col < 8; col++)
            rectangle(
              ctx,
              api,
              500 + col * 115,
              430 + r * 85,
              108,
              78,
              themeColors.panel,
              col < 4 ? themeColors.blue : themeColors.pink,
              3,
            );
        extensionText(ctx, api, 'GPU0 columns', 730, 855, 35, themeColors.blue, 'center');
        extensionText(ctx, api, 'GPU1 columns', 1190, 855, 35, themeColors.pink, 'center');
        arrow(ctx, api, 960, 395, 960, 410, themeColors.cyan);
        extensionText(
          ctx,
          api,
          'Per-layer collective joins the required partial results',
          960,
          950,
          31,
          themeColors.cyan,
          'center',
        );
      } else if (mode === 1) {
        cells(ctx, api, ['L0', 'L1', 'L2', 'L3'], 220, 480, 660, 110, themeColors.blue);
        cells(ctx, api, ['L4', 'L5', 'L6', 'L7'], 1050, 480, 660, 110, themeColors.pink);
        arrow(ctx, api, 900, 535, 1030, 535, themeColors.cyan);
        box(ctx, api, 'same R42 activation', 715, 695, 500, 85, themeColors.cyan, 31);
        extensionText(ctx, api, 'stage0', 540, 385, 35, themeColors.blue, 'center');
        extensionText(ctx, api, 'stage1', 1370, 385, 35, themeColors.pink, 'center');
        extensionText(
          ctx,
          api,
          'Stage transfer and fill / drain bubbles enter the path',
          960,
          920,
          34,
          themeColors.yellow,
          'center',
        );
      } else if (mode === 2) {
        [
          ['R42', 260, themeColors.blue],
          ['R43', 1120, themeColors.pink],
        ].forEach(([r, x, color]) => {
          box(ctx, api, r, x + 180, 365, 240, 80, color);
          arrow(ctx, api, x + 300, 470, x + 300, 540, color);
          cells(ctx, api, ['L0', 'L1', 'L2', 'L3'], x, 570, 600, 110, color);
          box(ctx, api, 'own prefix cache', x, 770, 600, 85, color);
        });
        extensionText(
          ctx,
          api,
          'Independent requests · replicated full-model state',
          960,
          950,
          33,
          themeColors.yellow,
          'center',
        );
      } else {
        cells(
          ctx,
          api,
          ['token A', 'token B', 'token C', 'token D'],
          500,
          345,
          920,
          85,
          themeColors.cyan,
        );
        box(ctx, api, 'expert E0', 260, 680, 630, 125, themeColors.blue, 37);
        box(ctx, api, 'expert E1', 1060, 680, 630, 125, themeColors.pink, 37);
        [0, 2, 3].forEach((i) => arrow(ctx, api, 610 + i * 230, 455, 570, 660, themeColors.blue));
        arrow(ctx, api, 840, 455, 1370, 660, themeColors.pink);
        extensionText(ctx, api, '3 routed here', 575, 875, 34, themeColors.blue, 'center');
        extensionText(ctx, api, '1 routed here', 1375, 875, 34, themeColors.pink, 'center');
        extensionText(
          ctx,
          api,
          'Illustrative routing · all-to-all bytes and imbalance need measurement',
          960,
          960,
          29,
          themeColors.yellow,
          'center',
        );
      }
    } else {
      title(ctx, api, 'DP attention is not a full-model replica boundary');
      box(ctx, api, 'request group A\nattention replica 0', 200, 380, 630, 150, themeColors.blue);
      box(ctx, api, 'request group B\nattention replica 1', 1080, 380, 630, 150, themeColors.pink);
      arrow(ctx, api, 515, 550, 760, 690, themeColors.blue);
      arrow(ctx, api, 1395, 550, 1160, 690, themeColors.pink);
      box(ctx, api, 'other model parts remain sharded', 460, 715, 1000, 110, themeColors.cyan);
      extensionText(
        ctx,
        api,
        'Context / sequence layouts and fabric constrain the actual split',
        960,
        940,
        31,
        themeColors.yellow,
        'center',
      );
    }
    footer(ctx, api, 'Fitting weights does not establish acceptable inter-token latency');
  });
}
export default {
  id: 'parallel-axes',
  draw: drawParallelAxes,
  cues: [
    'sg-parallel-axes-beat-0',
    'sg-parallel-pipeline',
    'sg-parallel-data',
    'sg-parallel-expert',
    'sg-parallel-axes-beat-1',
  ],
};
