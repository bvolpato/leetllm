import { rackPhoto, drawClipText } from './defaults.mjs';

export const scoreFloor = 0.6;
export const marginFloor = 0.08;
export const initialPrompts = [
  { text: 'Vent is blocked', score: 0.62 },
  { text: 'Clear rack door', score: 0.49 },
  { text: 'Tape across the tag', score: 0.18 },
];
export const revisedPrompts = [
  initialPrompts[0],
  { text: 'Vent is clear beside the cover', score: 0.57 },
  initialPrompts[2],
];

export function chooseCandidate(prompts) {
  const [best, second] = [...prompts].sort((a, b) => b.score - a.score);
  const gap = best.score - second.score;
  return { best, second, gap, passes: best.score >= scoreFloor && gap >= marginFloor };
}

export function drawPolicy(
  ctx,
  api,
  {
    prompts,
    revealGap,
    revealRoute,
    question = false,
    awaitingSecond = false,
    previousSecond,
    secondProgress = 1,
  },
) {
  const { C } = api;
  const { best, second, gap, passes } = chooseCandidate(prompts);
  rackPhoto(ctx, api, 112, 365, 444, 388);
  drawClipText(ctx, api, 'Photo 17', 334, 826, 38);
  drawClipText(ctx, api, 'Supplied cosine scores', 334, 882, 27, C.muted);

  // All three scores share one scale. Draw the margin between the two actual endpoints.
  const left = 1090,
    width = 940;
  const x = (n) => left + n * width;
  api.text(ctx, 'Class prompt', 620, 321, 31, C.muted);
  drawClipText(ctx, api, 'Score floor  ' + scoreFloor.toFixed(2), x(scoreFloor), 321, 30, C.yellow);
  api.line(ctx, x(scoreFloor), 356, x(scoreFloor), 721, C.yellow, 3);
  prompts.forEach((item, i) => {
    const y = 425 + i * 135;
    const color = i === 0 ? C.cyan : i === 1 ? C.blue : C.muted;
    const paint = () => {
      api.text(ctx, item.text, 620, y + 10, 29, C.ink);
      const displayedScore =
        i === 1 && previousSecond !== undefined
          ? previousSecond + (item.score - previousSecond) * secondProgress
          : item.score;
      api.line(ctx, left, y, x(displayedScore), y, color, 12);
      api.circle(ctx, x(displayedScore), y, 12, color);
      api.text(
        ctx,
        i === 1 && awaitingSecond ? '?' : item.score.toFixed(2),
        1736,
        y + 12,
        37,
        color,
      );
      if (i === 1 && previousSecond !== undefined) {
        api.circle(ctx, x(previousSecond), y, 12, C.panel, C.muted, 3);
        drawClipText(
          ctx,
          api,
          'was ' + previousSecond.toFixed(2),
          x(previousSecond),
          y + 50,
          26,
          C.muted,
        );
      }
    };
    if (i === 1) api.focus.target('policy-second', paint);
    else paint();
  });
  api.focus.target('policy-gap', () => {
    if (revealGap) {
      const y = 788;
      for (const v of [second.score, best.score])
        api.line(ctx, x(v), y - 19, x(v), y + 10, C.ink, 3);
      api.line(ctx, x(second.score), y, x(best.score), y, C.ink, 4);
      drawClipText(
        ctx,
        api,
        best.score.toFixed(2) + ' - ' + second.score.toFixed(2) + ' = ' + gap.toFixed(2),
        1370,
        848,
        37,
      );
    }
    drawClipText(
      ctx,
      api,
      'Required gap   ≥ ' + marginFloor.toFixed(2),
      1360,
      revealGap ? 908 : 842,
      33,
    );
  });
  const verdict = passes ? 'Keep “vent is blocked” as a candidate' : 'Send the photo for review';
  drawClipText(
    ctx,
    api,
    revealRoute
      ? verdict +
          '    ·    gap ' +
          gap.toFixed(2) +
          (passes ? ' ≥ ' : ' < ') +
          marginFloor.toFixed(2)
      : question
        ? 'Keep the label or send the photo for review?'
        : 'Require both the score floor and the top-two gap.',
    960,
    986,
    38,
    revealRoute ? (passes ? C.cyan : C.yellow) : C.ink,
  );
}
