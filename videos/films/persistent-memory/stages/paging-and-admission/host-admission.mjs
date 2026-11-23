import { admitMemoryWrite } from '../../model.mjs';
import { BILLING, cue } from '../../case-file.mjs';

const verifier = {
  tenant: 'billing',
  source: 'developer_statement',
  field: 'verification_command',
  content: BILLING,
  retentionDays: 90,
};
const approval = { ...verifier, field: 'merge_approved', content: 'true' };

export function drawHostAdmission(ctx, scene, state, api) {
  const { C } = api;
  const inspected = cue(api, 'check-preference') >= 1;
  const accepted = cue(api, 'write-admitted') >= 1;
  const checkedApproval = cue(api, 'write-blocked') >= 1;
  const writes = [verifier, approval];
  const checked = [accepted, checkedApproval];
  const saved = writes.filter(
    (proposal, i) => checked[i] && admitMemoryWrite(proposal) === 'admitted',
  );
  api.focus.target('write-register', () => {
    api.text(ctx, 'Ada’s direct statement   /   billing project', 116, 297, 39, C.blue);
    api.text(ctx, 'Proposed field', 116, 423, 32, C.muted);
    api.text(ctx, 'Value', 720, 423, 32, C.muted);
    api.text(ctx, 'Host decision', 1440, 423, 32, C.muted);
    writes.forEach((proposal, i) => {
      const y = 531 + i * 143;
      api.line(ctx, 115, y - 65, 1801, y - 65, C.muted, 2);
      if (i && !accepted) return;
      const pass = admitMemoryWrite(proposal) === 'admitted';
      api.text(ctx, proposal.field, 117, y, 37, C.ink, 'left', 'mono');
      api.text(ctx, proposal.content, 720, y, 39, C.ink, 'left', 'mono');
      api.text(
        ctx,
        checked[i] ? (pass ? 'Store' : 'Refuse field') : 'Pending',
        1440,
        y,
        39,
        checked[i] ? (pass ? C.green : C.pink) : C.muted,
      );
    });
    if (inspected)
      api.text(
        ctx,
        'Session verified   ·   direct source   ·   size within limit   ·   retention 90 days',
        115,
        803,
        33,
        C.muted,
      );
    api.text(ctx, 'Stored preferences', 115, 957, 39, C.ink);
    api.text(ctx, String(saved.length), 545, 957, 70, C.green, 'left', 'mono');
  });
}
