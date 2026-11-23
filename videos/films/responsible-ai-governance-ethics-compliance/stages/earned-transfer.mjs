import { cueProgress, governancePermission } from '../construction.mjs';
import { scopeChangeFixture } from '../model.mjs';
import { drawReceiptFile, receiptRow } from '../receipt-file.mjs';

export function drawEarnedTransfer(ctx, scene, state, api) {
  const edited = state.beat > 0 ? 1 : cueProgress(state, 'fresh-target');
  const oldFile = scopeChangeFixture(10);
  const file = edited === 1 ? scopeChangeFixture(15) : oldFile;
  const position = api.lerp(oldFile.original.target, 15, edited);
  const held = !file.eligible && (state.beat > 1 || governancePermission(state, 'fresh-cannot'));
  const compared = state.beat > 1 || governancePermission(state, 'fresh-binding-and-exception');
  const signed = state.beat > 0 || governancePermission(state, 'fresh-signed');
  const checkedPackage = state.beat > 1 || governancePermission(state, 'fresh-manifest');
  const needsSignatures = governancePermission(state, 'fresh-next');
  const roles = compared ? file.required : oldFile.required;
  const rows = roles.map((role) =>
    signed
      ? receiptRow(role, file.receipts[role], file.original)
      : { role, share: null, status: 'Looking up receipt' },
  );

  drawReceiptFile(ctx, api, {
    proposal: file.current,
    position,
    rows,
    requiredShare: needsSignatures ? file.current.target : null,
    requestLabel: edited > 0 && edited < 1 ? 'Editing target' : file.current.target + '% requested',
    deployment: checkedPackage
      ? `Unchanged manifest   ·   ${file.deployment.matching.length} of 8 reviews match`
      : `Deployment file   ·   ${file.deployment.matching.length} accepted reviews`,
    gate: held
      ? compared
        ? 'HELD · obtain three current receipts'
        : 'HELD'
      : edited === 1
        ? 'Can these cover 15%? Who must sign?'
        : 'Check the signed scope',
    roleNote: compared ? undefined : 'G7 requires exception review above 10%.',
    gateColor: held ? api.C.yellow : api.C.ink,
    receiptComparison: needsSignatures
      ? `Each must sign for ${file.current.target}%`
      : compared && file.currentDigest !== file.originalDigest
        ? 'Old approvals mismatch'
        : undefined,
    effect: governancePermission(state, 'fresh-effect')
      ? file.effects.length + ' traffic changes'
      : 'Record unopened',
    appeal:
      held && governancePermission(state, 'fresh-appeal')
        ? 'Appeal decision appended   ·   Hold upheld for 15%. Both receipts cover 10%.'
        : undefined,
  });
}

export default {
  id: 'earned-transfer',
  draw: drawEarnedTransfer,
  cues: [
    'gov-fresh-signed',
    'gov-fresh-target',
    'gov-fresh-cannot',
    'gov-fresh-binding-and-exception',
    'gov-fresh-manifest',
    'gov-fresh-effect',
    'gov-fresh-appeal',
    'gov-fresh-next',
  ],
};
