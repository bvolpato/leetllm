import { resultAfter } from '../../../lib/lesson-definition.mjs';
import { drawPagePool, privateHistory } from '../page-pool.mjs';

export function drawPages(ctx, scene, state, api) {
  const answered = resultAfter(state, 'pages-write-thirty-two');
  const next = resultAfter(state, 'pages-next-position');
  const blocked = resultAfter(state, 'pages-no-block');
  const asking = state.cues['pages-first-question'].phase !== 'before';
  const pendingPosition = next ? 33 : answered ? undefined : asking ? 32 : undefined;
  const history = privateHistory({ bTokens: answered ? 32 : 31 });
  let tracedPage;
  for (const [owner, id] of [
    ['A', 'pages-a-chain'],
    ['B', 'pages-b-chain'],
  ]) {
    const cue = state.cues[id];
    if (cue.phase === 'during') {
      const table = history.tables[owner];
      tracedPage = table[Math.min(table.length - 1, Math.floor(cue.progress * table.length))];
    }
  }
  let note = '16 positions per page · 78 occupied · 2 empty';
  if (asking) note = 'Where can B store position 32?';
  if (answered) note = 'Position 32 fills the last slot in P3.';
  if (next) note = 'Can B use the empty slot in P4 for position 33?';
  if (blocked) note = 'B waits for a whole page. P4 still belongs to A.';
  drawPagePool(ctx, api, history, {
    pendingPosition,
    markedPosition: answered ? 32 : undefined,
    tracedPage,
    note,
    noteColor: blocked ? api.C.yellow : api.C.ink,
  });
}
export default {
  id: 'pages',
  draw: drawPages,
  cues: [
    'pages-read-tables',
    'pages-a-chain',
    'pages-b-chain',
    'pages-first-question',
    'pages-write-thirty-two',
    'pages-next-position',
    'pages-no-block',
  ],
};
