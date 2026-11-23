import { CASES } from '../fixtures.mjs';
import { evaluate } from '../model.mjs';
import { cueClock, routeLedger } from '../report-picture.mjs';

export function drawPaired(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const stages = ['check-incident', 'check-freeze', 'check-rollback', 'check-missing'];
  const checked = stages.filter((id) => at(id) === 1).length;
  const report = evaluate('first repair', CASES.slice(0, checked));
  routeLedger(ctx, api, [null, report, null]);
  const notes = [
    'First repair accepts release records.',
    'The incident now gets the expected refusal.',
    'Two regression cases checked. Two reserved cases remain.',
    'Rollback steps withheld despite the runbook.',
    'One unnecessary abstention on four cases.',
  ];
  api.focus.target('suite-count', () =>
    api.text(ctx, notes[checked], 120, 990, 38, report.unnecessary ? api.C.pink : api.C.cyan),
  );
}
export default {
  id: 'paired',
  draw: drawPaired,
  cues: [
    'check-incident',
    'check-freeze',
    'reserved-cases',
    'check-rollback',
    'check-missing',
    'inspect-count',
  ],
};
