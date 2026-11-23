import { visionBound, visionCueProgress, visionCueStarted } from '../construction.mjs';
import { arrow, card, detailText, footer, line, patchGrid, title } from '../defaults.mjs';
export function drawDenseFeatureLearning(ctx, scene, state, api) {
  api.focus.target('dense-feature-learning-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = visionBound(state.beatP ?? 0);
    const q = (name, fallback = progress) => visionCueProgress(state.cues, name, fallback);
    {
      if (currentBeat === 0) {
        title(ctx, api, 'Masked student predicts an unmasked EMA teacher feature target');
        patchGrid(ctx, api, 4, 4, 220, 380, 380, 380, 10);
        api.rect(ctx, 410, 570, 93, 93, themeColors.muted, undefined, 0);
        patchGrid(ctx, api, 4, 4, 1170, 380, 380, 380, 10, themeColors.cyan);
        arrow(ctx, api, 1110, 840, 720, 840, themeColors.green);
        card(
          ctx,
          api,
          'teacher feature distribution target',
          600,
          890,
          980,
          80,
          themeColors.green,
          30,
        );
        detailText(ctx, api, 'student: patch hidden', 410, 330, 30, themeColors.blue, 'center');
        detailText(ctx, api, 'teacher: patch visible', 1360, 330, 30, themeColors.cyan, 'center');
        footer(
          ctx,
          api,
          'The feature tensor needs a trained task readout for depth or segmentation',
        );
      } else if (currentBeat === 1 || currentBeat === 2) {
        title(ctx, api, 'Two patch features of length one');
        const angle = currentBeat === 2 ? Math.PI / 2 : (q('gram-rotate') * Math.PI) / 2;
        const answered = currentBeat === 2 && visionCueStarted(state.cues, 'gram-product', true);
        const showMatrix =
          currentBeat === 2 && visionCueStarted(state.cues, 'gram-matrix', progress >= 0.36);
        [520, 1370].forEach((x, i) => {
          detailText(
            ctx,
            api,
            i ? 'Student' : 'Teacher reference',
            x,
            357,
            38,
            themeColors.ink,
            'center',
          );
          line(ctx, api, x - 180, 590, x + 180, 590);
          line(ctx, api, x, 410, x, 770);
          const a = i ? angle : 0;
          const v = [Math.cos(a), Math.sin(a)];
          const w = [-v[1], v[0]];
          const dot = (u, z) => Math.round(u[0] * z[0] + u[1] * z[1]);
          arrow(ctx, api, x, 590, x + 150 * v[0], 590 - 150 * v[1], themeColors.cyan);
          arrow(ctx, api, x, 590, x + 150 * w[0], 590 - 150 * w[1], themeColors.pink);
          if (showMatrix) {
            api.components.matrix({
              values: [
                [dot(v, v), dot(v, w)],
                [dot(w, v), dot(w, w)],
              ],
              x: x - 71,
              y: 801,
              cellSize: 68,
              gap: 6,
              style: {
                fill: themeColors.panel,
                stroke: themeColors.green,
                textColor: themeColors.ink,
                fontSize: 33,
              },
            });
          } else {
            const visible = !i || answered;
            card(
              ctx,
              api,
              'Dot product   ' + (visible ? dot(v, w) : '?'),
              x - 240,
              850,
              480,
              85,
              visible ? themeColors.green : themeColors.yellow,
              36,
            );
          }
        });
        if (showMatrix) footer(ctx, api, 'Gram matrix · one dot product for each pair of features');
      } else {
        title(ctx, api, 'Count encoder slots and actual selected bridge states separately');
        patchGrid(ctx, api, 14, 14, 220, 400, 560, 420, 0);
        card(ctx, api, 'CLS', 930, 410, 180, 80, themeColors.yellow);
        for (let i = 0; i < 4; i++)
          card(ctx, api, 'R' + i, 930 + i * 195, 580, 160, 80, themeColors.pink, 30);
        detailText(
          ctx,
          api,
          '196 patches + 1 class + 4 registers = 201',
          960,
          870,
          34,
          themeColors.ink,
          'center',
        );
        if (currentBeat === 4)
          card(
            ctx,
            api,
            'patch-only token-wise bridge: 196 outputs',
            580,
            900,
            1160,
            80,
            themeColors.green,
            31,
          );
        if (currentBeat === 3)
          footer(ctx, api, 'Registers give the encoder extra slots for internal calculations');
      }
    }
    return true;
  });
}
export default {
  id: 'dense-feature-learning',
  draw: drawDenseFeatureLearning,
  cues: [
    'dense-feature-learning-beat-0',
    'dense-feature-learning-beat-1',
    'gram-rotate',
    'gram-product',
    'gram-matrix',
    'dense-feature-learning-beat-2',
    'dense-feature-learning-beat-3',
  ],
};
