import { runs, verifyRun } from '../model.mjs';
import { CASES } from '../fixtures.mjs';
import { cueClock, routeLedger } from '../report-picture.mjs';

export function drawHandoff(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const reports = runs.map(verifyRun);
  const eligible = runs.filter(
    (run, i) => reports[i].valid && !reports[i].unsafe && !reports[i].unnecessary,
  );
  const selected = eligible.length === 1 ? eligible[0] : null;
  if (at('open-nomination') === 0) {
    routeLedger(ctx, api, reports);
    api.focus.target('choice', () =>
      api.text(
        ctx,
        at('name-source') === 1 && selected
          ? 'Nominate ' + selected.id + ' for fresh evaluation.'
          : 'Which run serves both supported cases and abstains on both others?',
        120,
        990,
        37,
        api.C.yellow,
      ),
    );
    return;
  }
  const { C } = api;
  const trace = JSON.parse(selected.artifacts.report.bytes).find(
    (r) => r.caseId === CASES[2].caseId,
  );
  api.focus.target('record', () => {
    api.text(ctx, 'Review nomination', 135, 257, 33, C.cyan);
    api.text(
      ctx,
      selected.id + '   /   ' + selected.candidate,
      135,
      343,
      67,
      C.ink,
      'left',
      'serif',
    );
    api.line(ctx, 135, 381, 1780, 381, C.muted, 2);
    api.text(ctx, 'Saved rollback row', 135, 470, 32, C.muted);
    api.text(ctx, trace.caseId, 135, 536, 40, C.ink, 'left', 'mono');
    api.text(
      ctx,
      'Expected  ' + trace.expected + '     Returned  ' + trace.predicted,
      630,
      536,
      40,
      C.green,
    );
    const fields = [
      ['Candidate manifest', selected.artifacts.manifest.digest],
      ['Case report', selected.artifacts.report.digest],
      ['Frozen suite', selected.context.suite],
    ];
    fields.forEach(([name, digest], i) => {
      const x = 135 + i * 563;
      api.text(ctx, name + ' SHA prefix', x, 679, 31, C.muted);
      api.text(ctx, digest.slice(0, 14), x, 740, 36, C.ink, 'left', 'mono');
    });
    api.text(ctx, 'Known-good release   ' + selected.knownGood, 135, 880, 35, C.cyan);
    api.text(
      ctx,
      'Pending   /   fresh factual and operational checks, then release review',
      135,
      982,
      37,
      C.yellow,
    );
  });
}
export default {
  id: 'handoff',
  draw: drawHandoff,
  cues: ['trace-rollback', 'choose-source', 'name-source', 'open-nomination', 'pending-review'],
};
