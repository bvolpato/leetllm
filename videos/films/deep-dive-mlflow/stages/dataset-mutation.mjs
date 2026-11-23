import { mix } from '../arithmetic.mjs';
import { sampleMlflowChapter, mlflowSentenceProgress } from '../construction.mjs';
import { contentDigest } from '../defaults.mjs';
import { citationPass } from '../model.mjs';

const answer = { text: '30 days', citations: ['DOC-12'] };

export function drawDatasetMutation(ctx, scene, state, api) {
  const { C } = api;
  const s = sampleMlflowChapter(scene.id, state);
  const g = (beat, sentence) => mlflowSentenceProgress(scene.id, state, beat, sentence);
  api.text(ctx, 'Reply to the return-window question', 145, 260, 34, C.muted);
  api.text(ctx, answer.text, 145, 368, 84, C.ink);
  api.text(ctx, '[' + answer.citations.join(', ') + ']', 525, 360, 53, C.cyan);
  if (g(1, 2) > 0) api.text(ctx, 'Same dataset ID', 1030, 360, 38, C.muted);
  api.line(ctx, 145, 423, 1775, 423, C.muted, 2);

  const current = s.merged ? s.after : s.before;
  for (const [i, snapshot] of [s.before, current].entries()) {
    const x = i ? 1030 : 145;
    const allowed = snapshot[0].expectations.allowed_docs;
    const changed = i === 1 && s.merged;
    api.text(ctx, i ? 'Current record' : 'Saved snapshot', x, 515, 43, C.ink);
    api.text(ctx, 'Allowed source', x, 597, 32, C.muted);
    if (!i || s.move === 0 || s.merged)
      api.text(ctx, allowed.join(', '), x, 693, 74, changed ? C.yellow : C.cyan);
    if (g(1, 2) > 0)
      api.text(
        ctx,
        'SHA-256   ' + contentDigest(ctx, api, snapshot),
        x,
        770,
        30,
        C.muted,
        'left',
        'mono',
      );
    if (i ? s.resultReady : g(2, 0) >= 1) {
      const pass = citationPass(answer.citations, allowed);
      api.text(ctx, pass ? 'PASS' : 'FAIL', x, 874, 58, pass ? C.green : C.pink);
    }
  }

  if (s.move > 0 && !s.merged) {
    const x = mix(1560, 1030, s.move);
    const y = mix(842, 693, s.move);
    api.text(ctx, s.after[0].expectations.allowed_docs[0], x, y, 64, C.yellow);
  }
  let note = '';
  if (state.beat === 1 && g(1, 4) > 0) note = 'How does each snapshot score the same reply?';
  if (state.beat === 2 && g(2, 2) > 0)
    note = 'Save the question, allowed source and scorer settings together.';
  if (g(2, 4) > 0)
    note = 'Known failures for regression tests   /   Separate cases for holdout evaluation';
  if (note) api.text(ctx, note, 145, 991, 36, C.yellow);
}
export default {
  id: 'dataset-mutation',
  draw: drawDatasetMutation,
  cues: [
    'mf-dataset-mutation-0',
    'mf-sentence-dataset-mutation-0-0',
    'mf-sentence-dataset-mutation-0-1',
    'mf-sentence-dataset-mutation-0-2',
    'mf-sentence-dataset-mutation-0-3',
    'mf-dataset-mutation-1',
    'mf-sentence-dataset-mutation-1-0',
    'mf-sentence-dataset-mutation-1-1',
    'mf-sentence-dataset-mutation-1-2',
    'mf-sentence-dataset-mutation-1-3',
    'mf-sentence-dataset-mutation-1-4',
    'mf-dataset-mutation-2',
    'mf-sentence-dataset-mutation-2-0',
    'mf-sentence-dataset-mutation-2-1',
    'mf-sentence-dataset-mutation-2-2',
    'mf-sentence-dataset-mutation-2-3',
    'mf-sentence-dataset-mutation-2-4',
  ],
};
