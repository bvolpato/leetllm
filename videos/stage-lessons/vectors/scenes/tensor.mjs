import { indicate, line, place, rect } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { frame, ownedTable, H, WORDS, BASE_OUTPUT } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns(2, 'loose');
  const tables = [left, right].map((region, b) =>
    ownedTable(region, {
      title: 'message ' + b,
      rows: WORDS[b],
      columns: ['f0', 'f1'],
      values: () => H[b],
      colors: b ? ['green', 'green', 'green'] : ['green', 'green', 'cyan'],
    }),
  );
  const outputs = [left, right].map((region, b) =>
    ownedTable(region, {
      title: 'message ' + b + ': projected',
      rows: WORDS[b],
      columns: ['out 0', 'out 1', 'out 2'],
      values: () => BASE_OUTPUT[b],
      colors: b ? ['green', 'green', 'green'] : ['green', 'green', 'cyan'],
    }),
  );
  const shape = place(mono('batch 2 × tokens 3 × features 2', { color: 'cyan' }), f.foot);
  const result = place(mono('batch 2 × tokens 3 × outputs 3', { color: 'yellow' }), f.foot);
  const indexed = place(mono('H[1, 2, 0] = ' + H[1][2][0], { color: 'yellow' }), f.foot);
  const sliced = place(
    mono('H[:, :, 0] = ' + JSON.stringify(H.map((m) => m.map((r) => r[0]))), {
      size: 34,
      color: 'cyan',
    }),
    f.foot,
  );
  s.add(
    f.title,
    tables.map((t) => t.nodes),
    shape,
  );
  c.on('add-message-axis', () => s.play(indicate(tables[1].nodes, { scale: 1, duration: 1 })));
  c.on('select-message', () => s.play(indicate(tables[1].nodes, { scale: 1, duration: 0.6 })));
  c.on('select-word', () => s.play(indicate(tables[1].rows[2], { scale: 1, duration: 0.6 })));
  c.swap('select-feature', shape, indexed, { after: true });
  c.on('select-feature', () =>
    s.play(indicate(tables[1].cells[2][0], { scale: 1, duration: 0.6 })),
  );
  c.swap('tensor-slice-columns', indexed, sliced, { after: true });
  c.on('tensor-slice-columns', () =>
    s.play(
      indicate(
        tables.flatMap((t) => t.cells.map((r) => r[0])),
        { scale: 1, duration: 1 },
      ),
    ),
  );
  c.swap(
    'project-batch',
    tables.map((t) => t.nodes),
    outputs.map((t) => t.nodes),
    { after: true },
  );
  c.swap('project-batch', sliced, result, { after: true });
  const batch = 4,
    tokens = 128,
    inputWidth = 768,
    outputWidth = 256;
  const [head, ...bands] = f.body.rows([1, 1, 1, 1, 1], 'normal');
  const strips = [place(label('128 token positions in each prompt'), head)];
  for (const [i, band] of bands.entries()) {
    const [name, positions] = band.columns([1, 5], 'wide');
    strips.push(place(label('prompt ' + i, { color: 'cyan' }), name));
    strips.push(
      rect(positions.width, positions.height * 0.48, {
        fill: 'surface',
        stroke: 'cyan',
      }).moveTo(positions.point('center')),
    );
    for (let t = 1; t < tokens; t++) {
      const x = positions.left + (positions.width * t) / tokens;
      const h = positions.height * (t % 16 === 0 ? 0.23 : 0.1);
      strips.push(
        line([x, positions.cy - h], [x, positions.cy + h], { stroke: 'dim', width: 1.5 }),
      );
    }
  }
  const widths = place(
    mono(
      '(' +
        [batch, tokens, inputWidth].join(', ') +
        ') @ (' +
        [inputWidth, outputWidth].join(', ') +
        ')  →  ?',
      { size: 38 },
    ),
    f.foot,
  );
  const wider = place(
    mono(
      batch * tokens +
        ' token vectors  ·  ' +
        outputWidth +
        ' outputs each  →  (' +
        [batch, tokens, outputWidth].join(', ') +
        ')',
      { size: 37, color: 'cyan' },
    ),
    f.foot,
  );
  c.swapAll('large-batch', [strips, widths], { keep: [f.title] });
  c.swap('large-result', widths, wider, { after: true });
}
