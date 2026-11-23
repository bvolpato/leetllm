import { bottomEdge } from '../fixtures.mjs';
import { cooperativeCell } from '../model.mjs';
import { finished, label, operandPairs, outputOwners, progress, runningSum } from '../workbench.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const { a, b, row, col } = bottomEdge;
  const groups = finished(state, 1, 'fresh-panels');
  const copies = finished(state, 1, 'keep-bottom');
  const filled = finished(state, 1, 'tail-zero');
  const count = [[2, 'panel-one'], [2, 'panel-two'], [3, 'panel-three']]
    .filter(([beat, cue]) => finished(state, beat, cue)).length;
  const visiblePanels = [[2, 'first-products'], [2, 'next-products'], [3, 'panel-three']]
    .filter(([beat, cue]) => progress(state, beat, cue) > 0).length;
  const trace = cooperativeCell(bottomEdge);
  const products = trace.steps.slice(0, 2 * visiblePanels).map((step) => step.product);
  api.focus.target('bottom-pairs', () => {
    label(ctx, api, 'Bottom edge · C has one row and two columns', 960, 227, 35, api.C.ink);
    outputOwners(ctx, api, a.length, b[0].length);
    operandPairs(ctx, api, {
      a: a[row], b: b.map((r) => r[col]), row, col,
      active: copies ? [1, 3] : [], operand: 'B', products, grouping: groups,
    });
    if (!groups) label(ctx, api, '2 positions per panel · How many panels cover those five positions?', 1160, 780, 32, api.C.ink);
    let verdict = 'Top-right running sum';
    if (progress(state, 0, 'bottom-question') > 0) verdict = 'T11 handles the second B row in each panel';
    if (copies) verdict = 'T11 supplies its neighbor';
    if (count > 0) verdict = `Running sum   ${trace.panels.slice(0, count).map((p) => p.sum).join(' → ')}`;
    runningSum(ctx, api, 'C[0,1]', trace.panels[count - 1]?.sum ?? 0, verdict);
  });
  if (copies) {
    const fullPanels = trace.panels.filter((panel) => panel.start + 1 < b.length);
    const loads = fullPanels.map(({ right }) => right[1][col]);
    const tail = filled ? '     Final panel → zero in the shared slot' : '';
    label(ctx, api, `T11 loads ${loads.join(' and ')} for T01${tail}`, 960, 1003, 32, api.C.pink);
  }
}
export default { id: 'transfer', draw: drawTransfer, cues: ['bottom-question', 'fresh-panels', 'keep-bottom', 'tail-zero',
  'first-products', 'panel-one', 'next-products', 'panel-two', 'panel-three'] };
