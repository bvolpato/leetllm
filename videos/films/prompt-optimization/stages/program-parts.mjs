import { text } from '../defaults.mjs';
import { started, complete } from '../policy-sheet.mjs';

export function drawProgramParts(ctx, scene, state, api) {
  const { C } = api;
  const has = (id) => started(state, id);
  api.focus.target('signature-fields', () => {
    text(ctx, api, 'Inputs', 135, 275, 32, C.blue);
    text(ctx, api, 'question', 135, 368, 48, C.ink);
    text(ctx, api, 'Deploy payment-service?', 135, 428, 33, C.muted);
    text(ctx, api, 'evidence', 135, 553, 48, C.ink);
    text(ctx, api, 'Roll back payment-tests', 135, 613, 36, C.blue);
    text(ctx, api, 'approval-4412', 135, 663, 30, C.muted);
    text(ctx, api, 'Response fields', 1260, 275, 32, C.cyan);
    text(ctx, api, 'route', 1260, 368, 48, C.ink);
    text(ctx, api, complete(state, 'signature-gold') ? 'ABSTAIN' : '…', 1260, 428, 37, C.cyan);
    api.text(ctx, 'record_id', 1260, 553, 48, C.ink, 'left', 'mono');
    text(ctx, api, complete(state, 'signature-gold') ? '""' : '…', 1260, 613, 37, C.cyan);
  });
  api.focus.target('module-flow', () => {
    api.arrow(ctx, 630, 445, 744, 445, C.blue, 4);
    api.rect(ctx, 774, 370, 300, 150, C.panel, C.blue);
    text(ctx, api, 'Predict', 924, 464, 55, C.ink, 'center');
    api.arrow(ctx, 1100, 445, 1223, 445, C.cyan, 4);
    if (has('show-module')) text(ctx, api, 'DeployAnswerer', 924, 582, 31, C.blue, 'center');
  });
  api.focus.target('instruction-field', () => {
    if (has('show-instruction')) {
      text(ctx, api, 'Instruction', 135, 765, 31, C.yellow);
      text(ctx, api, 'Cite a record that covers the request.', 520, 765, 38, C.ink);
    }
  });
  api.focus.target('demonstration-field', () => {
    if (has('show-demonstrations')) {
      text(ctx, api, 'Example', 135, 858, 31, C.green);
      text(ctx, api, 'Rollback of payment-tests  →  SERVE · approval-4412', 520, 858, 36, C.ink);
    }
  });
  api.focus.target('compiler-contract', () => {
    if (has('structured-program'))
      text(ctx, api, 'Host checks authorization before acting.', 135, 979, 36, C.yellow);
  });
}
export default {
  id: 'program-parts',
  draw: drawProgramParts,
  cues: [
    'signature-fields',
    'signature-gold',
    'show-module',
    'show-instruction',
    'show-demonstrations',
    'structured-program',
  ],
};
