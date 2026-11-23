import { transpose } from './arithmetic.mjs';
import { chapterText } from './defaults.mjs';

const entries = transpose(4);
const watched = entries.find((entry) => entry.value === 6);
const destination = (entry) => 4 * entry.target[0] + entry.target[1];
const expected = new Float32Array(16);
for (const entry of entries) expected[destination(entry)] = entry.value;
const expectedBits = new Uint32Array(expected.buffer);

const otherStores = entries.filter((entry) => entry !== watched);
const passes = {
  first: [watched, ...otherStores],
  skipped: otherStores,
  repaired: [...otherStores, watched],
};

export function copyPass(initial, pass, count) {
  const words = new Uint32Array(16);
  if (initial === 'previous') words.set(expectedBits);
  else words.fill(0xffffffff);
  const written = new Set();
  for (const entry of passes[pass].slice(0, count)) {
    const slot = destination(entry);
    words[slot] = expectedBits[slot];
    written.add(slot);
  }
  return {
    words,
    written,
    mismatches: words.reduce((n, word, i) => n + Number(word !== expectedBits[i]), 0),
    values: Array.from(new Float32Array(words.buffer), (v, i) =>
      initial === 'empty' && !written.has(i) ? '' : Number.isNaN(v) ? 'NaN' : String(v),
    ),
  };
}

export function drawCopyPass(
  ctx,
  api,
  snapshot,
  { origin, step, readout, travel, inspection, indices, rowCloseup },
) {
  const { C, focus, teaching } = api;
  const grid = (values, x, highlights, color) =>
    teaching.grid({
      x,
      y: 348,
      width: 544,
      height: 408,
      rows: 4,
      columns: 4,
      labels: Array.from({ length: 4 }, (_, i) => values.slice(i * 4, i * 4 + 4)),
      fill: C.panel,
      stroke: color,
      textColor: C.ink,
      fontSize: 48,
      highlights,
    });
  chapterText(ctx, api, rowCloseup ? 'Input A  ·  row 1' : 'Input A', 496, 288, 42, C.blue);
  chapterText(ctx, api, 'Output B', 1424, 288, 42, C.cyan);
  focus.target('copy-input', () => {
    if (rowCloseup) {
      const row = entries.filter((entry) => entry.source[0] === watched.source[0]);
      row.forEach((entry, column) => {
        const x = 156 + column * 160;
        const selected = entry === watched;
        api.rect(
          ctx,
          x,
          376,
          154,
          152,
          selected ? C.yellow : C.panel,
          selected ? C.yellow : C.line,
          6,
        );
        chapterText(ctx, api, entry.value, x + 77, 483, 88, selected ? C.bg : C.muted);
        chapterText(ctx, api, column, x + 77, 356, 28, selected ? C.yellow : C.muted);
      });
    } else
      grid(
        entries.map((e) => e.value),
        224,
        [{ row: 1, column: 2, fill: '#645526', stroke: C.yellow }],
        C.blue,
      );
    chapterText(
      ctx,
      api,
      indices ? 'Input word   1 × 4 + 2 = 6' : 'A[1, 2]  =  6',
      496,
      rowCloseup ? 710 : 834,
      37,
      C.yellow,
    );
  });
  focus.target('copy-output', () => {
    const marks = [...snapshot.written]
      .map((slot) => ({
        row: Math.floor(slot / 4),
        column: slot % 4,
        fill: '#214958',
        stroke: C.cyan,
      }))
      .filter((m) => m.row !== 2 || m.column !== 1);
    marks.push({
      row: 2,
      column: 1,
      stroke: C.yellow,
      fill: snapshot.written.has(9) ? '#214958' : '#453d2a',
    });
    grid(snapshot.values, 1152, marks, C.muted);
    chapterText(
      ctx,
      api,
      indices ? 'Output word   2 × 4 + 1 = 9' : 'B[2, 1]',
      1424,
      834,
      37,
      C.yellow,
    );
  });
  if (travel !== undefined) {
    const route = [
      { x: 553, y: 532 },
      { x: 553, y: 603 },
      { x: 1070, y: 603 },
      { x: 1070, y: 552 },
      { x: 1356, y: 552 },
      { x: 1356, y: 575 },
    ];
    focus.target('copy-transfer', () => {
      api.path(ctx, route.slice(0, -1), { color: '#887238', width: 4 });
      if (travel > 0) {
        api.trace(ctx, route, travel, C.yellow, 5);
        const { x, y } = api.pointAlongPath(route, travel);
        if (x > 553 && x < 1070) {
          api.circle(ctx, x, y, 32, C.yellow);
          chapterText(ctx, api, watched.value, x, y + 13, 39, C.bg);
        }
      }
    });
  }
  focus.target('copy-status', () => {
    chapterText(ctx, api, origin, 960, 225, 30, C.muted);
    chapterText(ctx, api, step, 960, 915, 40, C.ink);
    chapterText(ctx, api, readout, 960, 995, 36, inspection ? C.yellow : C.muted);
  });
}
