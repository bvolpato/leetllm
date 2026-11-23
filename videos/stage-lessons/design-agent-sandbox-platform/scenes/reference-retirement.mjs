import { arrow, boxOf, column, indicate, pictogram, place } from 'vizmatic/stage';
import { label, namedBox } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'reference-retirement');

  const [top, bottom] = VIEW.rows([2, 1], 'wide');
  const cols = top.columns(3, 'loose');
  const creator = place(
    column([pictogram('process', { size: 95, color: 'cyan' }), label('creator fd')]),
    cols[0],
  );
  const vm = place(
    column([pictogram('vm', { size: 110, color: 'cyan' }), label('VM resources')]),
    cols[1],
  );
  const duplicate = place(
    column([pictogram('process', { size: 95, color: 'pink' }), label('duplicate fd')]),
    cols[2],
  );
  const wires = [
    arrow(boxOf(creator).point('right'), boxOf(vm).point('left'), { stroke: 'cyan', pad: 30 }),
    arrow(boxOf(duplicate).point('left'), boxOf(vm).point('right'), { stroke: 'pink', pad: 30 }),
  ];
  const held = place(namedBox('capacity held', { width: 600, height: 100, color: 'red' }), bottom);
  const free = place(
    namedBox('last reference closed', { width: 600, height: 100, color: 'yellow' }),
    bottom,
  );
  const replay = place(label('Replay · A / J4 / generation 4', { color: 'dim' }), FOOT);
  const warning = place(label('Threaded cgroup: EOPNOTSUPP', { color: 'red' }), FOOT);
  const caption = place(label('Uncertain resources remain owned', { color: 'yellow' }), FOOT);
  s.add(creator, vm, duplicate, wires, held, replay);
  c.hide('creator', [creator, wires[0]], { after: true });
  c.on('duplicate', () => s.play(indicate(duplicate, { scale: 1, color: 'yellow' })));
  c.swap('threaded', replay, warning, { after: true });
  c.swap('uncertain', warning, caption);
  c.hide('close', [duplicate, wires[1], vm], { after: true });
  c.hide('close', caption, { after: true });
  c.swap('close', held, free, { after: true });
}
