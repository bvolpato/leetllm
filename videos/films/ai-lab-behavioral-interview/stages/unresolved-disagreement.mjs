export function drawUnresolvedDisagreement(ctx, scene, state, api) {
  const { C, focus } = api;
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  const seen = (id) => focus.visible(id);

  api.rect(ctx, 115, 230, 1660, 722, C.panel, undefined, 7);
  write('Friday decision record', 168, 325, 49, C.ink, 'serif');
  write('Decision owner: Priya', 1170, 325, 34, C.muted);
  const rows = [
    ['Both want', 'Useful answers before the returns peak.'],
    ['Product proposes', 'Learn how the new ranker performs in a small live rollout.'],
    ['Nia recommends', 'Keep real requests on the prior version. Test access offline.'],
  ];
  rows.forEach(([left, right], i) => {
    const y = 442 + 105 * i;
    focus.target(i === 2 ? 'disagreement-boundary' : 'disagreement-views', () => {
      api.line(ctx, 168, y - 62, 1705, y - 62, '#555961', 2);
      write(left, 168, y, 33, C.muted);
      write(right, 569, y, 36);
    });
  });
  api.line(ctx, 168, 704, 1705, 704, '#555961', 2);
  focus.target('disagreement-record', () => {
    write('Decision', 168, 789, 33, C.muted);
    write(
      seen('disagreement-open') ? 'Open • security review requested' : 'Awaiting owner',
      569,
      789,
      44,
      C.yellow,
      'serif',
    );
  });
  if (seen('disagreement-followup'))
    focus.target('disagreement-next', () => {
      write(
        'Next entry: record Priya’s decision, her reasons, and who will act.',
        168,
        892,
        35,
        C.cyan,
      );
    });
}
export default {
  id: 'unresolved-disagreement',
  draw: drawUnresolvedDisagreement,
  cues: [
    'disagreement-views',
    'disagreement-offline',
    'disagreement-open',
    'disagreement-followup',
  ],
};
