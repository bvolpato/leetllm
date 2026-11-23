import { APPROVAL, PROPOSAL, TRUSTED } from '../fixtures.mjs';
import { promotionAllowed, promotionTrace } from '../model.mjs';
import { cueBegun, cueProgress } from '../arithmetic.mjs';
import { drawPromptRows, drawPromptText } from '../defaults.mjs';
import { trafficGrid } from '../release-picture.mjs';

export function drawHostPolicy(ctx, scene, state, api) {
  const { C } = api;
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const begun = (id) => cueBegun(state.cues, id, false);
  const grant = begun('pi-approval-arrives') ? APPROVAL : null;
  const allowed = promotionAllowed(PROPOSAL, { ...TRUSTED, approval: grant });
  const permitted = allowed && after('pi-permit');
  const denied = state.beat === 1 && after('host-policy-beat-2-focus-2') && !allowed;
  const committed = permitted && after('pi-commit');
  const release = promotionTrace(committed ? 4 : 0, 1);
  const receipt = after('pi-receipt') ? release.receipt : null;
  const text = (s, x, y, size, color = C.ink) => drawPromptText(ctx, api, s, x, y, size, color);

  api.focus.target('host-policy-operation', () => {
    api.rect(ctx, 120, 268, 777, 470, C.panel, undefined, 8);
    api.line(ctx, 124, 276, 124, 730, receipt ? C.green : C.yellow, 7);
    text(
      receipt ? 'Receipt from the release service' : 'Write proposed by the assistant',
      158,
      336,
      35,
      receipt ? C.green : C.yellow,
    );
    text(receipt?.operationId ?? PROPOSAL.operationId, 158, 410, 44);
    const fields = receipt
      ? [
          ['candidate', receipt.candidate],
          ['committed traffic', receipt.traffic + '%'],
          ['committed revision', String(receipt.revision)],
        ]
      : [
          ['candidate', PROPOSAL.candidate],
          ['requested traffic', PROPOSAL.traffic + '%'],
          ['expected revision', String(PROPOSAL.revision)],
        ];
    drawPromptRows(ctx, api, fields, 150, 454, 708);
  });
  api.focus.target('host-policy-candidate-state', () => {
    text(release.candidate + ' · ' + release.stage, 1105, 332, 40);
    const filling = cueProgress(state.cues, 'pi-allocate', 0);
    const squares = committed ? release.traffic : Math.floor(PROPOSAL.traffic * filling);
    trafficGrid(ctx, api, 1105, 390, 31, squares, committed ? C.green : C.yellow);
    text('Committed traffic: ' + release.traffic + '%', 1105, 602, 37);
    text('Revision ' + release.revision, 1105, 668, 33);
    if (!committed && squares > 0) text('Requested allocation', 1105, 724, 27, C.yellow);
  });
  api.focus.target('host-approval', () => {
    text(
      grant
        ? 'Casey   /   Approved C17 for 25% at revision 3'
        : 'Approval store   /   No matching record',
      134,
      830,
      32,
      grant ? C.green : C.cyan,
    );
  });
  api.focus.target('host-policy-service', () => {
    const message = denied
      ? 'DENY · missing approval'
      : permitted
        ? 'PERMIT'
        : 'Required checks pending';
    text(message, 1105, 829, 36, denied ? C.pink : permitted ? C.green : C.muted);
  });
  if (denied) text('Denied attempt retained; no candidate state changed', 134, 961, 30, C.muted);
  if (receipt && after('host-verify')) {
    const matches =
      receipt.operationId === PROPOSAL.operationId &&
      receipt.candidate === release.candidate &&
      receipt.revision === release.revision &&
      receipt.traffic === release.traffic;
    text(
      matches ? 'Receipt matches the operation and the committed release' : 'Receipt mismatch',
      134,
      960,
      37,
      matches ? C.green : C.pink,
    );
  }
}
export default {
  id: 'host-policy',
  draw: drawHostPolicy,
  cues: [
    'host-proposal',
    'host-lookup',
    'host-missing',
    'host-policy-beat-2-focus-2',
    'pi-approval-arrives',
    'pi-permit',
    'pi-allocate',
    'pi-commit',
    'pi-receipt',
    'host-verify',
  ],
};
