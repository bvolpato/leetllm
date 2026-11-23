import { referenceRows } from '../fixtures.mjs';
import { fixtureNormalize, referenceCandidate, referenceDigest } from '../model.mjs';

const reasons = [
  ['builder-invalid', 'invalid_label', 'missing label'],
  ['builder-conflict', 'label_conflict', 'conflicting labels'],
  ['builder-cross', 'cross_conversation_duplicate', 'different conversations'],
  ['builder-duplicate', 'exact_duplicate', 'same-group duplicate'],
];
const rowsFor = (ids) => referenceRows.filter((row) => ids.includes(row.ticket_id));

export function drawCandidateBuilder(ctx, scene, state, api) {
  const { C, text, line, rect, focus } = api;
  const seen = (cue) => focus.progress(cue) > 0;
  const split = seen('builder-split');
  const concluded = seen('builder-total');
  const considered = seen('builder-same-pair')
    ? rowsFor([401, 402])
    : seen('builder-other-pair')
      ? rowsFor([411, 412])
      : seen('builder-conflict-pair')
        ? rowsFor([409, 410])
        : rowsFor([404]);
  const active = new Set(considered.map((r) => r.ticket_id));
  const receipt = reasons
    .filter(([cue]) => seen(cue))
    .map(([, reason, label]) => ({
      ids: referenceCandidate.rejected.filter((r) => r.reason === reason).map((r) => r.ticket_id),
      label,
    }));
  const rejected = new Set(receipt.flatMap((group) => group.ids));
  focus.target('builder-register', () => {
    text(ctx, 'Raw tickets', 132, 250, 31, C.muted);
    referenceRows.forEach((row, i) => {
      const x = 132 + i * 139;
      const color = rejected.has(row.ticket_id)
        ? C.pink
        : concluded
          ? C.green
          : active.has(row.ticket_id)
            ? C.yellow
            : C.muted;
      rect(ctx, x, 279, 116, 67, C.panel, color, 4);
      text(ctx, String(row.ticket_id), x + 58, 325, 34, color, 'center', 'mono');
    });
    if (split) {
      const xs = [156, 446, 875, 1310];
      ['Kept ticket', 'Conversation', 'Reviewed label', 'Split'].forEach((v, i) =>
        text(ctx, v, xs[i], 435, 31, C.muted),
      );
      referenceCandidate.kept.forEach((row, i) => {
        const yy = 512 + 65 * i;
        [String(row.ticket_id), row.conversation_id, row.label, row.split].forEach((v, j) =>
          text(ctx, v, xs[j], yy, 35, j === 3 ? C.blue : C.ink),
        );
      });
      line(ctx, 130, 883, 1780, 883, C.muted, 2);
      if (seen('builder-file')) {
        text(
          ctx,
          'Dataset SHA-256   ' + referenceDigest.slice(0, 16) + '…',
          145,
          960,
          34,
          C.cyan,
          'left',
          'mono',
        );
        text(ctx, 'Unsigned candidate manifest', 1775, 960, 32, C.muted, 'right');
      }
      return;
    }

    const single = considered.length === 1;
    text(ctx, single ? 'Raw message' : 'Shared normalized message', 140, 461, 32, C.blue);
    text(
      ctx,
      single ? considered[0].text : fixtureNormalize(considered[0].text),
      140,
      537,
      40,
      C.ink,
    );
    ['Ticket', 'Conversation', 'Label'].forEach((v, j) =>
      text(ctx, v, [145, 400, 747][j], 651, 28, C.muted),
    );
    considered.forEach((row, i) => {
      const yy = 721 + 78 * i;
      text(ctx, String(row.ticket_id), 145, yy, 39, C.ink, 'left', 'mono');
      text(ctx, row.conversation_id, 400, yy, 39, C.blue, 'left', 'mono');
      text(ctx, row.label ?? 'missing', 747, yy, 39, row.label ? C.ink : C.yellow);
    });
    line(ctx, 1088, 414, 1088, 854, C.muted, 2);
    text(ctx, 'Rejection log', 1150, 461, 34, C.pink);
    receipt.forEach(({ ids, label }, i) => {
      const y = 543 + 76 * i;
      text(ctx, ids.join(', '), 1150, y, 32, C.pink, 'left', 'mono');
      text(ctx, label, 1375, y, 32, C.ink);
    });
    const question = single
      ? 'Does ticket 404 have an allowed label?'
      : active.has(401)
        ? 'Which ticket represents this conversation?'
        : 'Keep one copy or send both to review?';
    const closed = single
      ? seen('builder-invalid')
      : active.has(409)
        ? seen('builder-conflict')
        : active.has(411)
          ? seen('builder-cross')
          : seen('builder-duplicate');
    const outcome = active.has(401)
      ? '401 represents both copies in conversation c-a.'
      : single
        ? '404 leaves at the schema gate.'
        : 'Both tickets stay out pending review.';
    text(
      ctx,
      concluded
        ? `${referenceCandidate.kept.length} kept + ${rejected.size} rejected = ${referenceRows.length} inputs`
        : closed
          ? outcome
          : question,
      960,
      955,
      44,
      concluded ? C.green : C.yellow,
      'center',
      'serif',
    );
  });
}
export default {
  id: 'candidate-builder',
  draw: drawCandidateBuilder,
  cues: [
    'builder-invalid',
    'builder-conflict-pair',
    'builder-conflict',
    'builder-other-pair',
    'builder-cross',
    'builder-same-pair',
    'builder-duplicate',
    'builder-total',
    'builder-split',
    'builder-file',
  ],
};
