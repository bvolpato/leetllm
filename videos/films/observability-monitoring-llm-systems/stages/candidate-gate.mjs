import { summarize } from '../arithmetic.mjs';
import { drawDeliveryLanes } from '../delivery-lanes.mjs';

const cases = [
  { id: '205', draft: 'Approved', detail: 'Approval absent', supported: false },
  { id: '201', draft: 'Policy answer', detail: 'Answer in policy', supported: true },
];

// The supplied delivery receipts and the reviewer's answer key are separate inputs.
export function scoreReplays(deliveredIds) {
  const rows = cases.map((item) => {
    const served = deliveredIds.includes(item.id);
    return { ...item, served, unsafe: served && !item.supported };
  });
  const safety = summarize(rows, rows.length);
  const answerable = rows.filter((row) => row.supported);
  return {
    rows,
    reviewed: safety.reviewed,
    unsafe: safety.unsafe,
    total: rows.length,
    useful: answerable.filter((row) => row.served).length,
    answerable: answerable.length,
  };
}

export function drawCandidateGate(ctx, scene, state, api) {
  const { C, focus } = api;
  const progress = (id) => focus.progress(id, 0);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const alternate = progress('change-candidate') > 0;
  const score = scoreReplays(alternate ? ['201'] : []);
  const text = (value, x, y, size, color) => api.text(ctx, value, x, y, size, color);
  const secondReviewed = alternate && after('check-second-replay');
  const scored = alternate ? secondReviewed : after('review-pair');
  const holdout = after('run-holdout');
  const saving = progress('save-record') > 0;

  focus.target('replay-contract', () => {
    text(holdout ? 'Evaluation record  /  candidate 2' : 'Replay contract', 120, 238, 31, C.blue);
    text(
      saving
        ? 'Replay IDs  205, 201     ·     Same evaluator for both trials'
        : holdout
          ? 'Next: evaluate the untouched holdout.'
          : 'Review both cases. Contain the unsupported claim. Answer the clean case.',
      120,
      296,
      40,
      C.ink,
    );
  });
  drawDeliveryLanes(
    ctx,
    api,
    score.rows.map((row) => ({
      ...row,
      showDraft: true,
      progress:
        alternate && row.supported
          ? 0.45 + 0.55 * progress('pass-clean')
          : alternate
            ? 1
            : progress('withhold-both'),
    })),
  );

  focus.target('replay-score', () => {
    const tally = scored
      ? 'Reviews   ' +
        score.reviewed +
        ' / ' +
        score.total +
        '       Unsafe / reviewed   ' +
        score.unsafe +
        ' / ' +
        score.reviewed +
        '       Useful clean answers   ' +
        score.useful +
        ' / ' +
        score.answerable
      : 'Reviews pending';
    text((holdout ? 'Replays     ' : '') + tally, 120, 874, 32, C.blue);
  });
  focus.target('release-decision', () => {
    if (holdout) {
      text('Holdout', 120, 969, 32, C.yellow);
      text('Awaiting reviews', 323, 969, 32, C.ink);
      focus.target('holdout-rate', () => text('Unsafe rate    ?', 775, 969, 32, C.yellow));
      text('Clean-case usefulness    ?', 1210, 969, 32, C.yellow);
      return;
    }
    let decision = 'Two trial cases from the six-request window';
    let color = C.muted;
    if (progress('judge-first') > 0) {
      decision = 'Promote this candidate? Which case decides?';
      color = C.yellow;
    }
    if (after('hold-candidate')) {
      decision = 'Hold: request 201 lost a supported answer.';
      color = C.pink;
    }
    if (alternate) {
      decision = secondReviewed
        ? 'Both replays pass. What should happen next?'
        : 'Second trial: same cases and evaluator';
      color = secondReviewed ? C.yellow : C.muted;
    }
    text(decision, 120, 969, 42, color);
  });
}

export default {
  id: 'candidate-gate',
  draw: drawCandidateGate,
  cues: [
    'freeze-cases',
    'withhold-both',
    'review-pair',
    'judge-first',
    'hold-candidate',
    'change-candidate',
    'pass-clean',
    'check-second-replay',
    'run-holdout',
    'replay-only',
    'unreviewed-holdout',
    'save-record',
  ],
};
