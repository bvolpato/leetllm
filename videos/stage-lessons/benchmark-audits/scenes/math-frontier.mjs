import {
  column,
  row,
  grid,
  place,
  indicate,
  codeBlock,
  morphCode,
  dateLine,
  rect,
  to,
  recolor,
} from 'vizmatic/stage';
import { heading, label, note, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT } from '../parts.mjs';
export default function math(s, c) {
  const board = caseBoard();
  const [top, body] = MAIN.rows([1, 3], 'wide');
  const response = place(
    codeBlock('2 + 3 = 5\n#### 5', { language: 'python', size: 40 }),
    body,
    'left',
  );
  const stripped = place(codeBlock('2 + 3 = 5\n5', { language: 'python', size: 40 }), body, 'left');
  const parsers = place(
    column(
      [
        chip('delimiter parser', { color: 'cyan' }),
        chip('final-number parser', { color: 'blue' }),
        note('answer correctness ≠ derivation'),
      ],
      { gap: 'wide' },
    ),
    body,
    'right',
  );
  const sizes = place(label('GSM8K ≈ 8.5k · MATH = 12,500'), top);
  const foot = place(note('Authored arithmetic example · record parser and tool access'), FOOT);
  const versionSlots = body.columns(3, 'wide');
  const versions = [
    ['HLE original', 'April 2025'],
    ['Rolling', 'October 2025'],
    ['Diamond', 'September 2026'],
  ].map((v, i) =>
    place(column([label(v[0], { color: 'cyan' }), note(v[1])], { gap: 'wide' }), versionSlots[i]),
  );
  const versionNote = place(
    label('FrontierMath v2 · June 12, 2026 · 42% repaired', { size: 34, color: 'yellow' }),
    FOOT,
  );
  const toyRegions = body.columns(3, 'loose');
  const toy = toyRegions.map((r, j) => {
    const [head, marks] = r.rows([1, 4], 'normal');
    const title = place(note(['input', 'rule: extend right', 'output'][j]), head);
    const cells = Array.from({ length: 9 }, (_, i) =>
      rect(58, 58, { fill: j === 0 && i === 3 ? 'cyan' : 'grid' }),
    );
    place(grid(cells, { columns: 3, gap: 'tight' }), marks);
    return { title, cells };
  });
  const toyNote = place(note('Example rule    ·    Extend the color to the right edge'), FOOT);
  const title = heading('A parser and a version are part of the task');
  s.add(title, sizes, response, parsers, foot);
  c.take(board.nodes);
  c.on('math-frontier-phase-0', () => s.play(indicate(response, { scale: 1, color: 'yellow' })));
  c.on('ba-math-frontier-parser', () => s.play(morphCode(response, stripped, { duration: 1 })));
  c.on('ba-math-frontier-proof', () => s.play(indicate(parsers, { scale: 1, color: 'yellow' })));
  c.swapAll('math-frontier-phase-1', [versions], { keep: [title, board.nodes] });
  c.on('ba-math-frontier-hle', () => s.play(indicate(versions[0], { scale: 1, color: 'yellow' })));
  c.show('ba-math-frontier-versions', versionNote, { after: true });
  c.swapAll('math-frontier-phase-2', [toy.map((t) => [t.title, ...t.cells]), toyNote], {
    keep: [title, board.nodes],
  });
  c.after('ba-math-frontier-arc', () =>
    s.play(...toy[2].cells.slice(3, 6).map((n) => recolor(n, 'cyan', { duration: 1.2 }))),
  );
}
