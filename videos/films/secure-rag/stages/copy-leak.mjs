import { secureEligibility, sourceRecord } from '../arithmetic.mjs';
import { PRINCIPAL, SECURE_SOURCES } from '../fixtures.mjs';
import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

// Synthetic capture receipts identify passages. They contain no runbook text.
const receipts = [
  { run: 'A', received: ['key', 'FAQ'], returned: ['FAQ'], cue: 'copies-a' },
  { run: 'B', received: ['FAQ'], returned: ['FAQ'], cue: 'copies-b' },
];
const mayRead = (id) =>
  secureEligibility(sourceRecord(SECURE_SOURCES.find((r) => r.id === id)), PRINCIPAL);

export function drawCopyLeak(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const label = (s, x, y, size, color = c.ink) => drawText(ctx, api, s, x, y, size, color);
  const counted = cue('copies-count').phase === 'after';

  api.focus.target('access', () => {
    label('Reader in tenant A   /   operations', 125, 285, 38, c.blue);
    label('FAQ   /   operations', 125, 360, 34);
    label('Key runbook   /   security', 785, 360, 34);
    drawLine(ctx, api, 125, 404, 1795, 404);
  });
  api.focus.target('captures', () => {
    label('Run', 125, 494, 33, c.muted);
    label('Passages received by reranker', 360, 494, 33, c.muted);
    label('Final retrieval result', 1290, 494, 33, c.muted);
    receipts.forEach((r, i) => {
      const y = 535 + i * 159;
      label(r.run, 137, y + 81, 59);
      drawRectangle(ctx, api, 350, y, 808, 114, c.muted);
      const open = cue(r.cue).progress;
      if (open === 0) label('Capture closed', 380, y + 70, 35, c.muted);
      r.received.slice(0, Math.ceil(open * r.received.length)).forEach((id, j) => {
        const x = 375 + 300 * j;
        const color = mayRead(id) ? c.green : c.pink;
        drawRectangle(ctx, api, x, y + 17, 260, 77, color);
        label(id === 'key' ? 'Key runbook' : id, x + 22, y + 69, 34, color);
      });
      drawRectangle(ctx, api, 1290, y, 486, 114, c.muted);
      if (cue('copies-returned').phase !== 'before')
        label(r.returned.join(' + '), 1320, y + 74, 43, c.ink);
    });
  });
  api.focus.target('witness', () => {
    drawLine(ctx, api, 125, 868, 1795, 868);
    if (counted) {
      label('Forbidden passages received', 125, 955, 37);
      receipts.forEach((r, i) => {
        const n = r.received.filter((id) => !mayRead(id)).length;
        label('Run ' + r.run + '    ' + n, 925 + i * 410, 958, 44, n ? c.pink : c.green);
      });
    } else if (cue('copies-question').phase !== 'before' && cue('copies-a').phase === 'before')
      label('Can the final results tell us what the reranker saw?', 125, 955, 40, c.yellow);
  });
}
export default {
  id: 'copy-leak',
  draw: drawCopyLeak,
  cues: [
    'copies-reader',
    'copies-returned',
    'copies-question',
    'copies-a',
    'copies-b',
    'copies-count',
    'copies-repair',
  ],
};
