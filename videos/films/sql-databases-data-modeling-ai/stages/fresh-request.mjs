import { clamp, mix } from '../arithmetic.mjs';
import { directed, extendedSqlState } from '../construction.mjs';
import { eligibleRows, septemberGrants } from '../model.mjs';
import { drawSqlText } from '../defaults.mjs';
import { drawReturnSlip } from '../return-slip.mjs';

const august = '2026-08-31';
const september = '2026-09-01';
const leftEdge = Date.parse(august);
const rightEdge = Date.parse('2026-09-02');
const timeX = (instant) => mix(1020, 1410, clamp((instant - leftEdge) / (rightEdge - leftEdge)));

export function drawFreshRequest(ctx, scene, state, api) {
  const { C } = api;
  const m = extendedSqlState('fresh-request', state);
  const travel = directed(state, 'advance-slip-date', 0);
  const atSeptember = travel === 1;
  const prior = eligibleRows(m.rows, { principal: 'Bob', workspace: 'Harbor', time: august });
  const deadline =
    travel === 0
      ? prior.find((r) => r.id === 'old')
      : m.repair
        ? m.allowed.find((r) => r.id === 'c80')
        : undefined;
  const receipt = m.revealed ? m.allowed.find((r) => r.id === 'c81') : undefined;

  drawSqlText(ctx, api, 'Policy file  /  September change of edition', 135, 264, 33, C.blue);
  const head = (str, x) => drawSqlText(ctx, api, str, x, 340, 27, C.muted);
  head('Chunk / doc', 135);
  head('Stored text', 315);
  head('Store', 825);
  m.rows.forEach((row, i) => {
    const y = 408 + 90 * i;
    const printSource = () => {
      drawSqlText(ctx, api, row.id, 135, y, 29, C.cyan);
      drawSqlText(ctx, api, row.document, 135, y + 32, 23, C.muted);
      drawSqlText(ctx, api, row.text, 315, y, 29, C.ink);
    };
    if (row.id === 'c80') api.focus.target('deadline-source', printSource);
    else printSource();
    api.focus.target(row.id === 'c82' ? 'birch-store' : 'harbor-store', () => {
      drawSqlText(ctx, api, row.workspace, 825, y, 29, C.ink);
    });
  });
  api.focus.target('grant-ledger', () => {
    drawSqlText(ctx, api, 'Permission rows', 1480, 264, 33, C.blue);
    head('Chunk', 1495);
    head('Reader', 1660);
    api.line(ctx, 1475, 355, 1795, 355, C.blue, 2);
    septemberGrants(m.repairApplied).forEach(([chunk, reader], i) => {
      const y = 407 + i * 71;
      const inserted = chunk === 'c80' && reader === 'Bob';
      api.focus.target(inserted ? 'bob-deadline-grant' : 'grants-' + chunk, () => {
        if (inserted) api.rect(ctx, 1476, y - 38, 318, 55, C.panel, C.green, 3, 4);
        drawSqlText(ctx, api, chunk, 1495, y, 29, inserted ? C.green : C.ink);
        drawSqlText(ctx, api, reader, 1660, y, 29, inserted ? C.green : C.ink);
      });
    });
  });
  api.focus.target('effective-intervals', () => {
    const center = timeX(Date.parse(september));
    for (const [x, date] of [
      [1020, 'Aug 31'],
      [center, 'Sep 1'],
      [1410, 'Sep 2'],
    ])
      drawSqlText(ctx, api, date, x, 340, 24, C.muted, 'center');
    const probe = mix(1020, center, travel);
    api.line(ctx, probe, 360, probe, 712, C.yellow, 3);
    m.rows.forEach((row, i) => {
      const y = 399 + 90 * i;
      const from = Date.parse(row.start);
      const x = timeX(from);
      if (row.end) {
        const end = timeX(Date.parse(row.end));
        api.line(ctx, x, y, end - 9, y, C.cyan, 5);
        api.circle(ctx, end, y, 9, C.bg, C.cyan, 3);
      } else {
        api.arrow(ctx, x, y, 1420, y, C.cyan, 5);
      }
      if (from >= leftEdge) api.circle(ctx, x, y, 9, C.cyan, C.cyan, 2);
    });
  });
  const field = (label, row) => ({
    label,
    value: row?.text,
    source: row && row.workspace + '  /  ' + row.document + '  /  ' + row.id,
    color: C.green,
  });
  api.focus.target('september-slip', () =>
    drawReturnSlip(ctx, api, {
      date: atSeptember ? 'September 1' : 'August 31',
      left: { ...field('Deadline', deadline), target: 'deadline-field' },
      right: field('Receipt', receipt),
    }),
  );
}

export default {
  id: 'fresh-request',
  draw: drawFreshRequest,
  cues: [
    'advance-slip-date',
    'read-deadline-grant',
    'inspect-birch',
    'fresh-request-step-1-4',
    'fresh-request-step-1-6',
    'fresh-request-step-1-8',
    'trace-deadline',
    'trace-new-grant',
  ],
};
