import { splitPlan } from '../model.mjs';
import { complete, started } from '../policy-sheet.mjs';
import { text } from '../defaults.mjs';

export function drawDataSplits(ctx, scene, state, api) {
  const { C } = api;
  const copy = splitPlan.rejected[0];
  const incoming = started(state, 'new-request');
  const conflict = complete(state, 'group-policy-family');
  api.focus.target('split-families', () => {
    const splits = [
      ['Training', 'train', 'Build examples', C.blue],
      ['Development', 'development', 'Choose a prompt', C.yellow],
      ['Private test', 'test', 'Evaluate the frozen choice', C.cyan],
    ];
    splits.forEach(([name, key, role, color], i) => {
      const x = 120 + i * 598;
      text(ctx, api, name, x, 284, 49, color);
      text(ctx, api, role, x, 350, 32, C.ink);
      api.line(ctx, x, 395, x + 485, 395, color, 3);
      text(ctx, api, splitPlan.families[key][0], x, 482, 44, C.ink);
      splitPlan.records[key].forEach((id, j) => text(ctx, api, id, x, 565 + j * 66, 38, color));
    });
  });
  api.focus.target('test-copy', () => {
    if (incoming) {
      const status = conflict ? 'Rejected: ' : 'Proposed: ';
      text(ctx, api, status + copy.id, 1316, 735, 36, conflict ? C.pink : C.yellow);
      text(ctx, api, 'Family   ' + copy.family, 1316, 802, 34, C.ink);
      if (conflict) {
        api.line(ctx, 245, 855, 1485, 855, C.pink, 4);
        api.arrow(ctx, 245, 855, 245, 690, C.pink, 4);
        text(ctx, api, 'Family already in training', 575, 939, 46, C.pink);
      }
    }
  });
}
export default {
  id: 'data-splits',
  draw: drawDataSplits,
  cues: ['split-roles', 'new-request', 'group-policy-family'],
};
