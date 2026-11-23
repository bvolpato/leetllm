import { chunks } from '../fixtures.mjs';
import { directed, sampleModel } from '../construction.mjs';
import { drawSqlText, withSqlFade } from '../defaults.mjs';
import { coat } from '../return-slip.mjs';

const current = chunks.find((row) => row.id === 'c7a');
const earlier = chunks.find((row) => row.id === 'c7-old');
const dayX = (day) => 910 + 28 * day;

function drawReceipt(ctx, api) {
  const { C } = api;
  const left = 160,
    right = 730,
    center = (left + right) / 2;
  const edge = [
    { x: left, y: 221 },
    { x: right, y: 221 },
  ];
  for (let i = 0; i <= 30; i++) edge.push({ x: right - 19 * i, y: i % 2 ? 939 : 924 });
  api.path(ctx, edge, { closed: true, fill: C.ink, width: 0 });
  api.text(ctx, 'Harbor', center, 324, 76, C.bg, 'center', 'serif');
  api.text(ctx, 'RETURN SLIP', center, 381, 28, C.bg, 'center', 'mono');
  api.line(ctx, left + 48, 421, right - 48, 421, C.bg, 2);
  drawSqlText(ctx, api, 'Coat', left + 48, 497, 54, C.bg);
  api.text(ctx, 'Qty  1', right - 48, 490, 30, C.bg, 'right', 'mono');
  for (const [i, [label, value]] of [
    ['Purchased', 'July 25'],
    ['At the desk', 'August 12'],
  ].entries()) {
    const y = 568 + i * 57;
    drawSqlText(ctx, api, label, left + 48, y, 33, C.bg);
    drawSqlText(ctx, api, value, right - 48, y, 34, C.bg, 'right');
  }
  api.line(ctx, left + 48, 669, right - 48, 669, C.bg, 2);
  api.text(ctx, String(coat.age), center, 820, 158, C.bg, 'center', 'serif');
  drawSqlText(ctx, api, 'days since purchase', center, 880, 34, C.bg, 'center');
}

export function drawOpening(ctx, scene, state, api) {
  const { C } = api;
  const { restart, memory } = sampleModel('opening', state);
  const read = directed(state, 'read-file-candidates', 0, 0.58, 0.78);
  const age = directed(state, 'place-purchase', 0, 0.05, 0.2);
  const x = dayX(0);
  const evidence = (row, y) => {
    drawSqlText(ctx, api, row.text, 970, y, 46, C.ink);
    api.text(ctx, row.id + '  /  ' + row.document, 970, y + 52, 26, C.blue, 'left', 'mono');
  };

  api.focus.target('purchase-age', () => drawReceipt(ctx, api));
  api.focus.target('process-area', () => {
    drawSqlText(
      ctx,
      api,
      restart === 1 ? 'Support app restarted' : 'Open in the support app',
      x,
      297,
      34,
      C.blue,
    );
    withSqlFade(ctx, api, memory, () => evidence(current, 390));
  });
  api.focus.target('durable-copy', () => {
    if (restart === 1) {
      api.text(ctx, 'support.sqlite', x, 368, 32, C.cyan, 'left', 'mono');
      evidence(current, 449);
      withSqlFade(ctx, api, read, () => evidence(earlier, 572));
    }
  });

  const window = (day, y, color) => {
    api.line(ctx, x, y, dayX(day), y, color, 14);
    api.circle(ctx, dayX(day), y, 11, color);
    drawSqlText(ctx, api, day + ' days', dayX(day), y - 30, 33, color, 'center');
  };
  window(coat.julyWindow, 735, C.cyan);
  withSqlFade(ctx, api, read, () => window(coat.earlierWindow, 823, C.blue));
  api.focus.target('purchase-age', () => {
    const marker = dayX(coat.age);
    api.line(ctx, marker, 700, marker, 845, C.yellow, 4);
    api.circle(ctx, marker, 845 - 110 * age, 9, C.yellow);
    drawSqlText(ctx, api, 'Day ' + coat.age, marker, 910, 38, C.yellow, 'center');
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['place-purchase', 'restart-memory', 'read-file-candidates'],
};
