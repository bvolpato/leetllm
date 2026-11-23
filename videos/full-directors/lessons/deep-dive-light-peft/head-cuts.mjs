import { C, mix, smooth } from './drawing.mjs';
import { HEAD_SCORES, head, signed, ties, fmt, select, callerKeep } from './examples.mjs';

function headMatrices(p, t) {
  const cell = 19;
  for (let m = 0; m < 4; m++) {
    const x = 80 + m * 281,
      y = 262;
    p.label(['Query', 'Key', 'Value', 'Output'][m], x, y - 52, 23, C.blue, { bold: true });
    p.label(m === 3 ? 'input columns' : 'output rows', x, y - 22, 17, C.dim);
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const id = Math.floor((m === 3 ? c : r) / 2);
        const drop = !head.kept.includes(id);
        if (drop && t === 1) continue;
        const nx = x + c * cell + (m === 3 ? (drop ? 48 * t : id > 1 ? -2 * cell * t : 0) : 0),
          ny = y + r * cell + (m !== 3 ? (drop ? -62 * t : id > 1 ? -2 * cell * t : 0) : 0);
        p.ctx.save();
        p.ctx.globalAlpha = drop ? 1 - t : 1;
        p.box(nx, ny, cell - 1, cell - 1, drop ? C.rust : [C.blue, '', C.teal, '#677d95'][id]);
        p.ctx.restore();
      }
    if (m === 0 || m === 3) {
      for (let id = 0; id < 4; id++) {
        if (id === 1 && t > 0) continue;
        const coord = (2 * id + 1) * cell - (id > 1 ? 2 * cell * t : 0);
        if (m === 0) p.mono('H' + (id + 1), x - 7, y + coord, 15, C.dim, 'right');
        else p.mono('H' + (id + 1), x + coord, y + 8 * cell + 23, 15, C.dim, 'center');
      }
    }
    if (t === 1) p.mono(m === 3 ? '8 × 6' : '6 × 8', x, 473, 27);
    else if (!t) p.mono('8 × 8', x, 473, 27);
  }
}

export function heads(p) {
  const { b, cue, header, foot, mono, label, line, box, dot } = p;
  if (b === 2) {
    header('Self-attention  /  four heads × two features', 'Which axes belong to the second head?');
    const t = smooth(cue(2, 'Cut its two output rows', 1.2));
    headMatrices(p, t);
    foot(
      t === 1
        ? 'Q, K and V produce six channels. The output projection reads six and writes eight.'
        : 'One head owns a pair of adjacent features in each projection.',
      C.blue,
    );
    return;
  }
  if (b === 3) {
    header('One gate changes sign  /  requested cut 25%', 'Which head does each ranking lose?');
    const flipped = cue(3, 'The pinned helper');
    const scores = flipped ? signed : HEAD_SCORES;
    const show = [cue(3, 'Rank by magnitude'), cue(3, 'A large negative')];
    [scores, scores.map(Math.abs)].forEach((values, k) => {
      const cut = select(values, 0.25),
        y = 245 + k * 163;
      label(k ? 'Magnitude' : 'Signed gate', 60, y, 22, C.ink, { bold: true });
      values.forEach((v, i) => {
        const gone = show[k] && !cut.kept.includes(i);
        const x = 254 + 186 * i;
        mono('H' + (i + 1), x + 63, y - 37, 19, C.dim, 'center');
        p.plate(x, y - 14, 125, 62, gone ? C.peach : C.white, gone ? C.rust : C.fine, fmt(v), 26);
        if (gone) label('removed', x + 62, y + 77, 19, C.rust, { align: 'center' });
      });
      if (show[k]) mono('q = ' + fmt(cut.threshold), 60, y + 47, 16, C.dim);
    });
    foot('Only H1 changes sign. The magnitude ranking uses the absolute value of every gate.');
    return;
  }
  if (b === 4) {
    header('Boundary case  /  tied gates', 'How many heads does the caller keep?');
    const zero = cue(4, 'A request for zero');
    const skip = cue(4, 'The caller skips');
    const show = zero ? skip : cue(4, 'Only the last two gates survive');
    const kept = callerKeep(ties, zero ? 0 : 0.25);
    label(
      skip
        ? 'Requested ratio 0  ·  bypass threshold'
        : zero
          ? 'Requested ratio 0  ·  caller decision'
          : 'Requested ratio 0.25  ·  keep score > cutoff',
      68,
      205,
      26,
    );
    ties.forEach((v, i) => {
      const x = 107 + i * 267,
        selected = kept.includes(i);
      mono('H' + (i + 1), x + 76, 282, 22, C.dim, 'center');
      p.plate(
        x,
        314,
        151,
        96,
        show ? (selected ? C.mint : C.peach) : C.white,
        show ? (selected ? C.teal : C.rust) : C.fine,
        fmt(v),
        36,
      );
      if (show)
        label(selected ? 'kept' : 'at cutoff', x + 76, 451, 21, selected ? C.teal : C.rust, {
          align: 'center',
        });
    });
    foot(
      skip
        ? 'Zero-ratio caller keeps all four. A raw strict threshold would drop tied minima.'
        : zero
          ? 'Will a zero-ratio request call the threshold helper?'
          : show
            ? 'Strict comparison removes the two scores equal to 0.3.'
            : 'The linear 25th percentile lies between two equal scores.',
    );
    return;
  }
  header('Self-attention  /  one layer', 'Which head falls below the budget line?');
  const t = smooth(cue(1, 'Sort these four', 1.6)),
    settled = cue(0, 'The task gradient', 1);
  const sortOrder = HEAD_SCORES.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  HEAD_SCORES.forEach((v, i) => {
    const x = 114 + i * 259,
      y = b === 0 ? 288 : 205,
      s = mix(1, v, settled);
    label('H' + (i + 1), x + 75, y - 30, 22, C.blue, { bold: true, align: 'center' });
    p.plate(x, y, 150, 57, C.ice, C.blue, fmt(s), 27);
    box(x, y + 68, 150, 10, C.faint);
    box(x, y + 68, 150 * s, 10, C.blue);
  });
  if (b === 1) {
    label('Ascending score', 66, 324, 17, C.dim);
    sortOrder.forEach(({ v, i }, j) => {
      const x = 114 + j * 259;
      p.line(
        [
          [x, 397],
          [x + 150, 397],
        ],
        C.fine,
      );
      if (t * 4 <= j) return;
      p.ctx.save();
      p.ctx.globalAlpha = Math.min(1, t * 4 - j);
      p.plate(x, 347, 150, 48, C.white, C.blue, 'H' + (i + 1) + '  ' + fmt(v), 21);
      p.ctx.restore();
    });
  }
  if (cue(1, 'Which head fails')) {
    const marker = 114 + 75 + 259 * 0.75;
    line(
      [
        [marker, 399],
        [marker, 441],
      ],
      C.rust,
      3,
    );
    dot(marker, 400, 5, C.rust);
    mono('q = ' + fmt(head.threshold), marker, 472, 24, C.rust, 'center');
  }
  foot(
    b === 0
      ? 'A soft gate scales one head. Every head still executes during estimation.'
      : 'Linear quantile within this layer    •    keep score > q',
    C.blue,
  );
}
