import { drawAuditTray } from '../audit-tray.mjs';
import { text } from '../defaults.mjs';

const cues = [
  'transfer-resolved',
  'transfer-share',
  'transfer-scope',
  'transfer-none',
  'transfer-low',
  'transfer-all',
  'transfer-high',
];

export function drawMissingLabelTransfer(ctx, scene, state, api) {
  text(ctx, api, 'Another audit · 60 cases', 565, 264, 38, api.C.ink, 'center');
  drawAuditTray(ctx, api, state, {
    selected: 60,
    resolved: 45,
    positive: 9,
    columns: 15,
    answering: state.beat === 1,
    cues,
    tray: 'transfer-tray',
    tally: 'transfer-count',
  });
}

export default { id: 'missing-label-transfer', draw: drawMissingLabelTransfer, cues };
