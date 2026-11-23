import { assessmentSheet } from '../pieces/assessment-sheet.mjs';
import { spokenScene } from '../pieces/scene.mjs';

export default spokenScene('evaluation-result', (ctx, scene, state, api, g) => {
  const native = state.beat === 0;
  const rows = native
    ? g(0, 1) > 0
      ? [
          { id: 'A', pass: true },
          { id: 'B', pass: true },
        ]
      : []
    : [
        { id: 'A', pass: true },
        { id: 'B', pass: false },
      ];
  const p = g(2, 0);
  if (p >= 1) rows.push({ id: 'C', pass: true });
  const note = native
    ? g(0, 2) > 0
      ? 'result.passed = True     ·     C has no scorer error and no value'
      : ''
    : state.beat === 1
      ? g(1, 3) > 0
        ? 'If C passes, can this candidate ship?'
        : ''
      : g(2, 2) > 0
        ? 'Hold release   ·   B still failed'
        : '';
  const moving = p > 0 && p < 1 ? { id: 'C', pass: true, p } : null;
  assessmentSheet(ctx, api, {
    heading: native
      ? 'MLflow 3.16.1   /   native result'
      : 'New result   /   all three citation checks required',
    rows,
    arrivals: moving ? [...rows, moving] : rows,
    moving,
    note,
  });
});
