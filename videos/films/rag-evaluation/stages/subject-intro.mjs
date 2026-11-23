import { completed, spoken } from '../construction.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';

function envelope(ctx, api, x, y, color) {
  api.rect(ctx, x - 66, y - 41, 132, 82, api.C.panel, color, 5);
  api.path(
    ctx,
    [
      { x: x - 59, y: y - 34 },
      { x, y: y + 7 },
      { x: x + 59, y: y - 34 },
    ],
    { color, width: 4 },
  );
}

function drawBookReturn(ctx, state, api) {
  const { C, path, rect, text } = api;
  const fall = Math.min((state.t ?? 0) / 1.45, 1);
  const drop = 415 * (0.35 * fall + 0.65 * fall * fall);
  const slot = { x: 275, y: 190, width: 470, height: 437 };

  rect(ctx, 175, 554, 655, 362, C.panel, C.cyan, 28);
  rect(ctx, 244, 604, 517, 51, C.bg, C.cyan, 18);
  if (fall < 1) {
    const paper = (points, fill) =>
      path(
        ctx,
        points.map(([x, y]) => ({ x: x + 14 * fall, y: y + drop })),
        {
          closed: true,
          fill,
          color: fill,
          width: 3,
          clip: slot,
        },
      );
    paper(
      [
        [337, 261],
        [564, 218],
        [625, 516],
        [398, 560],
      ],
      C.ink,
    );
    paper(
      [
        [337, 261],
        [350, 274],
        [411, 573],
        [398, 560],
      ],
      C.muted,
    );
    paper(
      [
        [350, 274],
        [578, 230],
        [639, 529],
        [411, 573],
      ],
      C.yellow,
    );
    paper(
      [
        [350, 274],
        [373, 270],
        [434, 569],
        [411, 573],
      ],
      C.blue,
    );
    paper(
      [
        [417, 361],
        [550, 335],
        [552, 343],
        [419, 369],
      ],
      C.bg,
    );
    paper(
      [
        [421, 382],
        [516, 364],
        [517, 371],
        [422, 389],
      ],
      C.bg,
    );
  }
  text(ctx, 'BOOK RETURN', 502, 769, 60, C.ink, 'center');
  text(ctx, 'Open Sunday', 502, 843, 40, C.cyan, 'center');
}

function drawReaderQuestion(ctx, state, api) {
  const { C, rect, text } = api;
  text(ctx, 'Reader', 931, 335, 34, C.muted);
  rect(ctx, 929, 365, 820, 137, C.ink, undefined, 24);
  text(ctx, 'When will I get my receipt?', 969, 452, 51, C.bg);
  api.focus.target('reply', () => {
    text(ctx, 'Library assistant', 931, 608, 34, C.blue);
    text(ctx, '“Use the return box.”', 931, 700, 52, C.ink);
    const promise = spoken(state, 'invented-detail', 0);
    if (promise > 0) {
      text(ctx, '“A receipt arrives immediately.”', 931, 785, 49, C.ink);
      ctx.save();
      ctx.font = lessonFont(49);
      const start = 931 + ctx.measureText('“A receipt arrives ').width;
      const length = ctx.measureText('immediately').width;
      ctx.restore();
      api.line(ctx, start, 806, start + length * promise, 806, C.yellow, 5);
    }
  });
}

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C, text, line } = api;
  if ((state.beat ?? 0) === 0) {
    if (state.t < 0.35) ctx.globalAlpha = 1;
    drawBookReturn(ctx, state, api);
    drawReaderQuestion(ctx, state, api);
    return;
  }
  const sunday = 1110;
  const monday = 1560;
  const receiptNotice = spoken(state, 'receipt-notice', 1) > 0;
  const mondayKnown = completed(state, 'actual-receipt', 2);
  const correction = spoken(state, 'correct-date', 3);
  const corrected = completed(state, 'correct-date', 3);

  text(ctx, 'Return log', 155, 287, 34, C.muted);
  text(ctx, 'Sunday', sunday, 290, 50, C.ink, 'center');
  text(ctx, 'Monday', monday, 290, 50, C.ink, 'center');
  line(ctx, 150, 323, 1765, 323, C.muted, 2);
  line(ctx, 150, 574, 1765, 574, C.muted, 2);
  line(ctx, 150, 830, 1765, 830, C.muted, 2);

  api.focus.target('reply', () => {
    text(ctx, 'Assistant’s reply', 155, 395, 31, C.blue);
    text(ctx, '“Use the return box.”', 155, 465, 46, C.ink);
    text(
      ctx,
      corrected ? '“A receipt arrives the next day.”' : '“A receipt arrives immediately.”',
      155,
      528,
      43,
      corrected ? C.green : C.ink,
    );
    envelope(ctx, api, sunday + (monday - sunday) * correction, 470, corrected ? C.green : C.blue);
  });

  api.focus.target('notice', () => {
    text(ctx, 'Library instructions', 155, 643, 31, C.cyan);
    text(ctx, 'A   Use the box on Sunday.', 155, 710, 40, C.ink);
    if (receiptNotice) text(ctx, 'B   Receipts are emailed the next day.', 155, 777, 37, C.ink);
    if (mondayKnown) envelope(ctx, api, monday, 715, C.cyan);
  });

  api.focus.target('calendar', () => {
    const prompt = corrected
      ? 'Keep the return-box advice. Change the promised day.'
      : mondayKnown
        ? 'A Sunday return puts the email on Monday.'
        : 'Which day does the library promise for the email?';
    text(ctx, prompt, 960, 945, 41, corrected ? C.green : C.ink, 'center');
  });
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'invented-detail',
    'open-notice',
    'receipt-notice',
    'compare-days',
    'actual-receipt',
    'correct-date',
  ],
};
