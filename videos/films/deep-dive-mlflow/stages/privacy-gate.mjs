import { mix } from '../arithmetic.mjs';
import { mlflowSentenceProgress, sampleMlflowChapter } from '../construction.mjs';

// This example retains only the fields needed to look up the request and its outcome.
const captured = { trace_id: 'T104', status: 'OK', customer_note: 'Please email my receipt.' };
const exported = { trace_id: captured.trace_id, status: captured.status };

export function drawPrivacyGate(ctx, scene, state, api) {
  const { C } = api;
  const s = sampleMlflowChapter(scene.id, state);
  api.text(ctx, 'Span fields', 145, 311, 51, C.ink);
  api.text(ctx, 'Input capture off', 145, 391, 34, C.muted);
  for (const [i, [key, value]] of Object.entries(captured).entries()) {
    const y = 501 + i * 99;
    api.text(ctx, key, 145, y, 36, C.muted, 'left', 'mono');
    const note = key === 'customer_note';
    api.text(
      ctx,
      note && s.removed ? 'Removed' : value,
      497,
      y,
      36,
      note && !s.removed ? C.pink : C.ink,
    );
  }

  if (state.beat === 0) return;
  api.line(ctx, 975, 278, 975, 816, C.muted, 2);
  api.text(ctx, 'Export payload', 1060, 311, 51, C.ink);
  const transfer = mlflowSentenceProgress(scene.id, state, 1, 1);
  if (s.removed && transfer > 0) {
    const x = mix(1005, 1060, transfer);
    for (const [i, [key, value]] of Object.entries(exported).entries()) {
      const y = 501 + i * 99;
      api.text(ctx, key, x, y, 36, C.cyan, 'left', 'mono');
      api.text(ctx, value, x + 335, y, 41, C.ink);
    }
  }
  if (state.beat === 2 && mlflowSentenceProgress(scene.id, state, 2, 2) > 0)
    api.text(ctx, 'Apply the same field check to errors and exceptions.', 145, 947, 41, C.yellow);
}
export default {
  id: 'privacy-gate',
  draw: drawPrivacyGate,
  cues: [
    'mf-privacy-gate-0',
    'mf-sentence-privacy-gate-0-0',
    'mf-sentence-privacy-gate-0-1',
    'mf-sentence-privacy-gate-0-2',
    'mf-sentence-privacy-gate-0-3',
    'mf-privacy-gate-1',
    'mf-sentence-privacy-gate-1-0',
    'mf-sentence-privacy-gate-1-1',
    'mf-sentence-privacy-gate-1-2',
    'mf-sentence-privacy-gate-1-3',
    'mf-privacy-gate-2',
    'mf-sentence-privacy-gate-2-0',
    'mf-sentence-privacy-gate-2-1',
    'mf-sentence-privacy-gate-2-2',
    'mf-sentence-privacy-gate-2-3',
  ],
};
