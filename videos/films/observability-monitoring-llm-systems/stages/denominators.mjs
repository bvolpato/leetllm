import { EVENTS, receipts } from '../fixtures.mjs';
import { joinReviews, summarize, unsafeServeBounds } from '../arithmetic.mjs';

export function drawDenominators(ctx, scene, state, api) {
  const { C, focus } = api;
  const progress = (id) => focus.progress(id, 0);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const remove = ['202', '203', '204'].slice(0, Math.floor(3 * progress('select-review-cohort')));
  const rows = joinReviews(
    EVENTS,
    receipts.filter((r) => !remove.includes(r.id)),
  );
  const q = summarize(rows),
    bounds = unsafeServeBounds(rows, EVENTS.length);
  const text = (value, x, y, size, color, align = 'left') =>
    api.text(ctx, String(value), x, y, size, color, align);
  const x = (i) => 540 + 201 * i;
  const showAnswers = progress('served-denominator') > 0;
  const showRisk = after('answer-risk');

  text('Request', 125, 260, 35, C.muted);
  text('Risk', 1740, 598, 29, C.muted, 'center');
  rows.forEach((r, i) => text(r.id, x(i), 260, 40, C.blue, 'center'));
  text('Final delivery', 125, 369, 35, C.ink);
  rows.forEach((r, i) =>
    focus.target('delivery-strip', () =>
      text(r.served ? 'Answer' : 'Withheld', x(i), 369, 31, C.ink, 'center'),
    ),
  );
  text('Review', 125, 487, 35, C.ink);
  rows.forEach((r, i) =>
    focus.target('review-strip', () => {
      const verdict = r.unsafe === null ? 'Pending' : r.unsafe ? 'Unsafe' : 'Clear';
      text(
        verdict,
        x(i),
        487,
        35,
        r.unsafe === true ? C.pink : r.unsafe === null ? C.yellow : C.blue,
        'center',
      );
    }),
  );
  api.line(ctx, 120, 547, 1774, 547, C.muted, 2);

  function cohort(label, y, include, target, fraction) {
    focus.target(target, () => text(label, 125, y + 10, 34, C.ink));
    rows.forEach((r, i) =>
      focus.target(target, () => {
        const selected = include(r);
        api.rect(
          ctx,
          x(i) - 66,
          y - 31,
          132,
          62,
          selected ? (r.unsafe ? C.pink : C.blue) : C.panel,
          undefined,
          6,
        );
        text(selected ? r.id : '·', x(i), y + 10, 31, selected ? C.bg : C.muted, 'center');
      }),
    );
    if (fraction) focus.target(target, () => text(fraction, 1740, y + 12, 41, C.ink, 'center'));
  }
  cohort(
    'Reviewed requests',
    645,
    (r) => r.unsafe !== null,
    'reviewed-cohort',
    q.unsafe + '/' + q.reviewed,
  );
  if (showAnswers)
    cohort(
      'Reviewed answers',
      773,
      (r) => r.unsafe !== null && r.served,
      'answer-cohort',
      showRisk ? q.unsafe + '/' + q.served : '?',
    );

  focus.target('window-bound', () => {
    const message = remove.length
      ? 'Review coverage  ' +
        q.reviewed +
        ' / 6       Known unsafe deliveries  ' +
        bounds.lowerCount +
        ' of 6'
      : showRisk
        ? 'Three abstentions. Four defective drafts. Two unsafe deliveries.'
        : showAnswers
          ? 'What fraction of the delivered answers were unsafe?'
          : 'Pink marks a reviewed unsafe delivery.';
    text(message, 125, 966, 38, showAnswers && !showRisk ? C.yellow : C.ink);
  });
}

export default {
  id: 'denominators',
  draw: drawDenominators,
  cues: [
    'request-denominator',
    'served-denominator',
    'answer-risk',
    'select-review-cohort',
    'known-withholdings',
  ],
};
