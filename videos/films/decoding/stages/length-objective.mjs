import { decodeLengthScore } from '../arithmetic.mjs';
import { coreBox, coreFoot, coreText, coreTitle, coreVector } from '../defaults.mjs';
export function drawLengthObjective(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-length-objective-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-length-objective-mechanism', () => {
    coreTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Each added log probability is at most zero'
        : 'Build the denominator before comparing normalized scores',
    );
    if (currentBeat === 0) {
      coreVector(ctx, api, [-1, -1.08], ['Completed S', 'Completed L'], 400, 440, 1120);
      coreText(ctx, api, 'Extension: add log p ≤ 0', 960, 680, 43, themeColors.cyan);
      api.arrow(ctx, 960, 720, 960, 850, themeColors.cyan, 4);
      coreText(
        ctx,
        api,
        'Raw score cannot rise along this same prefix',
        960,
        930,
        31,
        themeColors.yellow,
      );
    } else {
      const logs = [-1, -1.08],
        lengths = [2, 5];
      logs.forEach((log, i) => {
        const y = 390 + i * 225,
          den = Math.pow((5 + lengths[i]) / 6, 0.6);
        coreText(ctx, api, ['S', 'L'][i], 175, y + 40, 39, themeColors.blue);
        coreBox(ctx, api, `log P = ${log}`, 300, y, 420, 90, themeColors.blue);
        api.rect(ctx, 800, y, 530, 90, themeColors.panel, themeColors.cyan, 8);
        api.math(
          ctx,
          `\\left(\\frac{5+${lengths[i]}}{6}\\right)^{0.6}`,
          1065,
          y + 55,
          37,
          themeColors.cyan,
          'center',
        );
        coreBox(
          ctx,
          api,
          currentBeat === 2 && done('length-scores')
            ? decodeLengthScore(log, lengths[i], 0.6).toFixed(4)
            : 'normalized ?',
          1410,
          y,
          350,
          90,
          themeColors.yellow,
        );
        coreText(ctx, api, 'denominator ' + den.toFixed(4), 1060, y + 150, 30, themeColors.cyan);
      });
      if (currentBeat === 2 && done('length-scores'))
        coreText(
          ctx,
          api,
          'L wins this declared normalized objective',
          960,
          950,
          35,
          themeColors.green,
        );
    }
    coreFoot(
      ctx,
      api,
      'Length excludes EOS in these supplied examples. Alpha zero restores raw scoring.',
    );
    return;
  });
}
export default {
  id: 'length-objective',
  draw: drawLengthObjective,
  cues: [
    'dec-length-objective-1',
    'dec-length-objective-2',
    'dec-length-objective-3',
    'dec-length-scores',
  ],
};
