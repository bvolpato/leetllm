import { chapterCard, panel, text } from '../defaults.mjs';
import { documents, motion, passed, results } from '../ledger.mjs';

export function drawArgumentInspection(ctx, scene, state, api) {
  const { C } = api;
  const nested = state.beat > 0;
  const delivered = nested
    ? passed(state, 'argument-nested', 2)
    : passed(state, 'argument-resolved', 0);
  api.focus.target('argument-call', () => {
    api.text(
      ctx,
      nested ? 'ledger.inspect_nested.remote(refs)' : 'ledger.record.remote(*refs)',
      960,
      285,
      49,
      C.cyan,
      'center',
      'mono',
    );
    panel(ctx, api, 175, 398, 640, 338, C.cyan);
    text(ctx, api, 'At the driver', 230, 463, 36);
    text(ctx, api, nested ? '[ A,  B,  C ]' : 'A,  B,  C', 495, 608, 62, C.cyan, 'center');
    text(
      ctx,
      api,
      nested ? 'One list argument' : 'Three arguments',
      495,
      694,
      32,
      C.muted,
      'center',
    );
  });
  api.arrow(ctx, 837, 568, 1010, 568, C.muted, 4);
  api.focus.target('argument-result', () => {
    panel(ctx, api, 1035, 398, 712, 338, C.green);
    text(ctx, api, 'At the actor', 1090, 463, 36);
    if (!delivered)
      text(
        ctx,
        api,
        nested ? '[   ?   ]' : 'waiting for values',
        1391,
        608,
        52,
        C.yellow,
        'center',
      );
    else if (nested) {
      text(ctx, api, '[ A,  B,  C ]', 1391, 608, 62, C.cyan, 'center');
      text(ctx, api, 'Three ObjectRef handles inside', 1391, 694, 32, C.muted, 'center');
    } else {
      results.forEach((v, i) => {
        const x = 1151 + 232 * i;
        text(ctx, api, documents[i], x, 552, 31, C.muted, 'center');
        text(ctx, api, '(' + v.join(', ') + ')', x, 636, 37, C.green, 'center');
      });
    }
  });
  api.focus.target('argument-reply', () => {
    if (!nested && motion(state, 'argument-count', 0) > 0)
      chapterCard(
        ctx,
        api,
        'Driver reads count   ' + (passed(state, 'argument-count', 0) ? documents.length : '…'),
        500,
        823,
        920,
        C.green,
        97,
        40,
      );
    else if (state.beat === 2)
      text(
        ctx,
        api,
        'Local checks     count = 3      ·      all list entries are ObjectRefs',
        960,
        902,
        37,
        C.green,
        'center',
      );
  });
}
export default {
  id: 'argument-inspection',
  draw: drawArgumentInspection,
  cues: [
    'argument-splat',
    'argument-resolved',
    'argument-count',
    'argument-list',
    'argument-nested',
    'argument-checked',
  ],
};
