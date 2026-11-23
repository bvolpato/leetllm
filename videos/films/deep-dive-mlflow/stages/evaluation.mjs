import { citationPass } from '../model.mjs';
import { required } from '../fixtures.mjs';
import { bound } from '../arithmetic.mjs';
import { assessmentSheet } from '../pieces/assessment-sheet.mjs';
import { spokenScene } from '../pieces/scene.mjs';

export default spokenScene('evaluation', (ctx, scene, state, api, g) => {
  const lab = state.beat === 0;
  const inputs = [[], ['DOC-99'], ['DOC-12']];
  const checks = lab
    ? inputs.map((list, i) => ({
        id: required[i],
        pass: citationPass(list, ['DOC-12']),
        p: bound(g(0, 1) * 3 - i),
      }))
    : [
        { id: 'C', pass: true, p: g(1, 1) },
        { id: 'A', pass: true, p: g(1, 2) },
        { id: 'B', pass: true, p: g(2, 1) },
      ];
  const rows = checks.filter((r) => r.p >= 1);
  const moving = checks.find((r) => r.p > 0 && r.p < 1);
  const arrivals = checks.filter((r) => r.p > 0 || (r.id === 'C' && g(1, 0) > 0.5));
  let note;
  if (lab && g(0, 2) > 0) note = 'Every case scored   ·   one of three passed';
  if (state.beat === 1 && g(1, 3) > 0)
    note = 'Which required case would you run before moving the alias?';
  if (state.beat === 2)
    note =
      rows.length === 3
        ? 'Citation checks complete   ·   verify candidate identity'
        : 'Run the missing check for B.';
  assessmentSheet(ctx, api, {
    heading: lab ? 'First run   /   case A is RET-104' : 'Candidate v18   /   case A is RET-104',
    inputs: lab ? inputs : null,
    rows,
    moving,
    arrivals,
    note,
  });
});
