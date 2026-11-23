import {
  cueComplete,
  cueProgress,
  detailPanel,
  detailRectangle,
  detailText,
} from '../defaults.mjs';
import { paymentCase } from '../policy-sheet.mjs';

function drawValidationSplit(ctx, api) {
  const { C } = api;
  const divide = cueProgress(ctx, api, 'default-val');
  const group = cueProgress(ctx, api, 'group-wordings');
  const count = 10;
  const trainingCount = count - Math.floor(count * 0.8);
  const trainX = 125;
  const validationX = 980;
  const thirdX = validationX + (trainX + 2 * 100 - validationX) * group;
  api.focus.target('split-list', () => {
    const heading =
      group > 0
        ? 'Group by approval'
        : divide > 0
          ? 'Default split by list position'
          : '10 requests in list order';
    api.text(ctx, heading, trainX, 272, 52, C.ink);
    if (cueProgress(ctx, api, 'split-rule') && group === 0)
      api.text(
        ctx,
        'Last ~80% for validation (1 to 1,000 requests)',
        1800,
        272,
        33,
        C.muted,
        'right',
      );
    if (divide > 0) {
      api.text(ctx, 'Training', trainX, 366, 41, C.blue);
      api.text(ctx, 'Validation', validationX, 366, 41, C.yellow);
    }
    for (let i = 0; i < count; i++) {
      const startX = trainX + i * 172;
      let splitX = trainX + i * 100;
      if (i === trainingCount) splitX = thirdX;
      if (i > trainingCount) splitX = validationX + (i - trainingCount - group) * 103;
      const x = startX + (splitX - startX) * divide;
      const inTraining = i < trainingCount || (i === trainingCount && group === 1);
      const fill = divide === 0 ? C.ink : inTraining ? C.blue : C.yellow;
      api.rect(ctx, x, 397, 82, 64, fill, undefined, 4);
      api.text(ctx, String(i + 1), x + 41, 444, 39, C.bg, 'center', 'mono');
    }
  });
  api.focus.target('wordings', () => {
    if (!cueProgress(ctx, api, 'split-default')) return;
    const rows = [
      { number: 2, x: trainX, y: 558, question: 'Roll back payment-tests?' },
      {
        number: 3,
        x: validationX + (trainX - validationX) * group,
        y: 747,
        question: 'Undo the payment-tests release?',
      },
    ];
    for (const { number, x, y, question } of rows) {
      api.text(ctx, 'Request ' + number + '    ·    ' + paymentCase.recordId, x, y, 34, C.muted);
      api.text(ctx, question, x, y + 64, 47, C.ink);
    }
  });
  api.focus.target('test-use', () => {
    if (!cueProgress(ctx, api, 'fresh-policies')) return;
    api.text(ctx, 'Final test', trainX, 960, 38, C.cyan);
    api.text(ctx, 'Fresh policy families', 330, 960, 38, C.ink);
    if (cueComplete(ctx, api, 'test-feedback'))
      api.text(ctx, 'Case used to edit the prompt → development', validationX, 960, 34, C.yellow);
  });
}

