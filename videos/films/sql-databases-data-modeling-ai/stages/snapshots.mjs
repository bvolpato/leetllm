import { mix } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawSqlText, withSqlFade } from '../defaults.mjs';

const slots = [
  ['Deadline', 'c7a', 'c7c'],
  ['Receipt', 'c7b', 'c7d'],
  ['Clothing tags', null, 'c7e'],
  ['Staff exception', 'c9a', 'c9a'],
];

export function drawSnapshots(ctx, scene, state, api) {
  const { C } = api;
  const m = sampleModel('snapshots', state);
  const source = (x, name, rows, version, color) => {
    drawSqlText(ctx, api, name, x, 315, 33, color);
    api.line(ctx, x, 340, x + 670, 340, color, 3);
    for (const [i, [label, oldId, newId]] of slots.entries()) {
      const id = version === 0 ? oldId : newId;
      const entry = rows.find((row) => row.id === id);
      const y = 408 + i * 79;
      drawSqlText(ctx, api, label, x, y, 27, C.muted);
      if (entry) drawSqlText(ctx, api, entry.id + '  /  ' + entry.document, x + 285, y, 30, color);
      else api.line(ctx, x + 285, y - 8, x + 395, y - 8, C.muted, 2);
    }
  };
  source(145, 'S0   ·   Harbor before commit', m.before, 0, C.blue);
  api.focus.target('snapshot-publication', () => {
    drawSqlText(ctx, api, 'Publication', 960, 268, 26, C.muted, 'center');
    api.line(ctx, 850, 305, 1060, 305, C.muted, 2);
    api.circle(ctx, mix(850, 1060, m.commit), 305, 8, C.yellow, C.yellow, 2);
    if (m.commit > 0)
      withSqlFade(ctx, api, m.commit, () =>
        source(1100, 'S1   ·   Harbor after commit', m.after, 1, C.green),
      );
  });

  const xCount = 745,
    xList = 1000;
  drawSqlText(ctx, api, 'Evaluation export', 145, 741, 33, C.ink);
  drawSqlText(ctx, api, 'COUNT', xCount, 741, 27, C.muted);
  drawSqlText(ctx, api, 'Detail rows', xList, 741, 27, C.muted);
  api.line(ctx, 145, 766, 1780, 766, C.muted, 2);
  drawSqlText(ctx, api, 'Read Committed', 145, 832, 31, C.ink);
  api.focus.target('snapshot-count', () => {
    const count = m.readCommitted.count;
    drawSqlText(ctx, api, count === null ? '…' : count + '   S0', xCount, 832, 32, C.blue);
  });
  const printList = (query, y, color) => {
    if (query.details) {
      const ids = query.details.map((row) => row.id).join('   ');
      drawSqlText(ctx, api, ids, xList, y, 30, color);
      drawSqlText(
        ctx,
        api,
        query.details.length + ' rows  /  ' + query.detailSnapshot,
        1775,
        y,
        27,
        color,
        'right',
      );
    } else api.line(ctx, xList, y - 7, xList + 400, y - 7, C.muted, 2);
  };
  api.focus.target('snapshot-details', () => printList(m.readCommitted, 832, C.green));
  if (state.beat >= 2)
    api.focus.target('pinned-details', () => {
      drawSqlText(ctx, api, 'Repeatable Read', 145, 947, 31, C.ink);
      drawSqlText(ctx, api, m.repeatableRead.count + '   S0', xCount, 947, 32, C.blue);
      printList(m.repeatableRead, 947, C.blue);
      if (m.pin > 0) api.line(ctx, xCount, 971, mix(xCount, 1765, m.pin), 971, C.blue, 3);
    });
}
export default {
  id: 'snapshots',
  draw: drawSnapshots,
  cues: ['capture-first-count', 'snapshot-commit', 'read-new-snapshot', 'retain-read-snapshot'],
};
