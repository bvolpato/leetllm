import {
  SUPPORT_PASSAGE,
  SUPPORT_QUESTION,
  negated,
  policy,
  supportVariants,
} from '../fixtures.mjs';
import { answer, sharedTerms, similarity, terms } from '../model.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';

const variants = ['entailed', 'contradicted', 'unknown', 'missing', 'stale'];

function compareClaims(ctx, api, p) {
  const { C, focus } = api;
  const insertion = p('support-insert');
  const claim = insertion === 1 ? negated : policy;
  const shared = sharedTerms(policy, claim).length;
  const total = new Set([...terms(policy), ...terms(claim)]).size;
  const score = similarity(policy, claim);
  const shifted = Math.min(1, 2 * insertion);
  const dropped = Math.max(0, 2 * insertion - 1);
  api.text(ctx, 'Published policy', 112, 246, 30, C.blue);
  api.text(ctx, policy, 112, 319, 45, C.ink, 'left', 'serif');
  api.line(ctx, 112, 365, 1805, 365, C.blue, 3);
  focus.target('claim-sentence', () => {
    api.text(ctx, 'Proposed claim', 112, 448, 30, C.muted);
    const size = 44;
    const prefix = 'Production API key access may ';
    const suffix = 'be restored after identity verification.';
    ctx.save();
    ctx.font = lessonFont(size, 'serif');
    const x = 112 + ctx.measureText(prefix).width;
    const gap = ctx.measureText('not ').width;
    ctx.restore();
    api.text(ctx, prefix, 112, 578, size, C.ink, 'left', 'serif');
    api.text(ctx, suffix, x + shifted * gap, 578, size, C.ink, 'left', 'serif');
    if (insertion > 0) api.text(ctx, 'not', x, 504 + dropped * 74, size, C.yellow, 'left', 'serif');
  });
  focus.target('word-fraction', () => {
    api.text(ctx, 'Terms in both', 112, 712, 29, C.muted);
    api.text(ctx, String(shared), 112, 790, 61, C.blue);
    api.text(ctx, 'Distinct terms in either', 490, 712, 29, C.muted);
    api.text(ctx, String(total), 490, 790, 61, C.ink);
    api.text(ctx, 'Shortcut accepts if', 1120, 712, 29, C.muted);
    api.text(ctx, 'J > 0.8', 1120, 787, 51, C.ink, 'left', 'mono');
  });
  focus.target('shortcut-verdict', () => {
    const resolved = p('support-fraction') === 1;
    let line = 'J = shared terms / distinct terms in either sentence';
    if (insertion === 0 && p('support-original') === 1)
      line = `${shared} / ${total} = ${score}     →     ${score > 0.8 ? 'accept' : 'reject'}`;
    if (p('support-guess') > 0) line = 'Will the shortcut accept the edited claim?';
    if (p('support-accept') === 1) line = 'Shortcut accepts the edited claim';
    if (resolved)
      line = `${shared} / ${total} ≈ ${score.toFixed(3)}     →     ${score > 0.8 ? 'accept' : 'reject'}`;
    api.text(ctx, line, 112, 934, 43, resolved ? C.yellow : C.ink);
  });
}

function reviewPassage(ctx, api, p) {
  const { C, focus } = api;
  const active = variants.filter((id) => p('receipt-' + id) > 0).at(-1);
  const response = answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, supportVariants[active ?? 'entailed']);
  const check = response.checks.find((field) => field.field === 'corpusVersion');
  api.text(ctx, SUPPORT_QUESTION, 112, 260, 39, C.ink, 'left', 'serif');
  api.text(ctx, 'Current passage', 112, 360, 29, C.muted);
  api.text(ctx, SUPPORT_PASSAGE.documentId, 112, 419, 34, C.blue, 'left', 'mono');
  api.text(ctx, 'Question and passage bound to one fixture review', 112, 513, 35, C.ink);
  focus.target('review-ledger', () => {
    api.line(ctx, 112, 565, 1808, 565, C.blue, 3);
    api.text(ctx, 'Supplied review', 112, 625, 30, C.muted);
    api.text(ctx, 'Result', 1115, 625, 30, C.muted);
    api.text(
      ctx,
      active === 'stale' ? 'Stale corpus version' : (active ?? 'Look up the exact question'),
      112,
      721,
      48,
      C.ink,
    );
    const ready =
      active === 'entailed'
        ? p('receipt-entailed') === 1
        : active && p('receipt-refusals-complete') === 1;
    const color = response.status === 'ANSWER' ? C.green : C.pink;
    api.text(ctx, ready ? response.status : 'Checking', 1115, 721, 51, ready ? color : C.muted);
    const detail =
      active === 'stale'
        ? `Receipt  ${check.receipt}     Current  ${check.current}`
        : active === 'missing'
          ? 'No receipt for this question and passage'
          : 'An approved review path binds the exact question, chunk, source bytes and corpus version.';
    api.text(ctx, detail, 112, 822, 32, C.muted);
    variants.forEach((id, i) => {
      if (p('receipt-' + id) === 0) return;
      const complete =
        id === 'entailed' ? p('receipt-entailed') === 1 : p('receipt-refusals-complete') === 1;
      const status = complete
        ? answer(SUPPORT_QUESTION, SUPPORT_PASSAGE, supportVariants[id]).status
        : '…';
      api.text(ctx, id + ': ' + status, 112 + i * 354, 947, 26, id === active ? C.ink : C.muted);
    });
  });
}

export function drawSupport(ctx, scene, state, api) {
  const p = (id) => api.focus.progress(id, 0);
  const inLedger = p('support-ledger') > 0 || variants.some((id) => p('receipt-' + id) > 0);
  if (inLedger) reviewPassage(ctx, api, p);
  else compareClaims(ctx, api, p);
}

export default {
  id: 'support',
  draw: drawSupport,
  cues: [
    'support-original',
    'support-insert',
    'support-count',
    'support-guess',
    'support-accept',
    'support-fraction',
    'support-ledger',
    ...variants.map((id) => 'receipt-' + id),
    'receipt-refusals-complete',
  ],
};