export function drawSearchConfiguration(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  if (currentBeat === 2) return drawValidationSplit(ctx, api);
  api.focus.target('search-configuration-mechanism', () => {
    if (currentBeat === 0) {
      if (cueProgress(ctx, api, 'demo-zero')) {
        detailText(
          ctx,
          api,
          'Search instructions with the examples fixed',
          960,
          306,
          54,
          themeColors.ink,
        );
        detailText(
          ctx,
          api,
          'New labeled examples: 0     ·     New bootstrapped examples: 0',
          960,
          438,
          40,
          themeColors.cyan,
        );
        detailText(ctx, api, 'Examples in the student', 504, 594, 38, themeColors.muted);
        detailText(ctx, api, 'Examples in the candidate', 1405, 594, 38, themeColors.muted);
        for (const [row, n] of [0, 3].entries()) {
          if (row === 1 && !cueComplete(ctx, api, 'demo-controls')) continue;
          const y = 739 + row * 150;
          detailText(ctx, api, n, 504, y, 76, themeColors.blue);
          api.arrow(ctx, 700, y - 26, 1190, y - 26, themeColors.muted, 3);
          detailText(ctx, api, n, 1405, y, 76, themeColors.cyan);
        }
        return;
      }
      detailText(ctx, api, 'Manual MIPRO configuration', 960, 280, 36, themeColors.blue);
      const names = ['auto = None', 'num_candidates = 4', 'num_trials at compile time'];
      names.forEach((v, i) =>
        detailPanel(
          ctx,
          api,
          v,
          360 + i * 600,
          440,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
          530,
        ),
      );
      if (cueComplete(ctx, api, 'manual-budget'))
        detailText(ctx, api, 'Compile stopped: supply num_trials.', 960, 565, 33, themeColors.pink);
      if (cueProgress(ctx, api, 'model-roles')) {
        detailText(
          ctx,
          api,
          'Propose instructions and run the task with the same model or with two models.',
          960,
          748,
          36,
          themeColors.cyan,
        );
      }
    } else if (currentBeat === 1) {
      const choices = ['A', 'B', 'C'].flatMap((instruction) =>
        [1, 2].map((exampleSet) => instruction + '·' + exampleSet),
      );
      const side = choices.length;
      const trialCells = [15, 0, 31, 20, 7, 28, 10, 24, 4, 17, 32, 21];
      const trialCount = Math.ceil(trialCells.length * cueProgress(ctx, api, 'candidate-trials'));
      const tried = new Set(trialCells.slice(0, trialCount));
      const exampleRow = Math.floor(trialCells[0] / side),
        exampleColumn = trialCells[0] % side;
      const pickingColumn = !trialCount && cueProgress(ctx, api, 'choose-column') > 0;
      const pickingRow = !trialCount && cueProgress(ctx, api, 'choose-row') > 0;
      const picked = !trialCount && cueProgress(ctx, api, 'choose-cell') > 0;
      detailText(
        ctx,
        api,
        'Predictor 1 · instruction A, B or C paired with example set 1 or 2',
        960,
        268,
        36,
        themeColors.blue,
      );
      detailText(ctx, api, 'Predictor 2', 244, 359, 33, themeColors.cyan);
      for (const [col, choice] of choices.entries()) {
        const x = 473 + col * 201;
        detailText(
          ctx,
          api,
          choice,
          x + 74,
          359,
          36,
          pickingColumn && col === exampleColumn ? themeColors.yellow : themeColors.blue,
        );
        detailText(
          ctx,
          api,
          choice,
          250,
          442 + col * 69,
          33,
          pickingRow && col === exampleRow ? themeColors.yellow : themeColors.cyan,
        );
        for (let row = 0; row < side; row++) {
          const selected = tried.has(row * side + col);
          const example = picked && row === exampleRow && col === exampleColumn;
          detailRectangle(
            ctx,
            api,
            x,
            402 + row * 69,
            148,
            50,
            example ? themeColors.yellow : selected ? themeColors.cyan : themeColors.panel,
            themeColors.muted,
          );
        }
      }
      if (cueComplete(ctx, api, 'candidate-six'))
        detailText(
          ctx,
          api,
          '3 instructions × 2 example sets = ' + side + ' choices per predictor',
          960,
          856,
          36,
          themeColors.ink,
        );
      if (cueComplete(ctx, api, 'candidate-grid'))
        detailText(
          ctx,
          api,
          trialCount
            ? trialCount + ' trials in a space of ' + side * side + ' programs'
            : side + ' × ' + side + ' = ' + side * side + ' possible programs',
          960,
          935,
          42,
          themeColors.yellow,
        );
    }
  });
  return;
}
export default {
  id: 'search-configuration',
  draw: drawSearchConfiguration,
  cues: [
    'demo-controls',
    'manual-budget',
    'model-roles',
    'demo-zero',
    'candidate-grid',
    'candidate-six',
    'choose-column',
    'choose-row',
    'choose-cell',
    'candidate-trials',
    'split-default',
    'default-val',
    'split-rule',
    'group-wordings',
    'fresh-policies',
    'test-feedback',
  ],
};
