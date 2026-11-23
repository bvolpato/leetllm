import { vrBound } from '../arithmetic.mjs';
import { drawCell, drawEquation, drawHeading, drawText } from '../defaults.mjs';
export function drawFormalSql(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = vrBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const q = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared RLVR cue formal-sql/' + id);
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
      cueProgress('vr-' + name + '-' + 'formal-sql', beat),
    resultComplete = (name, beat = currentBeat) => operationProgress(name, beat) >= 1 - 1e-8;
  const paint = () => {
    drawHeading(
      ctx,
      api,
      currentBeat < 2
        ? 'Audit the intended theorem and its dependency set'
        : 'Compare returned row multiplicities',
    );
    if (currentBeat < 2) {
      drawCell(ctx, api, 'Trusted theorem + imports', 200, 390, 650, 85, themeColors.blue);
      api.arrow(ctx, 850, 432, 1000, 432, themeColors.muted, 3);
      drawCell(ctx, api, 'Example proof record', 1020, 390, 700, 85, themeColors.yellow);
      const axioms = [
        'Classical.choice',
        'propext',
        'Quot.sound',
        ...(operationProgress('axiom', 0) > 0 ? ['sorryAx'] : []),
      ];
      axioms.forEach((v, i) => {
        const bad = v === 'sorryAx';
        drawCell(
          ctx,
          api,
          v,
          1030,
          530 + i * 88,
          650,
          65,
          bad ? themeColors.pink : themeColors.green,
          29,
        );
      });
      if (resultComplete('axiom', 0))
        drawText(ctx, api, 'unapproved dependency → REJECT', 210, 680, 31, themeColors.pink);
      if (operationProgress('compile', 1) > 0)
        drawText(
          ctx,
          api,
          'Exit 0 · unapproved axiom found',
          210,
          805,
          30,
          themeColors.yellow,
        );
    } else {
      const left = [
          ['A', 7],
          ['A', 7],
        ],
        right = [['A', 7]];
      left.forEach((r, i) =>
        drawCell(ctx, api, 'A  |  7', 240, 460 + i * 115, 470, 80, themeColors.blue),
      );
      right.forEach((r, i) =>
        drawCell(ctx, api, 'A  |  7', 1130, 460 + i * 115, 470, 80, themeColors.cyan),
      );
      drawText(ctx, api, 'query output: 2 rows', 475, 390, 31, themeColors.blue, 'center');
      drawText(ctx, api, 'expected: 1 row', 1365, 390, 31, themeColors.cyan, 'center');
      if (resultComplete('multiset', 2)) {
        drawEquation(ctx, api, '2\\ne1', 960, 775, 58, themeColors.pink);
        drawText(
          ctx,
          api,
          'Duplicate-preserving comparison rejects',
          960,
          860,
          32,
          themeColors.pink,
          'center',
        );
      }
      if (operationProgress('order', 2) > 0)
        drawText(
          ctx,
          api,
          'No ORDER BY: no promised row order or tie order',
          960,
          940,
          27,
          themeColors.yellow,
          'center',
        );
    }
  };
  api.focus.target('formal-sql-mechanism', paint);
}
export default {
  id: 'formal-sql',
  draw: drawFormalSql,
  cues: [
    'vr-formal-sql-b0',
    'vr-owned-formal-sql',
    'vr-axiom-formal-sql',
    'vr-formal-sql-b1',
    'vr-compile-formal-sql',
    'vr-formal-sql-b2',
    'vr-multiset-formal-sql',
    'vr-order-formal-sql',
  ],
};
