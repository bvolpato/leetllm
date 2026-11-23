const ballots = [
  { first: 'compact', second: 'compact' },
  { first: 'stepwise', second: 'compact' },
  { first: 'tie', second: 'tie' },
];
const matches = ballots.filter(({ first, second }) => first === second).length;

export function drawHumanReference(ctx, scene, state, api) {
  const { C, focus } = api;
  const opening = focus.progress('open-ballots', 0);
  const compared = focus.visible('adjudication');
  const reasons = focus.visible('review-reasons');
  focus.target('ballot', () => {
    api.text(
      ctx,
      'Three example pairs   /   Same task, evidence and rubric',
      160,
      253,
      34,
      C.muted,
    );
    api.text(ctx, 'Case', 190, 369, 36, C.ink);
    api.text(ctx, 'Reviewer 1', 690, 369, 37, C.ink, 'center');
    api.text(ctx, 'Reviewer 2', 1260, 369, 37, C.ink, 'center');
    ballots.forEach(({ first, second }, i) => {
      const y = 466 + 120 * i;
      const equal = first === second;
      const color = compared ? (equal ? C.green : C.pink) : C.muted;
      focus.target(i === 1 ? 'disputed-row' : 'other-row', () => {
        api.line(ctx, 165, y - 61, 1750, y - 61, C.muted, 1);
        api.text(ctx, String(i + 1).padStart(2, '0'), 200, y, 40, C.muted);
        const show = opening >= (i + 1) / ballots.length;
        for (const [column, value] of [
          [690, first],
          [1260, second],
        ]) {
          if (show) api.text(ctx, value, column, y, 47, C.ink, 'center');
          else api.rect(ctx, column - 132, y - 38, 264, 43, C.panel, C.muted, 4);
        }
        if (compared) api.text(ctx, equal ? '=' : '≠', 972, y, 50, color, 'center');
      });
    });
  });
  focus.target('reviewer-result', () => {
    const line = focus.visible('label-split')
      ? 'Freeze the rubric. Score fresh cases against independent labels.'
      : reasons
        ? 'Case 02    /    First action at a glance, or two numbered steps?'
        : focus.progress('count-ballots', 0) === 1
          ? 'The reviewers agree on ' + matches + ' of ' + ballots.length + ' cases.'
          : compared
            ? 'Compare the two ballots before discussing them.'
            : 'Which case needs a conversation?';
    if (opening > 0 || compared) api.text(ctx, line, 960, 888, 43, C.ink, 'center', 'serif');
    if (reasons)
      api.text(
        ctx,
        'Keep both original votes with the adjudication record.',
        960,
        970,
        32,
        C.muted,
        'center',
      );
  });
}

export default {
  id: 'human-reference',
  draw: drawHumanReference,
  cues: [
    'blind-humans',
    'open-ballots',
    'ask-reviewers',
    'adjudication',
    'count-ballots',
    'review-reasons',
    'label-split',
  ],
};
