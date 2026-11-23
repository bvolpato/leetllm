import { cueProgress } from '../construction.mjs';
import { REFERENCE_LINES, evaluationState } from '../model.mjs';
import {
  codeBlock,
  focusTarget,
  codeText,
  equation,
  fixtureRows,
  imageFiles,
  panel,
} from '../defaults.mjs';
export function drawEvaluation(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat,
    q = (id, beat = 0, start, end) => cueProgress(state, id, beat, start, end);
  {
    const model = evaluationState(state);
    if (currentBeat < 2) {
      fixtureRows(ctx, api, 160, 340, 1080, model.read, {
        idPrefix: 'eval-row-',
      });
      focusTarget(ctx, api, 'score-counts', () =>
        panel(ctx, api, 1350, 350, 420, 300, themeColors.green, () => {
          codeText(ctx, api, 'Matches so far', 1380, 405, 30, themeColors.green);
          codeText(
            ctx,
            api,
            String(model.result.matches),
            1560,
            520,
            88,
            themeColors.green,
            'center',
          );
          codeText(
            ctx,
            api,
            model.read + (model.read === 1 ? ' row inspected' : ' rows inspected'),
            1560,
            590,
            28,
            themeColors.muted,
            'center',
          );
        }),
      );
      focusTarget(ctx, api, 'gate-receipt', () => {
        if (model.reportVisible)
          equation(
            ctx,
            api,
            '\\frac{2}{3}\\approx0.667',
            700,
            790,
            57,
            themeColors.green,
            'center',
          );
        else
          codeText(
            ctx,
            api,
            'expected.strip().lower()  ==  prediction.strip().lower()',
            700,
            790,
            30,
            themeColors.muted,
            'center',
          );
        if (model.gateVisible)
          equation(ctx, api, '2\\times3=6=3\\times2', 1400, 790, 43, themeColors.yellow, 'center');
      });
      codeBlock(
        ctx,
        api,
        'Standard output',
        model.reportVisible ? REFERENCE_LINES.slice(0, 2) : ['Report pending'],
        160,
        855,
        1610,
        170,
        {
          color: model.reportVisible ? themeColors.green : themeColors.muted,
        },
      );
    } else {
      focusTarget(ctx, api, 'retained-image', () => imageFiles(ctx, api, 140, 335));
      focusTarget(ctx, api, 'container-exit', () => {
        const removed = q('eval-remove', 2);
        components.fade(1 - removed, () =>
          panel(ctx, api, 1080, 335, 690, 300, themeColors.green, () => {
            codeText(
              ctx,
              api,
              model.exited ? 'C1 exited · status 0' : 'C1 running',
              1110,
              405,
              37,
              themeColors.green,
            );
            codeText(ctx, api, 'Report sent to standard output', 1110, 500, 29, themeColors.ink);
            codeText(ctx, api, '--rm', 1110, 565, 29, themeColors.yellow, 'left', 'mono');
          }),
        );
        if (removed > 0 && removed < 1)
          codeText(ctx, api, 'Removing C1', 1110, 680, 29, themeColors.muted);
        if (model.removed) {
          codeText(ctx, api, 'C1 removed', 1110, 440, 39, themeColors.muted);
          codeText(ctx, api, 'Writable layer discarded', 1110, 530, 30, themeColors.muted);
        }
      });
      codeBlock(
        ctx,
        api,
        'The retained report',
        [
          REFERENCE_LINES[0],
          REFERENCE_LINES[1].split(': ')[0] + ':',
          REFERENCE_LINES[1].split(': ')[1],
          REFERENCE_LINES[2],
        ],
        1080,
        710,
        690,
        280,
        {
          color: themeColors.green,
        },
      );
    }
  }
}
export default {
  id: 'evaluation',
  draw: drawEvaluation,
  cues: [
    'eval-first',
    'eval-second',
    'eval-third',
    'eval-score',
    'eval-count-gate',
    'eval-exit',
    'eval-remove',
    'eval-retain',
  ],
};
