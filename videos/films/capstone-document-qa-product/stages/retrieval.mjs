import { LAB_POLICY, PARAPHRASE, SUPPORT_QUESTION, policy } from '../fixtures.mjs';
import { sharedTerms, terms } from '../model.mjs';

export function drawRetrieval(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  const changed = p('retrieval-reword') > 0;
  const question = changed ? PARAPHRASE : SUPPORT_QUESTION;
  const hits = sharedTerms(question, LAB_POLICY);
  const scanned = changed ? p('retrieval-rescan') : p('retrieval-count');
  const words = [...terms(policy)];
  const inspected = Math.floor(words.length * scanned);
  const matched = words.slice(0, inspected).filter((word) => hits.includes(word));
  api.text(ctx, 'access-policy-us-v3', 112, 260, 33, C.blue, 'left', 'mono');
  api.text(ctx, policy, 112, 338, 44, C.ink, 'left', 'serif');
  api.line(ctx, 112, 382, 1808, 382, C.blue, 3);
  focus.target('query-text', () => {
    api.text(ctx, changed ? 'Reviewed rewording' : 'Support desk question', 112, 460, 30, C.muted);
    api.text(ctx, question, 112, 536, 39, changed ? C.yellow : C.ink, 'left', 'serif');
  });
  focus.target('term-scan', () => {
    api.text(ctx, 'Distinct policy terms in the first sentence', 112, 665, 29, C.muted);
    words.forEach((word, i) => {
      const x = 112 + i * 211;
      const color = i >= inspected ? C.muted : hits.includes(word) ? C.cyan : C.muted;
      api.text(ctx, word, x + 94, 748, 31, color, 'center');
      api.line(ctx, x, 779, x + 188, 779, matched.includes(word) ? C.cyan : C.panel, 7);
    });
    if (changed && scanned > 0) {
      const scanX = 112 + scanned * ((words.length - 1) * 211 + 188);
      api.line(ctx, 112, 812, scanX, 812, C.yellow, 3);
      api.circle(ctx, scanX, 812, 8, C.yellow);
    }
  });
  focus.target('candidate-count', () => {
    api.text(ctx, 'Shared terms', 112, 915, 32, C.muted);
    const countReady = !changed || p('retrieval-zero') === 1;
    api.text(ctx, countReady ? String(matched.length) : '…', 360, 918, 52, C.ink);
    api.text(ctx, 'Minimum  2', 565, 915, 34, C.ink);
    const done = changed ? p('retrieval-miss') === 1 : p('retrieval-hit') === 1;
    if (done)
      api.text(
        ctx,
        hits.length >= 2 ? 'Keep this passage' : 'No candidate',
        1115,
        917,
        44,
        hits.length >= 2 ? C.green : C.pink,
      );
  });
}

export default {
  id: 'retrieval',
  draw: drawRetrieval,
  cues: [
    'retrieval-count',
    'retrieval-hit',
    'retrieval-reword',
    'retrieval-rescan',
    'retrieval-zero',
    'retrieval-miss',
  ],
};
