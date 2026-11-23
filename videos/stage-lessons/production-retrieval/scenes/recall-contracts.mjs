import { assertEqual, column, indicate, passage, place, row } from 'vizmatic/stage';
import { heading, label, namedBox, note } from '../../kit-narrated.mjs';
import { carryIdentity, CORPUS, evidenceFrame } from '../parts.mjs';
import { governingRecall } from '../../../films/production-retrieval/arithmetic.mjs';

export default function recallContracts(s, c) {
  const f = evidenceFrame(c, { page: false });
  const exact = ['1', '2', '3', '4', '5', '6', '7', '8', 'R', '10'];
  const returned = [...exact.slice(0, 8), 'X', 'Y'];
  const recall = governingRecall(exact, returned, ['R']);
  const overlap = returned.filter((id) => exact.includes(id));
  const requiredHits = returned.filter((id) => id === 'R').length;
  assertEqual(recall.ann, 0.8, 'eight exact neighbors');
  assertEqual(recall.task, 0, 'no governing passage');
  const reference = place(passage(CORPUS[0].text, {
    title: 'R   ·   required reference passage', titleSize: 30, size: 36,
    width: f.source.width, color: 'cyan',
  }), f.source, 'top left');
  const rooms = f.work.rows([2, 2, 2], 'normal');
  const strip = (room, title, ids) => {
    const tiles = ids.map((id) => namedBox(id, { width: 94, height: 90, color: id === 'R' ? 'cyan' : 'dim' }));
    const band = place(column([note(title), row(tiles, { gap: 'tight' })], {
      gap: 'normal', align: 'left',
    }), room, 'left');
    return { tiles, band };
  };
  const top = strip(rooms[0], 'Exact top ten', exact);
  const pending = strip(rooms[1], 'Approximate top ten', returned.map(() => '·'));
  const approximate = strip(rooms[1], 'Approximate top ten', returned);
  const packed = strip(rooms[2], 'In the prompt   ·   every returned hit fits', returned);
  const [left, right] = f.foot.columns(2, 'wide');
  const ann = place(label('Exact neighbors   ' + overlap.length + ' / ' + exact.length + ' = ' + recall.ann, { color: 'yellow' }), left, 'left');
  const task = place(label('Required rule   ' + requiredHits + ' / 1 = ' + recall.task, { color: 'yellow' }), right, 'left');
  const claim = place(column([
    note('If the model says “eligible”'),
    label('Required support absent', { size: 39, color: 'pink' }),
  ], { gap: 'tight', align: 'left' }), f.source, 'bottom left');

  s.add(heading(c.title), f.nodes, reference, top.band, pending.band);
  carryIdentity(c, f);
  c.on('pr-task', () => s.play(indicate(top.tiles[8], { scale: 1, color: 'cyan' })));
  c.swap('pr-return', pending.band, approximate.band);
  c.on('pr-ann', () => s.play(indicate(approximate.tiles.slice(0, overlap.length), { scale: 1, color: 'yellow' })));
  c.show('pr-eight', ann, { after: true });
  c.show('pr-missing', task, { after: true });
  c.show('pr-context', packed.band);
  c.show('pr-faithful', claim, { after: true });
}
