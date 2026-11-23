import { copyFrame } from '../model.mjs';
import { arrow, box, code, footer, mark, text } from '../defaults.mjs';
export function drawCopies(ctx, scene, state, api) {
  const modelState = copyFrame(state),
    currentBeat = modelState.step;
  const paintRow = (x, id, value, color) => {
    const shape = box(ctx, api, x, 695, 580, 145, color);
    text(ctx, api, 'dictionary ' + id + ' · expected: blocked', x + 22, 738, 27, api.C.ink);
    text(ctx, api, 'prediction: "' + value + '"', x + 22, 799, 30, color, 'left', true);
    return shape;
  };
  mark(api, 'reference-graph', () => {
    const left = box(ctx, api, 230, 355, 450, 85, api.C.blue);
    text(ctx, api, 'baseline', 455, 409, 32, api.C.blue, 'center');
    const right = box(ctx, api, 1240, 355, 450, 85, api.C.cyan);
    text(ctx, api, 'trial', 1465, 409, 32, api.C.cyan, 'center');
    const first = box(ctx, api, 480, 520, 480, 80, api.C.blue);
    text(ctx, api, 'list L1 · slot 0', 720, 574, 32, api.C.blue, 'center');
    const second =
      currentBeat > 0 && modelState.copied === 1
        ? box(ctx, api, 1120, 520, 480, 80, api.C.cyan)
        : first;
    if (second !== first) text(ctx, api, 'list L2 · slot 0', 1360, 574, 30, api.C.cyan, 'center');
    const rowA = mark(api, 'shared-row', () =>
      paintRow(450, 'R1', modelState.baselinePrediction, api.C.blue),
    );
    const rowB = modelState.rowCopied
      ? mark(api, 'owned-row', () => paintRow(1160, 'R2', modelState.trialPrediction, api.C.cyan))
      : null;
    arrow(ctx, api, left, first, api.C.blue);
    arrow(ctx, api, first, rowA, api.C.blue);
    if (modelState.copied === 1) {
      arrow(ctx, api, right, second, api.C.cyan);
      if (second !== first) arrow(ctx, api, second, rowB ?? rowA, api.C.cyan);
    }
  });
  text(
    ctx,
    api,
    modelState.copied < 1
      ? 'Fresh reset · baseline prediction = escalated'
      : 'Fresh baseline for this experiment',
    960,
    215,
    28,
    modelState.copied < 1 ? api.C.yellow : api.C.muted,
    'center',
  );
  const statement = [
    'trial = baseline',
    'trial = baseline.copy()',
    'trial = [row.copy() for row in baseline]',
  ][currentBeat];
  mark(api, 'copy-code', () =>
    code(ctx, api, [statement, 'trial[0]["prediction"] = "blocked"'], 270, 270, 34, 650, -1),
  );
  footer(
    ctx,
    api,
    currentBeat === 2
      ? 'Fresh normalized one-row baseline. Strings are immutable; nested objects require their own copies.'
      : 'Fresh normalized one-row baseline for each experiment.',
  );
}
export default {
  id: 'copies',
  draw: drawCopies,
  cues: ['alias-list', 'mutate-alias', 'copy-list', 'mutate-shallow', 'copy-rows', 'mutate-owned'],
};
