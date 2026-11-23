import { assertEqual, connector, dot, dynamic, indicate, place, rect } from 'vizmatic/stage';
import { mono, namedBox, note } from '../../kit-narrated.mjs';
import { WORK, open, finish } from '../parts.mjs';
import { adam, saved, trajectory } from '../../../films/deep-dive-deepspeed/arithmetic.mjs';
export default function contract(s, c) {
  const b = open(s, c, 'checkpoint-contract');
  const [top, center, experiment, foot] = WORK.rows([1, 1, 3.4, 0.6], 'normal');
  const ranks = top
    .columns(4, 'normal')
    .map((r, i) =>
      place(
        namedBox('R' + i + ': W / m / v', { width: 350, height: 54, color: 'pink', size: 31 }),
        r,
      ),
    );
  const tag = place(
    namedBox('checkpoint tag: step-5', { width: 600, height: 54, color: 'yellow', size: 31 }),
    center,
  );
  const links = ranks.map((n) => connector(n, tag, { color: 'dim' }));
  const cursor = [s.value(5), s.value(5)];
  const good = adam(saved, 0.4, trajectory.length),
    wrong = adam(saved, -1, trajectory.length);
  assertEqual(trajectory.length - 1, 5, 'saved step counter');
  const start =
    'W0=' +
    saved[0].toFixed(6) +
    '  m=' +
    saved[1].toFixed(4) +
    '  v=' +
    saved[2].toFixed(5) +
    '  step=5';
  const branches = experiment.columns(2, 'loose');
  const nodes = [],
    gradients = [],
    updates = [];
  branches.forEach((region, i) => {
    const [state, sequence, gradient, update] = region.rows([1, 1.2, 0.7, 0.7], 'tight');
    nodes.push(place(mono(start, { size: 29, color: 'pink' }), state));
    const [name, samples] = sequence.columns([2, 5], 'normal');
    nodes.push(
      place(note(i ? 'restart sampler' : 'restore sampler', { color: i ? 'ink' : 'green' }), name),
    );
    const slots = samples.columns(6, 'tight');
    nodes.push(
      ...slots.flatMap((slot, j) => [
        place(rect(slot.width, 44, { fill: 'surface', stroke: 'grid' }), slot),
        place(mono(String(j + 1), { size: 30 }), slot),
      ]),
    );
    nodes.push(
      dynamic(() =>
        dot(9, i ? 'red' : 'green').moveTo([
          slots[0].cx + ((slots[5].cx - slots[0].cx) * cursor[i].value) / 5,
          samples.bottom + 7,
        ]),
      ),
    );
    gradients.push(
      place(
        mono('sample ' + (i ? 1 : 6) + ' → g = ' + (i ? '−1' : '+0.4'), {
          size: 34,
          color: 'cyan',
        }),
        gradient,
      ),
    );
    updates.push(
      place(
        mono('next W0 = ' + (i ? wrong[0] : good[0]).toFixed(7), {
          size: 34,
          color: i ? 'red' : 'blue',
        }),
        update,
      ),
    );
  });
  const reference = place(note('Compare next input · loss · update · scheduler'), foot);
  s.add(ranks, tag, links, nodes);
  c.on('all', () => s.play(...links.map((link) => link.send(dot(10, 'pink'), { duration: 1.8 }))));
  c.on('fresh', () => s.play(indicate(tag, { scale: 1, color: 'yellow' })));
  c.on('sampler', () => s.play(cursor[1].to(0, { duration: 2 })));
  c.show('sampler', gradients, { after: true });
  c.show('diverge', updates, { after: true });
  c.show('reference', reference);
  finish(c, b, 'checkpoint-contract');
}
