import {
  LAB_POLICY,
  SUPPORT_PASSAGE,
  SUPPORT_QUESTION,
  publicationRecords,
  supportVariants,
} from '../fixtures.mjs';
import { answer, publicationDecision, sharedTerms } from '../model.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  const restored = p('synthesis-restore') === 1;
  const edited = p('synthesis-edit') > 0 && !restored;
  const text = edited ? LAB_POLICY.replace('may be', 'may not be') : LAB_POLICY;
  const decision = publicationDecision({ ...publicationRecords[0], text });
  const available = publicationRecords
    .map((r, i) => (i === 0 ? decision : publicationDecision(r)))
    .filter((row) => row.admitted && sharedTerms(SUPPORT_QUESTION, row.record.text).length >= 2);
  const response = available.length
    ? answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, supportVariants.entailed)
    : null;
  const grounded = response?.status === 'ANSWER';
  const resultReady = restored ? p('synthesis-pass') === 1 : p('synthesis-abstain') === 1;
  api.text(ctx, 'Frozen test   /   required_policy_answer', 112, 249, 30, C.muted, 'left', 'mono');
  api.text(ctx, SUPPORT_QUESTION, 112, 328, 42, C.ink, 'left', 'serif');
  api.line(ctx, 112, 372, 1808, 372, C.blue, 3);

  focus.target('snapshot-comparison', () => {
    api.text(ctx, 'Registry expects', 112, 486, 30, C.muted);
    api.text(ctx, decision.registry.textSha256.slice(0, 12), 112, 560, 43, C.blue, 'left', 'mono');
    api.text(
      ctx,
      edited ? 'Edited file' : restored ? 'Restored file' : 'Approved file',
      885,
      486,
      30,
      C.muted,
    );
    api.text(ctx, decision.actual.slice(0, 12), 885, 560, 43, C.ink, 'left', 'mono');
    api.text(
      ctx,
      edited ? '“may not be restored”' : '“may be restored”',
      885,
      630,
      35,
      C.ink,
      'left',
      'serif',
    );
  });
  focus.target('rebuild-result', () => {
    api.text(ctx, 'Cited passage expected', 112, 760, 31, C.muted);
    api.text(ctx, 'access-policy-us-v3', 112, 830, 39, C.blue, 'left', 'mono');
    api.text(ctx, 'Candidate after rebuild', 885, 760, 31, C.muted);
    api.text(
      ctx,
      resultReady ? (available[0]?.record.documentId ?? 'None') : '?',
      885,
      830,
      39,
      C.ink,
      'left',
      'mono',
    );
    if (resultReady) {
      const refused =
        p('synthesis-fail') === 1
          ? 'Abstain · useful-answer test fails'
          : 'Abstain · citations: []';
      api.text(
        ctx,
        grounded ? 'Grounded again · original review applies' : refused,
        112,
        966,
        45,
        grounded ? C.green : C.pink,
      );
    } else if (p('synthesis-predict') > 0 && p('synthesis-restore') === 0)
      api.text(ctx, 'What will the rebuilt lookup return?', 112, 966, 43, C.yellow);
  });
}

export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'synthesis-edit',
    'synthesis-predict',
    'synthesis-abstain',
    'synthesis-fail',
    'synthesis-restore',
    'synthesis-pass',
  ],
};
