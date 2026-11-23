import { asOf, permissions, publicationInput } from '../fixtures.mjs';
import { active, joinedRows } from '../model.mjs';
import { directed, sampleModel } from '../construction.mjs';
import { drawSqlText } from '../defaults.mjs';
import { coat, drawReturnSlip } from '../return-slip.mjs';

export function drawClosing(ctx, scene, state, api) {
  const { C } = api;
  const m = sampleModel('closing', state);
  const grants = [...permissions, ...publicationInput.grants];
  const rowY = (i) => 416 + 69 * i;
  const column = (x, label, target, values, progress, accepts) =>
    api.focus.target(target, () => {
      drawSqlText(ctx, api, label, x, 340, 27, C.muted);
      m.candidates.forEach((row, i) => {
        const checked = progress === 1;
        const color = checked ? (accepts(row) ? C.green : C.pink) : C.ink;
        drawSqlText(ctx, api, values(row), x, rowY(i), 28, color);
      });
    });
  drawSqlText(
    ctx,
    api,
    'support.sqlite  /  after publication  /  August 12 at noon UTC',
    135,
    267,
    32,
    C.blue,
  );
  api.line(ctx, 135, 362, 1785, 362, C.muted, 2);
  api.focus.target('final-candidates', () => {
    drawSqlText(ctx, api, 'Chunk', 125, 340, 27, C.muted);
    drawSqlText(ctx, api, 'Stored paragraph', 265, 340, 27, C.muted);
    m.candidates.forEach((row, i) => {
      drawSqlText(ctx, api, row.id, 125, rowY(i), 26, C.cyan);
      drawSqlText(ctx, api, row.text, 265, rowY(i), 28, C.ink);
    });
  });
  column(
    835,
    'Source edition',
    'closing-version',
    (r) => r.source.id,
    m.version,
    (r) => active(r.source, asOf),
  );
  column(
    1090,
    'At request time',
    'closing-time',
    (r) => (active(r.source) ? 'In force' : 'Ended ' + r.source.to.slice(5, 10)),
    m.version,
    (r) => active(r.source),
  );
  column(
    1410,
    'Store',
    'closing-store',
    (r) => (r.source.workspace === 'w01' ? 'Harbor' : 'Birch'),
    m.workspace,
    (r) => r.source.workspace === 'w01',
  );
  const names = (r) => grants.filter(([id]) => id === r.id).map(([, name]) => name);
  column(
    1620,
    'Readers',
    'closing-grant',
    (r) => names(r).join(', '),
    m.reader,
    (r) => names(r).includes('Bob'),
  );
  const answer = joinedRows(true).find((row) => m.answer.includes(row.id));
  api.focus.target('final-citation', () =>
    drawReturnSlip(ctx, api, {
      date: 'August 12',
      left: {
        label: 'Days since purchase',
        purchase: {
          showAge: true,
          windows: m.reveal ? [coat.julyWindow] : [coat.julyWindow, coat.earlierWindow],
          settled: directed(state, 'measure-overdue', 1) === 1 && Boolean(m.reveal),
        },
      },
      right: {
        label: 'Deadline Bob can cite',
        value: m.reveal ? answer.text : '',
        source: [answer.source.title, answer.source.id, answer.id].join(' · '),
        color: C.green,
      },
    }),
  );
}

export default {
  id: 'closing',
  draw: drawClosing,
  cues: [
    'reopen-final-file',
    'check-final-version',
    'check-final-workspace',
    'check-final-reader',
    'reveal-final-citation',
    'measure-overdue',
  ],
};
