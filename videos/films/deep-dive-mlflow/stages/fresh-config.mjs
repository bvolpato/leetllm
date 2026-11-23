import { sampleMlflowChapter } from '../construction.mjs';
import { canonicalContent, artifactDigest } from '../arithmetic.mjs';
import { spokenScene } from '../pieces/scene.mjs';

export default spokenScene('fresh-config', (ctx, scene, state, api, g) => {
  const { C } = api;
  const s = sampleMlflowChapter(scene.id, state);
  const digest = (t) =>
    artifactDigest(canonicalContent({ prompt: 21, index: 'I9', temperature: t }));
  api.text(ctx, 'Evaluated    v21   /   I9   /   temperature 0.2', 145, 285, 42, C.ink);
  api.text(
    ctx,
    'RET-210  ✓     RET-211  ✓      ·      SHA-256  ' + digest(0.2).slice(0, 12) + '…',
    145,
    353,
    30,
    C.green,
  );
  const fields = [
    ['Held by worker 1', s.held],
    ['Registry', s.registry],
    ['Fresh on worker 2', s.fresh],
  ];
  for (const [i, [label, value]] of fields.entries()) {
    const x = 150 + 576 * i;
    api.text(ctx, label, x, 494, 35, C.muted);
    api.line(ctx, x, 527, x + 480, 527, C.muted, 2);
    api.text(
      ctx,
      value === null ? 'Awaiting load' : value.toFixed(1),
      x,
      656,
      value === null ? 42 : 78,
      C.ink,
    );
    if (value !== null)
      api.text(ctx, 'SHA-256  ' + digest(value).slice(0, 12) + '…', x, 749, 28, C.cyan);
  }
  const question = 'Which loaded configuration can reuse the earlier scores?';
  const note =
    state.beat === 0
      ? g(0, 4) > 0
        ? question
        : ''
      : s.repaired
        ? 'Both loaded copies match the retained evaluation.'
        : s.mismatch
          ? 'Worker 1 matches. Evaluate worker 2 at temperature 0.8.'
          : state.beat === 2
            ? 'Compare the reloaded bytes with the evaluated copy.'
            : 'Compare each load with the retained evaluation.';
  if (note) api.text(ctx, note, 145, 945, 39, C.yellow);
});
