import { drawPromptText } from '../defaults.mjs';
import { exactApprovalDecision, localPromotionCases, localWriteLedger } from '../model.mjs';
import { cueBegun, cueProgress } from '../arithmetic.mjs';

const cases = localPromotionCases();
const order = [
  ['binding-none', 0],
  ['binding-unknown', 3],
  ['binding-owner', 1],
  ['binding-suite', 2],
  ['binding-operation', 6],
  ['pi-target-binding', 4],
  ['pi-forbidden-target', 5],
];
const gates = ['ownership', 'evaluation', 'target', 'approval'];
const gateNames = ['Owner', 'Current evaluation', 'Allowed target', 'Exact approval'];

export function drawApprovalBindings(ctx, scene, state, api) {
  const { C } = api;
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const begun = (id) => cueBegun(state.cues, id, false);
  const active = state.beat === 1 ? order.filter(([id]) => begun(id)).at(-1) : null;
  const selected = active ? cases[active[1]] : cases[7];
  const refusedAt = gates.indexOf(selected.decision);
  const permitted = (request, grant) => exactApprovalDecision(request, grant) === 'allow';
  const written = after('pi-local-execute');
  const replayed = after('pi-local-replay');
  const attempts = replayed
    ? [selected.request, selected.request]
    : written
      ? [selected.request]
      : [];
  const ledger = localWriteLedger(attempts, selected.approval, permitted);
  const diagnosed = active && after(active[0]);
  const passing = active ? Math.floor(refusedAt * cueProgress(state.cues, active[0], 0)) : -1;
  const text = (s, x, y, size, color = C.ink) => drawPromptText(ctx, api, s, x, y, size, color);

  api.focus.target('binding-records', () => {
    text('Field', 130, 292, 29, C.muted);
    text('Current operation', 570, 292, 34, C.yellow);
    text(written ? 'Grant consumed' : 'Trusted approval   /   APR-9', 1180, 292, 34, C.cyan);
    const labels = ['Signed-in user', 'Candidate', 'Current suite', 'Target', 'Host operation'];
    const keys = ['user', 'candidate', 'suite', 'target', 'operation'];
    keys.forEach((key, i) => {
      const y = 373 + i * 68;
      const requested = selected.request[key];
      const granted = ledger.approval?.[key];
      const differs = diagnosed && granted !== undefined && requested !== granted;
      if (differs) api.rect(ctx, 114, y - 46, 1680, 62, C.panel, C.pink, 6);
      text(labels[i], 130, y, 29, C.muted);
      text(requested, 570, y, 36, differs ? C.pink : C.ink);
      text(granted ?? (i === 0 ? 'No record' : '·'), 1180, y, 36, differs ? C.pink : C.ink);
    });
  });

  api.focus.target('binding-gates', () => {
    const x = [170, 580, 1006, 1436];
    api.line(ctx, x[0], 740, x[3], 740, C.muted, 3);
    if (active) {
      const p = cueProgress(state.cues, active[0], 0);
      const to = x[0] + (x[refusedAt] - x[0]) * p;
      api.line(ctx, x[0], 740, to, 740, C.cyan, 6);
    } else if (written) api.line(ctx, x[0], 740, x[3], 740, C.green, 6);
    gates.forEach((gate, i) => {
      const color =
        diagnosed && selected.decision === gate
          ? C.pink
          : written || (active && i < passing)
            ? C.green
            : C.muted;
      api.circle(ctx, x[i], 740, 13, color);
      text(gateNames[i], x[i] - 28, 807, 30, color);
    });
  });

  api.focus.target('binding-ledger', () => {
    api.line(ctx, 125, 863, 1790, 863, C.muted, 2);
    if (active) {
      text(
        selected.name +
          (diagnosed ? ' · first failed check: ' + selected.decision : ' · check pending'),
        130,
        935,
        40,
        diagnosed ? C.pink : C.ink,
      );
    } else if (written) {
      text(
        'Local ledger: ' + ledger.entries.length + ' entry · APR-9 consumed',
        130,
        935,
        40,
        C.green,
      );
      if (replayed && ledger.added.at(-1) === 0)
        text('Replay   /   no second append', 1130, 935, 32);
    } else {
      text('Local release ledger', 130, 935, 33, C.muted);
      text('0 entries', 1190, 935, 40);
    }
  });
}
export default {
  id: 'approval-bindings',
  draw: drawApprovalBindings,
  cues: [
    'binding-record',
    'binding-order',
    ...order.map(([id]) => id),
    'pi-local-execute',
    'pi-local-replay',
  ],
};
