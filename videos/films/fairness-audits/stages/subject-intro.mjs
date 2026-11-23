import { THRESHOLD, matchedPairs } from '../fixtures.mjs';
import { auditBoard, isAuto, wordingColor, wordingLabel, wordings } from '../audit-board.mjs';

const claim = matchedPairs.find((row) => row.id === 'p4');

function drawReceipt(b, path) {
  const { C, text, line, rect, dot } = b;
  const paper = [
    [112, 218],
    [648, 218],
    [648, 868],
  ];
  for (let i = 1; i <= 16; i++) paper.push([648 - i * 33.5, i % 2 ? 853 : 868]);
  path(paper, { closed: true, fill: C.ink, width: 0 });
  text('Replacement receipt', 154, 295, 42, C.bg);
  line(154, 329, 604, 329, C.muted, 2);

  // The handle, taper and blade give the blender a silhouette at phone size.
  path(
    [
      [439, 402],
      [495, 402],
      [481, 497],
      [425, 514],
    ],
    { color: C.bg, width: 14 },
  );
  path(
    [
      [251, 390],
      [447, 390],
      [425, 536],
      [299, 536],
      [279, 418],
    ],
    {
      closed: true,
      fill: C.cyan,
      color: C.bg,
      width: 7,
    },
  );
  rect(263, 370, 191, 21, C.bg, null, 7);
  rect(328, 355, 61, 18, C.bg, null, 5);
  for (const y of [422, 447, 472]) line(392, y, 418, y, C.bg, 4);
  path(
    [
      [327, 503],
      [361, 515],
      [389, 494],
    ],
    { color: C.bg, width: 7 },
  );
  path(
    [
      [299, 539],
      [426, 539],
      [452, 612],
      [272, 612],
    ],
    {
      closed: true,
      fill: C.panel,
      color: C.bg,
      width: 5,
    },
  );
  dot(362, 575, 13, C.ink);
  text('Broken blender', 154, 689, 54, C.bg);
  line(154, 720, 604, 720, C.muted, 2);
  text('Day 12 of 30', 154, 802, 60, C.bg);
}

export function drawSubjectIntro(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const b = auditBoard(ctx, scene, state, api);
  const { C, text, line, dot, focus, started, after, progress } = b;
  const path = (points, style) =>
    api.path(
      ctx,
      points.map(([x, y]) => ({ x, y })),
      style,
    );
  const xScore = (s) => 842 + ((s - 0.55) / 0.3) * 912;
  const cutoffVisible = started('cutoff');
  const travel = 1 - (1 - Math.min(1, state.t / 1.15)) ** 2;
  focus('receipt', () => drawReceipt(b, path));
  wordings.forEach((key, i) => {
    const y = 298 + i * 308 + (i ? -54 : 54) * (1 - travel);
    const left = 744 + 68 * travel;
    const color = wordingColor(C, key);
    const scoreCue = i ? 'casual-score' : 'formal-score';
    focus(key, () => {
      text(wordingLabel(key), left, y - 18, 32, color);
      path(
        [
          [left, y],
          [left + 980, y],
          [left + 980, y + 99],
          [left + 54, y + 99],
          [left, y + 122],
          [left + 12, y + 99],
          [left, y + 99],
        ],
        { closed: true, fill: C.panel, color, width: 4 },
      );
      const request = i
        ? '“Can you replace it?”'
        : '“Please replace it under the thirty-day policy.”';
      text(request, left + 33, y + 64, 40);
      if (started(scoreCue)) {
        const railY = y + 185;
        line(xScore(0.55), railY, xScore(0.85), railY, C.muted, 3);
        const x = xScore(claim[key]);
        const fall = 24 * (1 - progress(scoreCue));
        dot(x, railY - fall, 13, color);
        text(claim[key].toFixed(2), x, railY + 59, 49, color, 'center');
        if (i && started('shortfall')) {
          line(x, railY, x + (xScore(THRESHOLD) - x) * progress('shortfall'), railY, color, 7);
        }
        if (after(i ? 'casual-route' : 'formal-route')) {
          text(
            isAuto(claim[key]) ? 'Automatic service' : 'Human review',
            left,
            railY + 59,
            35,
            color,
          );
        }
      }
    });
    if (cutoffVisible) {
      focus('ruler', () => {
        const x = xScore(THRESHOLD),
          railY = y + 185;
        line(x, railY - 26, x, railY + 19, C.yellow, 5);
        text(THRESHOLD.toFixed(2), x, railY - 34, 30, C.yellow, 'center');
      });
    }
  });

  let question = 'Would you send both requests to the same place?';
  if (state.beat >= 2) question = 'Illustrative LLM judge scores';
  if (cutoffVisible)
    question = 'At 0.70, automatic service starts. Which request goes to a person?';
  if (after('shortfall'))
    question =
      'The conversational score falls ' +
      (THRESHOLD - claim.conversational).toFixed(2) +
      ' short of the cutoff.';
  if (after('formal-route')) question = 'Same blender, same receipt, different routes.';
  text(question, 960, 982, 42, C.ink, 'center');
}
export default { id: 'subject-intro', draw: drawSubjectIntro };
