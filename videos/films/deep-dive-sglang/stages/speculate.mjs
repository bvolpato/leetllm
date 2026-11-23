import { draft, target } from '../fixtures.mjs';
import { motion, settled } from '../construction.mjs';
import { speculativeState } from '../model.mjs';
import { line, slot, text } from '../defaults.mjs';

export function drawSpeculate(ctx, scene, state, api) {
  const { C } = api;
  const q = state.beatP;
  const s = speculativeState(Math.min(2, state.beat), q, state.cues);
  const proposed = Math.ceil(draft.length * motion(state, 'draft-words', 0, 0.15, 0.58));
  const next = settled(state, 'replacement-forward', 3, 0.68);
  const feed = motion(state, 'replacement-feed', 3, 0.2, 0.43);
  const ask = state.beat === 1 && settled(state, 'draft-ask', 1, 0.92);
  const first = 342,
    pitch = 174,
    w = 156,
    h = 88;
  text(ctx, api, 'Token position', 142, 290, 29, C.muted);
  for (let i = 0; i < draft.length; i++)
    text(ctx, api, String(i + 1), first + pitch * i + w / 2, 290, 33, C.muted, 'center');

  const row = (name, y, label, values, count, color) =>
    api.focus.target(name, () => {
      text(ctx, api, label, 142, y + 54, 36, C.ink);
      for (let i = 0; i < count; i++) {
        const value = values[i] ?? '';
        slot(ctx, api, value, first + i * pitch, y, w, h, color(i, value), 37);
      }
    });
  const activeDraft = draft
    .slice(0, proposed)
    .map((word, i) => (s.discarded && i >= s.accepted ? '' : word));
  row('draft-rail', 330, 'Draft', activeDraft, draft.length, (i, v) =>
    !v ? C.muted : s.mismatch && i === s.mismatch.index ? C.pink : C.ink,
  );
  row('target-rail', 476, 'Target', target.slice(0, s.compared), draft.length, (i, v) =>
    !v ? C.muted : i < s.accepted ? C.blue : C.yellow,
  );
  line(ctx, api, 142, 613, 1730, 613, C.muted, 2);
  row('output-rail', 662, 'Output', s.committed, draft.length, (_i, v) => (v ? C.green : C.muted));
  const cache = s.cache.map((entry) => entry.word);
  if (next && s.pendingForward) cache.push(s.pendingForward);
  row('kv-rail', 802, 'Ready KV', cache, draft.length, (_i, v) => (v ? C.cyan : C.muted));
  if (feed > 0 && !next && s.mismatch) {
    const x = first + pitch * s.mismatch.index + w / 2;
    line(ctx, api, x, 758, x, 793, C.muted, 3);
    api.circle(ctx, x, 758 + 35 * feed, 7, C.yellow);
  }

  let note = 'One word per token in this example';
  if (s.mismatch) note = 'First mismatch at position ' + (s.mismatch.index + 1);
  if (ask) note = 'Which word goes in output slot 6? Is its KV ready?';
  if (s.committed.length)
    note = s.committed.length + ' committed outputs   ·   ' + cache.length + ' ready KV positions';
  if (s.discarded) note += '   ·   discarded draft: ' + s.discardedWords.join(' ');
  if (next) note = 'After lake’s forward: KV is ready for all ' + cache.length + ' committed words';
  text(ctx, api, note, 960, 983, 35, ask ? C.yellow : C.ink, 'center');
}

export default {
  id: 'speculate',
  draw: drawSpeculate,
  cues: [
    'draft-words',
    'speculate-agreed-prefix',
    'speculate-beat-2-focus-1',
    'draft-ask',
    'speculate-commit-prefix',
    'speculate-beat-3-focus-1',
    'replacement-feed',
    'replacement-forward',
  ],
};
