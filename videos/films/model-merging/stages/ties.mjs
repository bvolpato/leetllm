import {
  after,
  electedColumn,
  progress,
  signed,
  started,
  taskRows,
  tasks,
  trimmedRows,
} from '../decisions.mjs';

export function drawTies(ctx, scene, state, api) {
  const { C } = api;
  const label = (v, x, y, size, col, align = 'left') => api.text(ctx, v, x, y, size, col, align);
  const colors = [C.blue, C.pink, C.cyan];
  const four = started(state, 'pick-four'),
    column = four ? 3 : 1;
  const prefix = four ? 'four' : 'two';
  const trimmed = after(state, 'trim-rows'),
    selected = started(state, 'pick-two');
  const elected = after(state, prefix + '-sum'),
    filtered = after(state, prefix + '-keep');
  const ready = after(state, prefix + '-mean');
  const group = electedColumn(column);
  const cellX = (j) => 335 + 157 * j;
  api.focus.target('delta-table', () => {
    label('Changes from the base', 150, 296, 40, C.ink);
    for (let j = 0; j < 4; j++)
      label(
        'w' + (j + 1),
        cellX(j),
        401,
        34,
        j === column && selected ? C.yellow : C.muted,
        'center',
      );
    taskRows.forEach((row, i) => {
      const y = 500 + 127 * i;
      label(tasks[i], 145, y, 39, colors[i]);
      row.forEach((value, j) => {
        const removed = trimmedRows[i][j] === 0;
        const col = (trimmed && removed) || (selected && j !== column) ? C.muted : colors[i];
        const fill = selected && j === column ? C.panel : C.bg;
        api.rect(
          ctx,
          cellX(j) - 65,
          y - 58,
          130,
          87,
          fill,
          j === column && selected ? C.yellow : C.panel,
          6,
        );
        label(trimmed && removed ? '0' : signed(value), cellX(j), y, 35, col, 'center');
        if (removed && !trimmed) {
          const p = progress(state, 'trim-rows');
          if (p > 0)
            api.line(ctx, cellX(j) - 48, y + 12, cellX(j) - 48 + 96 * p, y + 12, C.muted, 3);
        }
      });
    });
    label(
      trimmed ? '2 of 4 entries kept per task' : 'Keep 2 of 4 entries per task',
      150,
      884,
      33,
      C.muted,
    );
  });
  api.focus.target('signed-bars', () => {
    label(
      selected ? 'Weight ' + (column + 1) : 'Which changes survive?',
      1035,
      296,
      42,
      selected ? C.yellow : C.ink,
    );
    if (!selected) {
      label('Compare magnitudes within each row.', 1035, 521, 33, C.muted);
      return;
    }
    const x = (v) => 1440 + v * 243;
    api.line(ctx, x(0), 352, x(0), 759, C.muted, 3);
    label('−', x(-1), 400, 38, C.muted, 'center');
    label('0', x(0), 337, 28, C.muted, 'center');
    label('+', x(1), 400, 38, C.muted, 'center');
    group.values.forEach((value, i) => {
      const y = 479 + 116 * i;
      const aligned = Math.sign(value) === Math.sign(group.sum);
      const col = filtered && !aligned ? C.muted : colors[i];
      label(tasks[i], 1035, y + 12, 34, col);
      api.arrow(ctx, x(0), y, x(value), y, col, filtered && !aligned ? 2 : 6);
      label(signed(value), x(value), y - 23, 31, col, 'center');
    });
    const add = four
      ? 3 * progress(state, 'four-sum')
      : 2 * progress(state, 'two-left') + progress(state, 'two-right');
    const order = four ? [0, 1, 2] : [0, 2, 1];
    if (add > 0) {
      label('Sum', 1035, 816, 33, C.ink);
      let start = 0;
      order.forEach((source, step) => {
        const value = group.values[source];
        const part = Math.min(1, Math.max(0, add - step));
        const y = 776 + step * 18;
        if (part > 0) {
          if (step) api.line(ctx, x(start), y - 18, x(start), y, C.muted, 2);
          api.arrow(ctx, x(start), y, x(start + part * value), y, colors[source], 4);
        }
        start += value;
      });
    }
    let balance = 'Which direction?';
    if (!four && after(state, 'two-left')) {
      balance = 'Left together   ' + signed(group.values[0] + group.values[2]);
    }
    if (elected) balance = 'Signed sum   ' + signed(group.sum);
    label(balance, 1035, 893, 38, C.ink);
  });
  api.focus.target('column-mean', () => {
    if (selected && (four || elected || started(state, prefix + '-mean'))) {
      let caption = 'Aligned mean   ?';
      if (ready)
        caption =
          'Aligned mean   ' +
          signed(group.total) +
          ' / ' +
          group.aligned.length +
          ' = ' +
          signed(group.mean);
      label(caption, 1035, 958, 38, ready ? C.yellow : C.muted);
    }
  });
}
export default {
  id: 'ties',
  draw: drawTies,
  cues: [
    'trim-rows',
    'pick-two',
    'two-left',
    'two-right',
    'two-sum',
    'two-keep',
    'two-mean',
    'pick-four',
    'four-sum',
    'four-keep',
    'four-mean',
  ],
};
