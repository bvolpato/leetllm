import { supportReceiptFixture } from '../arithmetic.mjs';
import {
  ADMIN_QUESTION,
  NOTE_QUERY,
  SUPPORT_PASSAGE,
  SUPPORT_QUESTION,
  supportVariants,
} from '../fixtures.mjs';
import { answer, sharedTerms } from '../model.mjs';

const requests = [
  {
    name: 'Restoration after verification',
    question: SUPPORT_QUESTION,
    receipt: supportVariants.entailed,
  },
  {
    name: 'Permanent admin access',
    question: ADMIN_QUESTION,
    receipt: {
      ...supportReceiptFixture(
        ADMIN_QUESTION,
        SUPPORT_PASSAGE,
        'unknown',
        'answer-support-admin-v1',
      ),
      method: 'validated_verifier',
      adjudicatorId: 'policy-entailment-v4',
      validationRecordId: 'verifier-validation-2026-07-15',
    },
  },
  { name: 'Request echoing the private note', question: NOTE_QUERY, receipt: null },
];

export function drawResponses(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  const shown = p('responses-note') > 0 ? 3 : p('responses-admin') > 0 ? 2 : 1;
  api.text(ctx, 'Candidate for all three requests', 112, 248, 29, C.muted);
  api.text(ctx, SUPPORT_PASSAGE.documentId, 112, 329, 45, C.blue, 'left', 'mono');
  api.line(ctx, 112, 378, 1808, 378, C.blue, 4);
  const columns = [112, 772, 1048, 1460];
  ['US caller asks about', 'Shared terms', 'Review on file', 'Response'].forEach((label, i) =>
    api.text(ctx, label, columns[i], 472, 28, C.muted),
  );
  requests.slice(0, shown).forEach(({ name, question, receipt }, i) => {
    const y = 572 + i * 127;
    const response = answer(question, SUPPORT_PASSAGE, receipt);
    const ready = p(['responses-first', 'responses-second', 'responses-third'][i]) === 1;
    focus.target(['restore-case', 'admin-case', 'note-case'][i], () => {
      api.text(ctx, name, columns[0], y, 35, C.ink);
      api.text(
        ctx,
        String(sharedTerms(question, SUPPORT_PASSAGE.text).length),
        columns[1],
        y,
        43,
        C.blue,
      );
      api.text(ctx, receipt?.label ?? 'No receipt', columns[2], y, 35, C.ink);
      const color = ready ? (response.status === 'ANSWER' ? C.green : C.pink) : C.muted;
      api.text(
        ctx,
        ready ? (response.status === 'ANSWER' ? 'grounded' : 'abstain') : '?',
        columns[3],
        y,
        39,
        color,
      );
      if (ready)
        api.text(
          ctx,
          response.citations.length === 1 ? '1 citation' : 'citations: []',
          columns[3],
          y + 49,
          28,
          color,
        );
    });
  });
  if (p('responses-third') === 1)
    api.text(
      ctx,
      'Only the first question has a matching review that supports an answer.',
      112,
      978,
      34,
      C.ink,
    );
}

export default {
  id: 'responses',
  draw: drawResponses,
  cues: [
    'responses-first',
    'responses-admin',
    'responses-second',
    'responses-note',
    'responses-third',
  ],
};
