import { complete, started } from '../policy-sheet.mjs';

const printedZip = '02139';
const numberAnswer = String(Number(printedZip));

function envelope(ctx, api) {
  const { C } = api;
  api.rect(ctx, 110, 300, 690, 425, C.ink, undefined, 8);
  api.rect(ctx, 677, 338, 78, 92, C.blue, undefined, 1);
  // The notched edge and cancellation lines distinguish the stamp from the address window.
  for (let i = 0; i < 6; i++) {
    for (const x of [678, 754]) api.circle(ctx, x, 344 + 16 * i, 4, C.ink);
  }
  for (let i = 0; i < 3; i++) api.line(ctx, 602, 360 + 15 * i, 716, 360 + 15 * i, C.bg, 2);
  api.text(ctx, 'Cambridge, MA', 175, 522, 48, C.bg, 'left');
  api.text(ctx, printedZip, 170, 651, 108, C.bg, 'left', 'mono');
  api.line(ctx, 174, 667, 230, 667, C.bg, 5);
}

export function drawSubjectIntro(ctx, _scene, state, api) {
  const { C } = api;
  envelope(ctx, api);

  const exact = started(state, 'text-rule');
  const tie = complete(state, 'numeric-tie');
  const decided = exact ? complete(state, 'text-winner') : tie;
  const showSecond = started(state, 'text-copy');
  api.focus.target('number-answer', () => {
    api.text(ctx, 'A   Return a number', 1070, 332, 41, C.blue, 'left');
    // Four copied digits are already clear of the printed code at the cut.
    const slide = Math.min(1, (state.t ?? 0) / 1.45);
    const x = 510 + 560 * slide;
    const y = 584 - 196 * slide;
    api.rect(ctx, x, y, 300, 110, C.blue, undefined, 5);
    api.text(ctx, numberAnswer, x + 150, y + 84, 80, C.bg, 'center', 'mono');
  });
  api.focus.target('text-answer', () => {
    if (!showSecond) return;
    api.text(ctx, 'B   Copy all five digits', 1070, 580, 41, C.cyan, 'left');
    const slide = state.cues['text-copy'].progress;
    const x = 510 + 560 * slide;
    api.rect(ctx, x, 632, 300, 110, C.cyan, undefined, 5);
    api.text(ctx, printedZip, x + 150, 716, 80, C.bg, 'center', 'mono');
  });
  api.focus.target('grading-rule', () => {
    if (started(state, 'numeric-rule')) {
      api.text(ctx, 'Grader', 120, 920, 39, C.muted, 'left');
      api.text(
        ctx,
        exact ? 'Match the printed text' : 'Match the numeric value',
        345,
        928,
        56,
        C.yellow,
        'left',
      );
    }
  });
  api.focus.target('scores', () => {
    if (!started(state, 'numeric-rule')) return;
    [numberAnswer, printedZip].forEach((answer, i) => {
      const matches = exact ? answer === printedZip : Number(answer) === Number(printedZip);
      api.text(
        ctx,
        decided ? (matches ? '1 point' : '0 points') : '?',
        1460,
        471 + 244 * i,
        58,
        decided ? (matches ? C.green : C.pink) : C.muted,
        'left',
      );
    });
  });
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['number-copy', 'text-copy', 'numeric-rule', 'numeric-tie', 'text-rule', 'text-winner'],
};
