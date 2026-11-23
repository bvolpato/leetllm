import { libraryText, sundayQuestion } from '../library-shelf.mjs';
import { passageIds, scores } from '../fixtures.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const { C, focus } = api;
  const sampled = focus.progress('sample-answer', 0) === 1;
  const grounded = focus.progress('correct-answer', 0) === 1;
  api.text(ctx, sundayQuestion, 145, 265, 52, C.ink);
  focus.target('source', () => {
    api.rect(ctx, 130, 326, 1640, 230, C.panel, C.green, 10);
    api.text(
      ctx,
      `${passageIds[2]}    /    retrieved #3    /    packed #1    /    logit ${scores[2].toFixed(2)}`,
      172,
      388,
      34,
      C.green,
      'left',
      'mono',
    );
    api.text(ctx, libraryText[2], 172, 498, 64, C.ink);
  });
  focus.target('reply', () => {
    api.text(ctx, grounded ? 'Corrected reply' : 'Example reply', 146, 669, 32, C.muted);
    api.text(
      ctx,
      grounded
        ? 'No. The library is closed on Sunday.'
        : sampled
          ? 'Yes. The library is open on Sunday.'
          : '…',
      146,
      776,
      58,
      grounded ? C.green : C.ink,
    );
  });
  focus.target('diagnosis', () => {
    if (grounded)
      api.text(ctx, 'Check the generated claim against the packed clause.', 146, 956, 39, C.green);
    else if (sampled)
      api.text(ctx, 'Which stage first contradicts the source?', 146, 956, 39, C.yellow);
  });
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: ['packed-clause', 'sample-answer', 'diagnose-reply', 'correct-answer'],
};
