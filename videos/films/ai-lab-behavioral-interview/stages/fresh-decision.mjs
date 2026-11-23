import { freshDecisionState } from '../arithmetic.mjs';

export function drawFreshDecision(ctx, scene, state, api) {
  const { C, focus } = api;
  const seen = (id) => focus.visible(id);
  const model = freshDecisionState({
    withdrawn: seen('fresh-withdraw'),
    laterValue: seen('fresh-later-value'),
    laterEligible: seen('fresh-review'),
  });
  const x = (ms) => 385 + 12.5 * (ms - 450);
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);

  write(
    'New case • both access checks pass • other gates pass • windows complete',
    117,
    252,
    34,
    C.muted,
  );
  write('Canary p95 in milliseconds', 380, 332, 33);
  write('Your recommendation', 1330, 332, 33);
  const limit = x(500);
  api.line(ctx, limit, 402, limit, 503, C.yellow, 4);
  api.line(ctx, limit, 569, limit, 710, C.yellow, 4);
  api.text(ctx, 'Strict limit: below 500', limit, 390, 31, C.yellow, 'center');
  const windows = [
    {
      label: 'First window',
      latency: model.originalP95,
      result: model.originalResult,
      id: 'first-window',
    },
    {
      label: 'Later window',
      latency: model.laterP95,
      result: model.laterResult,
      id: 'later-window',
    },
  ];
  windows.forEach(({ label, latency, result, id }, i) => {
    if (i === 1 && latency === null) return;
    const y = 480 + i * 196;
    focus.target(id, () => {
      write(label, 115, y + 16, 36, C.ink, 'serif');
      api.line(ctx, x(450), y, x(520), y, '#757983', 3);
      if (i === 1 || seen('fresh-boundary')) {
        api.circle(ctx, x(latency), y, 15, C.cyan);
        api.text(ctx, latency + ' ms', x(latency), y + 63, 37, C.cyan, 'center');
      }
    });
    focus.target(i ? 'second-answer' : 'first-answer', () => {
      const answer = result
        ? result.candidateTraffic === 0
          ? 'Withdraw to 0%'
          : 'Review for 20%'
        : '?';
      write(answer, 1330, y + 18, 47, result ? C.ink : C.yellow, 'serif');
    });
  });
  api.line(ctx, 117, 779, 1800, 779, '#555961', 2);
  focus.target('fresh-owners', () => {
    write('You wrote the release check. Morgan repaired authorization.', 117, 848, 35, C.muted);
  });
  focus.target('fresh-transcript', () => {
    if (seen('fresh-answer')) {
      write(
        '“At five hundred we hit the limit, so I recommended withdrawal.”',
        117,
        938,
        44,
        C.cyan,
        'serif',
      );
      if (seen('fresh-review'))
        write(
          '“Twenty percent was the next step I asked the release owner to approve.”',
          117,
          1008,
          43,
          C.cyan,
          'serif',
        );
    } else if (seen('fresh-sentence') && !model.laterResult) {
      write('What can you say you recommended in each window?', 117, 958, 47, C.yellow, 'serif');
    } else if (seen('fresh-predict') && !model.originalResult) {
      write(
        'At the limit, what candidate share would you recommend?',
        117,
        958,
        47,
        C.yellow,
        'serif',
      );
    }
  });
}
export default {
  id: 'fresh-decision',
  draw: drawFreshDecision,
  cues: [
    'fresh-boundary',
    'fresh-predict',
    'fresh-withdraw',
    'fresh-later-value',
    'fresh-sentence',
    'fresh-review',
    'fresh-answer',
  ],
};
