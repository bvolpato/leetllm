import { vrBound } from '../arithmetic.mjs';
import {
  drawCell,
  drawEquation,
  drawFooter,
  drawHeading,
  drawLine,
  drawRectangle,
  drawText,
} from '../defaults.mjs';
export function drawNumericParser(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue numeric-parser/' + id);
    return q
      ? q.phase === 'before'
        ? 0
        : q.phase === 'after'
          ? 1
          : vrBound(q.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : vrBound((progress - 0.1) / 0.8);
  };
  const operationProgress = (name, beat = currentBeat) =>
      cueProgress('vr-' + name + '-' + 'numeric-parser', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(ctx, api, 'The literal response is parsed before its value is compared');
    const second = currentBeat >= 1 && operationProgress('duplicate', 1) > 0;
    drawText(
      ctx,
      api,
      second ? 'work… \\boxed{1/2} … \\boxed{3/4}' : 'work… \\boxed{1/2}',
      220,
      415,
      40,
      themeColors.blue,
    );
    const labels = [
      'length ≤ 4096',
      'one marker',
      'balanced braces',
      'field ≤ 64',
      'numeric grammar',
    ];
    labels.forEach((label, i) => {
      const x = 205 + i * 315,
        shown =
          i === 0 || i === 1
            ? operationProgress('markers', 0) > 0
            : operationProgress('balance', 0) > 0;
      if (shown) {
        drawRectangle(
          ctx,
          api,
          x,
          490,
          285,
          90,
          second && i === 1 ? themeColors.pink : themeColors.cyan,
        );
        drawText(
          ctx,
          api,
          label,
          x + 142,
          548,
          26,
          second && i === 1 ? themeColors.pink : themeColors.cyan,
          'center',
        );
        if (i < 4) api.arrow(ctx, x + 285, 535, x + 307, 535, themeColors.muted, 2);
      }
    });
    if (resultComplete('fraction', 0) && !second) {
      drawEquation(ctx, api, String.raw`\frac{1}{2}=\frac{5}{10}`, 700, 735, 62, themeColors.green);
      drawText(ctx, api, 'Exact rational equality', 700, 815, 29, themeColors.green, 'center');
    }
    if (second)
      drawText(
        ctx,
        api,
        '2 markers → candidate reward 0',
        620,
        735,
        39,
        themeColors.pink,
        'center',
      );
    if (currentBeat >= 1 && operationProgress('gold', 1) > 0) {
      drawLine(ctx, api, 1020, 650, 1020, 915, themeColors.muted, 1);
      drawText(ctx, api, 'Separate reference fault', 1395, 665, 25, themeColors.yellow, 'center');
      drawCell(ctx, api, 'trusted gold: 1/0', 1120, 690, 550, 80, themeColors.yellow);
      drawText(ctx, api, 'QUARANTINE before candidate scoring', 1120, 850, 28, themeColors.yellow);
    }
    if (currentBeat === 2 && operationProgress('domains', 2) > 0) {
      drawText(
        ctx,
        api,
        'Symbolic equality also needs domains and assumptions',
        220,
        915,
        29,
        themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'A dedicated final-answer field can replace this toy single-box contract when useful work has other boxes.',
    );
  };
  api.focus.target('numeric-parser-mechanism', paint);
}
export default {
  id: 'numeric-parser',
  draw: drawNumericParser,
  cues: [
    'vr-numeric-parser-b0',
    'vr-markers-numeric-parser',
    'vr-balance-numeric-parser',
    'vr-fraction-numeric-parser',
    'vr-numeric-parser-b1',
    'vr-gold-numeric-parser',
    'vr-duplicate-numeric-parser',
    'vr-numeric-parser-b2',
    'vr-domains-numeric-parser',
  ],
};
