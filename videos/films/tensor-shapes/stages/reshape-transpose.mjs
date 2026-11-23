import { reshapeBatch0, sentenceWords, sequence0, tensor, transposeBatch0 } from '../fixtures.mjs';
import { complete, event } from '../construction.mjs';
import { layoutFrame } from '../model.mjs';
import { caption, numberGrid, target, text } from '../defaults.mjs';

export function drawReshapeTranspose(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const frame = layoutFrame(state);
  const compare = event(state, 2, 'compare-layout-owners');
  const stride = event(state, 1, 'read-word-stride');
  const measure = event(state, 1, 'measure-word-stride');
  const words = sentenceWords[0];
  const ink = [C.blue, C.yellow, C.cyan];
  const owner = (v) => Math.floor(v / sequence0[0].length);
  const tracked = sequence0[1][3];
  let active = frame.active;
  if (beat === 0) active = frame.order[frame.processed - 1];
  if (beat === 2) active = compare > 0 ? tracked : null;

  target(ctx, api, 'original-layout', () =>
    target(ctx, api, 'memory-stream', () => {
      text(ctx, api, 'Stored values  ·  sentence 0', 960, 793, 31, C.ink, 'center');
      const start = 234,
        cell = 121;
      for (const [t, row] of sequence0.entries()) {
        const x = start + cell * row.length * t;
        const mark = beat === 1 && stride > 0 ? row.at(-1) : active;
        text(ctx, api, words[t], x + cell * 2, 849, 30, ink[t], 'center');
        numberGrid(ctx, api, [row], x, 870, cell * row.length, 78, ink[t], 'buffer-word-' + t, {
          fontSize: 33,
          highlights: row.includes(mark)
            ? [{ row: 0, column: row.indexOf(mark), stroke: C.ink, fill: C.panel }]
            : [],
        });
        const progress = t === 0 ? stride : measure;
        if (beat === 1 && t < 2 && progress > 0) {
          const from = x + 3.5 * cell;
          api.arrow(ctx, from, 965, from + 4 * cell * progress, 965, C.yellow, 4);
          if (t === 0 && measure > 0)
            text(ctx, api, '4 positions × 4 bytes = 16 bytes', from + 2 * cell, 1010, 30,
              C.yellow, 'center');
        }
      }
    }),
  );

  for (const [lane, rows] of [reshapeBatch0, transposeBatch0].entries()) {
    if (lane === 1 && beat === 0) continue;
    const x = 272 + lane * 865,
      width = 550,
      y = 380,
      rowHeight = 80;
    const ready = beat > lane ? 12 : frame.processed;
    const values = rows.map((row, r) => row.map((value, c) => (r * 3 + c < ready ? value : '')));
    const highlights = [];
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const v = rows[r][c];
        if (values[r][c] === '' && !(beat === lane && v === active)) continue;
        highlights.push({
          row: r,
          column: c,
          fill: C.panel,
          stroke: v === active ? C.ink : ink[owner(v)],
        });
      }
    }
    target(ctx, api, lane === 0 ? 'reshaped-layout' : 'transposed-layout', () => {
      text(
        ctx,
        api,
        lane === 0 ? 'x.reshape(2, 4, 3)' : 'x.transpose(0, 2, 1)',
        x + width / 2,
        278,
        39,
        C.ink,
        'center',
      );
      if (lane === 1) {
        words.forEach((word, c) =>
          text(ctx, api, word, x + ((c + 0.5) * width) / 3, 348, 26, ink[c], 'center'),
        );
        rows.forEach((_, r) =>
          text(ctx, api, 'f' + r, x - 18, y + rowHeight * (r + 0.5) + 10, 26, C.muted, 'right'),
        );
      }
      numberGrid(ctx, api, values, x, y, width, rowHeight * 4, C.muted, 'layout-grid-' + lane, {
        highlights,
        fontSize: 35,
      });
      if (beat === 2 && complete(compare)) {
        const index = rows.findIndex((row) => row.includes(tracked));
        text(
          ctx,
          api,
          (lane === 0 ? 'Row ' : 'Feature ') + index + '   [ ' + rows[index].join('   ') + ' ]',
          x + width / 2,
          753,
          30,
          lane === 0 ? C.muted : C.cyan,
          'center',
        );
      }
    });
  }

  if (beat === 0) {
    if (event(state, 0, 'infer-row-count') > 0) {
      target(ctx, api, 'row-count', () => {
        const width = sequence0[0].length;
        text(ctx, api, `Both sentences  ·  ${tensor.length} values`, 1390, 350, 33, C.muted, 'center');
        text(ctx, api, `x.reshape(-1, ${width})`, 1390, 460, 46, C.ink, 'center');
        if (complete(event(state, 0, 'show-row-count'))) {
          const calculation = `${tensor.length} ÷ ${width} = ${tensor.length / width} rows`;
          text(ctx, api, calculation, 1390, 565, 42, C.blue, 'center');
        }
      });
    } else if (frame.processed >= 4) {
      target(ctx, api, 'reshaped-layout', () => {
        const row = reshapeBatch0[1];
        const cell = 170, x = 1110;
        const visible = Math.min(row.length, frame.processed - row.length);
        const firstWord = owner(row[0]), nextWord = owner(row[1]);
        text(ctx, api, 'Second row', x + 1.5 * cell, 320, 37, C.ink, 'center');
        text(ctx, api, words[firstWord], x + 0.5 * cell, 432, 31, ink[firstWord], 'center');
        if (visible > 1)
          text(ctx, api, words[nextWord], x + 2 * cell, 432, 31, ink[nextWord], 'center');
        const values = row.map((value, column) => column < visible ? value : '');
        numberGrid(ctx, api, [values], x, 450, row.length * cell, 100, C.muted, 'mixed-row', {
          fontSize: 44,
          highlights: row.slice(0, visible).map((v, column) => ({
            row: 0, column, stroke: ink[owner(v)], fill: C.panel,
          })),
        });
        api.line(ctx, 830, 500, x - 8, 500, C.muted, 2);
      });
    } else {
      text(ctx, api, 'New row width', 1390, 426, 31, C.muted, 'center');
      text(ctx, api, '3 values', 1390, 535, 60, C.ink, 'center');
    }
  }
  if (beat !== 1 || stride === 0)
    caption(
      ctx,
      api,
      beat === 0
        ? 'x.reshape(2, 4, 3)  ·  strides (48, 12, 4) bytes  ·  default C index order'
        : 'Original strides (48, 16, 4) bytes  ·  transposed strides (48, 4, 16) bytes',
    );
}
export default {
  id: 'reshape-transpose',
  draw: drawReshapeTranspose,
  cues: [
    'fill-first-row', 'start-mixed-row', 'cross-word-boundary', 'reshape-flat-stream',
    'infer-row-count', 'show-row-count', 'transpose-axis-swap', 'read-word-stride', 'measure-word-stride',
    'compare-layout-owners',
  ],
};
