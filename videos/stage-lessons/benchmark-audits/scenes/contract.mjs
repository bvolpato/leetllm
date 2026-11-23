import { column, place, rect, indicate, boxOf, to, dot } from 'vizmatic/stage';
import { heading, label, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT } from '../parts.mjs';
export default function contract(s, c) {
  const board = caseBoard();
  const rows = MAIN.rows(2, 'loose');
  const paths = rows.map((region, i) => {
    const [name, body] = region.rows([1, 3], 'normal');
    const title = place(
      label(`Library system ${i ? 'B' : 'A'}`, { color: i ? 'blue' : 'cyan' }),
      name,
      'left',
    );
    const slots = body.columns(5, 'normal');
    const names = ['questions', 'evidence', 'model', 'budget', 'scorer'];
    const stages = names.map((v, j) =>
      place(
        column(
          [
            label(v, { size: 29, color: 'dim' }),
            chip(j === 2 ? (i ? 'B' : 'A') : j === 1 ? '3 passages' : 'matched', {
              color: j === 2 ? (i ? 'blue' : 'cyan') : 'dim',
            }),
          ],
          { gap: 'normal' },
        ),
        slots[j],
      ),
    );
    const evidence5 = place(
      column(
        [label('evidence', { size: 29, color: 'dim' }), chip('5 passages', { color: 'blue' })],
        { gap: 'normal' },
      ),
      slots[1],
    );
    const added = [0, 1].map((j) =>
      dot(8, 'blue').moveTo(slots[1].point(j ? 'top right' : 'top left')),
    );
    return { title, stages, added, evidence5, slot: slots[1] };
  });
  const result = place(label('Model + retrieval changed', { color: 'yellow' }), FOOT);
  const scope = place(label('Different tasks → different score units'), FOOT);
  s.add(
    heading('Freeze the comparison contract'),
    board.nodes,
    paths.map((p) => [p.title, p.stages]),
  );
  c.on('contract-beat-1-focus-1', () =>
    s.play(indicate(paths[0].stages, { scale: 1, color: 'yellow' })),
  );
  c.on('contract-beat-2-focus-1', () =>
    s.play(indicate(paths[1].title, { scale: 1, color: 'yellow' })),
  );
  c.show('ba-contract-passages', paths[1].added);
  c.on('ba-contract-passages', () =>
    s.play(
      ...paths[1].added.map((n) =>
        to(n, (d) => d.moveTo(paths[1].slot.point('center')), { duration: 1 }),
      ),
    ),
  );
  c.swap('ba-contract-passages', paths[1].stages[1], paths[1].evidence5);
  c.hide('ba-contract-consequence', paths[1].added);
  c.show('ba-contract-consequence', result, { after: true });
  c.swap('contract-beat-3-focus-1', result, scope);
  c.keep(board.nodes);
}
