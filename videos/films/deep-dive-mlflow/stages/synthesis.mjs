import { EVALUATED_MODEL_BYTES, required } from '../fixtures.mjs';
import { artifactDigest, canonicalContent } from '../arithmetic.mjs';
import { assess, citationPass, compareArtifacts, releaseAllowed } from '../model.mjs';
import { spokenScene } from '../pieces/scene.mjs';

// These retained teaching fixtures let both indexes return the same policy.
const policy = { id: 'DOC-12', text: 'Returns are accepted within 30 days of delivery.' };
const indexes = {
  I7: [policy],
  I8: [policy, { id: 'DOC-18', text: 'Keep the receipt for an exchange.' }],
};
const fixedInputs = {
  prompt: { version: 18, text: 'Answer the policy question. Cite the policy or abstain.' },
  model: { id: 'M3', digest: artifactDigest(EVALUATED_MODEL_BYTES) },
  temperature: 0.2,
};
function configBytes(index) {
  return canonicalContent({
    ...fixedInputs,
    index,
    indexDigest: artifactDigest(canonicalContent(indexes[index])),
  });
}
const evaluatedBytes = configBytes('I8');
const comparisons = (index) =>
  compareArtifacts({ evaluatedBytes, candidateBytes: configBytes(index) }, true);
const candidate = comparisons('I8');
const scores = assess(required.map((id) => ({ id, pass: true })));
const receipts = [
  { trace: 'T106', worker: 'East', index: 'I8' },
  { trace: 'T107', worker: 'West', index: 'I7' },
  { trace: 'T108', worker: 'West reloaded', index: 'I8' },
].map((r) => ({ ...r, reply: '30 days', citations: ['DOC-12'], identity: comparisons(r.index) }));

export default spokenScene('synthesis', (ctx, scene, state, api, g) => {
  const { C } = api;
  const moved = g(0, 1) > 0 && releaseAllowed(scores, candidate);
  api.text(ctx, 'Evaluated configuration', 145, 246, 34, C.cyan);
  api.text(ctx, 'Prompt v18   ·   temperature 0.2   ·   M3   ·   index I8', 145, 322, 39, C.ink);
  api.text(
    ctx,
    'SHA-256  ' + candidate.evaluatedDigest.slice(0, 12) + '…',
    1230,
    322,
    31,
    C.ink,
    'left',
    'mono',
  );
  api.text(ctx, 'Citation checks   A ✓    B ✓    C ✓', 145, 397, 32, C.green);
  api.text(ctx, moved ? 'production → v18' : 'production → v17', 1230, 397, 33, C.yellow);
  api.line(ctx, 145, 436, 1775, 436, C.muted, 2);
  const x = [145, 552, 984, 1303];
  ['Request / worker', 'Reply and source', 'Loaded index', 'SHA-256 prefix'].forEach((s, i) =>
    api.text(ctx, s, x[i], 510, 29, C.muted),
  );
  for (const [i, r] of receipts.entries()) {
    const replay = i === 2;
    if ((replay ? g(2, 0) : g(0, 2)) <= 0) continue;
    const y = 593 + 116 * i;
    if (i > 0 && g(2, 4) > 0)
      api.line(ctx, 124, y - 34, 124, y + 47, i === 1 ? C.pink : C.green, 6);
    const open = (replay ? g(2, 1) : g(0, 3)) > 0;
    const decided = i === 0 ? g(1, 0) > 0 : i === 1 ? g(1, 1) > 0 : g(2, 1) >= 1;
    const color = decided ? (r.identity.digestMatches ? C.green : C.pink) : C.ink;
    api.text(ctx, r.trace + '   ' + r.worker, x[0], y, replay ? 32 : 36, C.blue);
    if (!replay || g(2, 2) > 0)
      api.text(ctx, r.reply + '    [' + r.citations.join(', ') + ']', x[1], y, 34, C.ink);
    if (open) {
      api.text(ctx, r.index, x[2], y, 42, color);
      api.text(
        ctx,
        r.identity.candidateDigest.slice(0, 12) + '…',
        x[3],
        y,
        33,
        color,
        'left',
        'mono',
      );
      if (decided)
        api.text(ctx, r.identity.digestMatches ? 'MATCH' : 'DIFFERS', x[3], y + 42, 24, color);
    }
    api.line(ctx, 145, y + 61, 1775, y + 61, C.muted, 1);
  }
  let note = '';
  if (state.beat === 0 && g(0, 4) > 0) note = 'Which worker served the evaluated configuration?';
  if (state.beat === 1 && g(1, 3) > 0) note = 'Which part would you reload on West?';
  const replay = receipts[2];
  if (state.beat === 2 && g(2, 2) > 0 && citationPass(replay.citations, [policy.id])) {
    const cited = indexes[replay.index].find((doc) => doc.id === replay.citations[0]);
    note =
      g(2, 3) > 0
        ? `Saved ${cited.id}   /   “${cited.text}”`
        : 'T108   ·   configuration matches   ·   allowed citation present';
  }
  if (note) api.text(ctx, note, 145, 1002, 36, C.yellow);
});
