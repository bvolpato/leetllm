import { CASES } from '../fixtures.mjs';
import { fingerprint } from '../model.mjs';
import { cueClock } from '../report-picture.mjs';

export function drawInputLineage(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  const source = at('change-source') === 1 ? 'reviewed_copy' : CASES[0].source;
  const row = { ...CASES[0], source };
  const question = at('change-question') === 1 ? 'Who approved the deploy?' : 'May I deploy?';
  api.focus.target('hashed-fields', () => {
    api.text(ctx, 'Inside the fingerprint', 135, 263, 40, C.cyan);
    const fields = [
      ['Case ID', row.caseId],
      ['Evidence', row.evidence],
      ['Expected', row.expected],
      ['Slice', row.slice],
      ['Source', source],
    ];
    fields.forEach(([name, value], i) => {
      const y = 375 + i * 92;
      api.text(ctx, name, 135, y, 32, C.muted);
      api.text(ctx, value, 422, y, 36, C.ink, 'left', 'mono');
    });
    api.text(ctx, 'Single-row SHA prefix', 135, 884, 32, C.muted);
    api.text(ctx, fingerprint([row]).slice(0, 16), 135, 955, 43, C.cyan, 'left', 'mono');
  });
  api.line(ctx, 1005, 248, 1005, 952, C.muted, 2);
  api.focus.target('outside-hash', () => {
    api.text(ctx, 'Outside the fingerprint', 1100, 263, 40, C.yellow);
    api.text(ctx, 'Example question', 1100, 421, 35, C.muted);
    api.text(ctx, question, 1100, 504, 43, C.ink, 'left', 'serif');
    if (at('retain-inputs') > 0) {
      api.text(ctx, 'Archive the approved questions', 1100, 777, 38, C.ink);
      api.text(ctx, 'and the evidence the job read.', 1100, 834, 38, C.ink);
    }
  });
}
export default {
  id: 'input-lineage',
  draw: drawInputLineage,
  cues: ['one-row', 'change-source', 'change-question', 'retain-inputs'],
};
