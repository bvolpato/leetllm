const events = ['Planned', 'Requested', 'Accepted', 'Completed', 'Recovery verified'];
const stations = [193, 551, 904, 1260, 1657];

export function drawStateHistory(ctx, scene, state, api) {
  const { C, focus } = api;
  const history = focus.visible('state-metrics');
  const accepted = focus.progress('accepted-only', 0) === 1;
  const completed = focus.progress('state-completed', 0) === 1;
  const last = accepted ? 2 : completed ? 3 : -1;
  const alternative = focus.visible('new-receipt');

  focus.target('candidate', () => {
    api.text(ctx, 'Maya    “What now?”', 145, 246, 33, C.muted);
    api.text(ctx, '“Run the rollback procedure.”', 145, 356, 65, C.ink, 'left', 'serif');
  });
  focus.target('record', () => {
    api.line(ctx, 145, 422, 1770, 422, C.muted, 2);
    api.text(
      ctx,
      history
        ? 'Payment service    /    Latency 540 ms    /    Threshold 500 ms'
        : 'Deployment service    /    Job history not supplied',
      145,
      497,
      34,
      C.ink,
    );
    if (history) {
      api.text(ctx, 'Rollback rb-8912', 145, 579, 36, C.ink);
      api.text(ctx, alternative ? 'Alternate receipt' : 'Trusted receipt', 675, 579, 33, C.muted);
      api.text(
        ctx,
        last < 0 ? 'State pending' : events[last].toUpperCase(),
        1135,
        579,
        37,
        accepted ? C.yellow : C.green,
      );
    }
  });
  focus.target('track', () => {
    for (let i = 0; i < stations.length - 1; i++) {
      api.line(
        ctx,
        stations[i] + 20,
        708,
        stations[i + 1] - 20,
        708,
        i < last ? C.cyan : C.muted,
        i < last ? 6 : 2,
      );
    }
    stations.forEach((x, i) => {
      const color = i === last ? (accepted ? C.yellow : C.green) : i < last ? C.cyan : C.muted;
      api.circle(ctx, x, 708, i === last ? 18 : 12, i <= last ? color : C.bg, color, 3);
      api.text(ctx, events[i], x, 783, 34, color, 'center');
    });
    if (focus.visible('trace-repeat') && !alternative)
      api.text(ctx, 'Proposed repeat', stations[1], 660, 31, C.pink, 'center');
  });
  focus.target('next-step', () => {
    let message = 'Can this exchange tell Maya whether to run rollback again?';
    if (focus.progress('inspect-job', 0) === 1) message = 'Inspect job rb-8912 for completion.';
    else if (accepted) message = 'Which record would tell Maya whether rollback finished?';
    else if (focus.visible('verify-recovery') && !alternative)
      message = 'Next check: did payment latency recover?';
    else if (alternative) message = 'Same operation. Change only the receipt state.';
    if (history || focus.visible('state-unknown'))
      api.text(ctx, message, 960, 942, 46, C.ink, 'center', 'serif');
  });
}

export default {
  id: 'state-history',
  draw: drawStateHistory,
  cues: [
    'state-repeat',
    'state-unknown',
    'state-metrics',
    'state-completed',
    'trace-repeat',
    'verify-recovery',
    'new-receipt',
    'accepted-only',
    'accepted-question',
    'inspect-job',
    'receipt-provenance',
    'ordered-history',
    'task-and-turn',
  ],
};
