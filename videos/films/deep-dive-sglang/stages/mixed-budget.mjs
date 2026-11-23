import { phase } from '../arithmetic.mjs';
import { sgBegun, sgComplete, sgProgress } from '../construction.mjs';
import { budgetStep } from '../model.mjs';
import { box, cells, extensionText, footer, title } from '../defaults.mjs';
export function drawMixedBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('mixed-budget-mechanism', () => {
    const step =
        currentBeat === 0
          ? budgetStep({
              decode: 1,
              unmatched: 9,
              budget: 6,
            })
          : budgetStep({
              decode: 1,
              unmatched: 4,
              budget: 6,
            }),
      five = sgProgress(state, 'budget-five', q),
      second = currentBeat > 1 || (currentBeat === 1 && sgBegun(state, 'budget-second', q > 0.1)),
      selected =
        currentBeat > 1 || (currentBeat === 1 && sgBegun(state, 'budget-selected', q > 0.5)),
      next = currentBeat > 1 || (currentBeat === 1 && sgBegun(state, 'budget-next', q > 0.8));
    title(ctx, api, 'Six fresh input positions · shared KV already exists');
    extensionText(ctx, api, 'R1 compatible cached prefix', 190, 350, 29, themeColors.cyan);
    cells(ctx, api, ['A', 'B', 'C', 'D'], 760, 310, 910, 70, themeColors.cyan);
    extensionText(
      ctx,
      api,
      'Scheduled step ' + (second ? '1' : '0'),
      190,
      520,
      31,
      themeColors.yellow,
    );
    const alloc = second
      ? ['R0', 'p5', 'p6', 'p7', 'p8', 'idle']
      : ['R0', 'p0', 'p1', 'p2', 'p3', 'p4'];
    cells(
      ctx,
      api,
      alloc,
      620,
      470,
      1100,
      100,
      themeColors.green,
      second ? 6 : 1 + Math.floor(five * 5),
    );
    const totalReady = second
      ? currentBeat > 1 || sgComplete(state, 'budget-second')
      : currentBeat > 0 || sgComplete(state, 'budget-five');
    extensionText(
      ctx,
      api,
      totalReady
        ? second
          ? '1 decode + 4 prompt = 5 inputs'
          : '1 decode + 5 prompt = 6 inputs'
        : 'Scheduled input total pending',
      960,
      650,
      36,
      totalReady ? themeColors.green : themeColors.muted,
      'center',
    );
    extensionText(ctx, api, 'R1 unmatched prompt positions', 190, 755, 29, themeColors.muted);
    cells(
      ctx,
      api,
      Array.from(
        {
          length: 9,
        },
        (_, i) => 'p' + i,
      ),
      700,
      710,
      1020,
      70,
      themeColors.blue,
      second ? 9 : Math.floor(five * 5),
    );
    if (selected)
      box(
        ctx,
        api,
        next ? 'out0 consumed → its KV now exists' : 'out0 selected → KV still pending',
        500,
        855,
        1120,
        85,
        next ? themeColors.green : themeColors.yellow,
      );
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'General rule: chunk = min(unmatched, budget − scheduled decode inputs)'
        : 'Selected output count and processed input positions remain distinct',
    );
  });
}
export default {
  id: 'mixed-budget',
  draw: drawMixedBudget,
  cues: [
    'sg-mixed-budget-beat-0',
    'sg-budget-five',
    'sg-mixed-budget-beat-1',
    'sg-budget-second',
    'sg-budget-selected',
    'sg-budget-next',
    'sg-mixed-budget-beat-2',
  ],
};
