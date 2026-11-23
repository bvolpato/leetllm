import { loraWorksheet } from '../arithmetic.mjs';
import { timedScene } from '../timed-scene.mjs';

const two = loraWorksheet(2);
const four = loraWorksheet(4);
const coordinate = 2;
const width = 4096;
const largeRank = 8;

export default timedScene('lora-geometry', [5, 5, 4, 5], (ctx, api, time) => {
  const { C, focus, teaching } = api;
  if (time.beat === 3) {
    focus.target('lora-count', () => {
      api.text(ctx, 'Toy layer   ·   6 in, 4 out', 155, 277, 40, C.ink);
      for (const [i, sheet] of [two, four].entries()) {
        const y = 390 + i * 90;
        api.text(ctx, 'Rank ' + sheet.rank, 155, y, 38, C.blue);
        const expression =
          sheet.rank + ' × (6 + 4)' + (time.done(3, 1) ? '  =  ' + sheet.parameters : '');
        api.text(ctx, expression, 610, y, 47, C.cyan);
      }
      if (time.done(3, 1)) api.text(ctx, 'Frozen W   ·   6 × 4 = 24', 1195, 439, 35, C.ink);
    });
    focus.target('lora-size', () => {
      api.text(ctx, 'Square layer   ·   4,096 in, 4,096 out', 155, 633, 41, C.ink);
      const count = largeRank * (2 * width);
      const base = width * width;
      const span = 950;
      api.text(ctx, 'Rank 8 factors', 155, 749, 35, C.cyan);
      api.text(ctx, 'Frozen base', 155, 865, 35, C.blue);
      if (time.done(3, 2)) {
        api.rect(ctx, 625, 710, (span * count) / base, 42, C.cyan, undefined, 0);
        api.text(ctx, count.toLocaleString('en-US') + ' trainable values', 665, 746, 34, C.cyan);
      }
      if (time.done(3, 3)) {
        api.rect(ctx, 625, 825, span, 42, C.blue, undefined, 0);
        api.text(ctx, base.toLocaleString('en-US') + ' frozen values', 625, 930, 34, C.blue);
      }
    });
    return;
  }
  const wider = time.done(2, 0);
  const sheet = wider ? four : two;
  focus.target('lora-input', () => {
    api.text(ctx, 'Input  [' + sheet.input.join(', ') + ']', 155, 251, 39, C.ink);
    api.text(
      ctx,
      time.done(0, 2)
        ? 'Frozen W x  [' + sheet.base.join(', ') + ']'
        : 'Frozen W x  [ ?, ?, ?, ? ]',
      1020,
      251,
      39,
      C.blue,
    );
  });
  const showA = wider ? time.done(2, 1) : time.done(1, 1);
  const showB = wider ? time.done(2, 1) : time.done(1, 2);
  focus.target('lora-factors', () => {
    function matrix(key, x, rows, color, result, visible) {
      focus.target(key === 'A' ? 'lora-a' : 'lora-b', () => {
        api.text(ctx, key, x, 332, 38, color);
        teaching.grid({
          x,
          y: 360,
          width: 685,
          height: 200,
          rows: rows.length,
          columns: rows[0].length,
          labels: rows.map((row) => row.map(String)),
          fontSize: 32,
          fill: C.panel,
          stroke: C.muted,
          textColor: color,
          highlights:
            key === 'B'
              ? rows[coordinate].map((_, column) => ({
                  row: coordinate,
                  column,
                  stroke: C.yellow,
                  fill: C.panel,
                }))
              : [],
        });
        const name = key === 'A' ? 'A x' : 'B A x';
        api.text(
          ctx,
          name + '  =  ' + (visible ? '[' + result.join(', ') + ']' : '?'),
          x,
          627,
          38,
          color,
        );
      });
    }
    matrix('A', 155, sheet.A, C.cyan, sheet.narrow, showA);
    matrix('B', 1020, sheet.B, C.yellow, sheet.expanded, showB);
  });
  focus.target('lora-ruler', () => {
    const axisX = (v) => 580 + (v + 4) * 263;
    const base = two.base[coordinate];
    const start = wider ? two.output[coordinate] : base;
    const final = sheet.output[coordinate];
    const p = wider ? time.progress(2, 2) : time.progress(1, 3);
    const settled = wider ? time.done(2, 2) : time.done(1, 3);
    api.text(ctx, 'Third output', 155, 810, 41, C.ink);
    api.line(ctx, axisX(-4), 800, axisX(0), 800, C.muted, 4);
    for (let tick = -4; tick <= 0; tick++) {
      api.line(ctx, axisX(tick), 790, axisX(tick), 812, C.muted, 3);
      api.text(ctx, String(tick), axisX(tick), 855, 33, C.ink, 'center');
    }
    if (time.done(0, 2)) {
      api.circle(ctx, axisX(base), 800, 13, C.blue);
      api.text(ctx, 'base', axisX(base), 744, 29, C.blue, 'center');
      const current = start + (final - start) * p;
      api.circle(ctx, axisX(current), 771, 13, C.green);
    }
    const formula = '−1 + ½ × (' + sheet.expanded[coordinate] + ')';
    if (showB) api.text(ctx, formula + ' = ' + (settled ? final : '?'), 155, 950, 43, C.green);
    if (settled)
      api.text(ctx, 'Adapted output  [' + sheet.output.join(', ') + ']', 1020, 950, 38, C.ink);
  });
});
