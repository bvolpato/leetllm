import { arrow, boxOf, dot, group, place, to } from 'vizmatic/stage';
import { area, heading, label, namedBox, note, tint } from '../../kit-narrated.mjs';

export default function split(s, c) {
  const [roles, machine, foot] = area.rows([3, 3, 1], 'loose');
  const cols = roles.columns(4, 'wide');
  const names = ['training', 'validation', 'calibration', 'test'];
  const colors = ['cyan', 'cyan', 'yellow', 'green'];
  const roleLabels = names.map((name, i) =>
    place(label(name, { color: colors[i] }), cols[i], 'top'),
  );
  const dots = cols.map((r, i) =>
    group(
      ...Array.from({ length: 9 }, (_, j) =>
        dot(9, colors[i]).moveTo([
          r.left + (r.width * ((j % 3) + 1)) / 4,
          r.top + r.height * (0.35 + Math.floor(j / 3) * 0.2),
        ]),
      ),
    ),
  );
  const stages = machine.columns(3, 'loose');
  const fit = place(
    namedBox('fitted procedure', { width: stages[0].width, height: 110, color: 'cyan' }),
    stages[0],
  );
  const calibration = place(
    namedBox('held-out errors', { width: stages[1].width, height: 110, color: 'yellow' }),
    stages[1],
  );
  const test = place(
    namedBox('new outcomes', { width: stages[2].width, height: 110, color: 'green' }),
    stages[2],
  );
  const links = [
    arrow(boxOf(dots[0]).point('bottom'), boxOf(fit).point('top'), { stroke: 'cyan', pad: 18 }),
    arrow(boxOf(dots[1]).point('bottom'), boxOf(fit).point('top right'), {
      stroke: 'cyan',
      pad: 18,
    }),
    arrow(boxOf(dots[2]).point('bottom'), boxOf(calibration).point('top'), {
      stroke: 'yellow',
      pad: 18,
    }),
    arrow(boxOf(dots[3]).point('bottom'), boxOf(test).point('top'), { stroke: 'green', pad: 18 }),
  ];
  const reject = arrow(boxOf(calibration).point('bottom'), boxOf(fit).point('bottom'), {
    stroke: 'red',
    bend: -130,
    pad: 18,
  });
  const freeze = place(label('frozen', { color: 'cyan' }), machine, 'top left');
  const contaminated = place(
    label('contaminated', { color: 'red', size: 34 }),
    machine,
    'top left',
  );
  const audit = place(note('One held-out record = request ID + forecast + outcome'), foot);
  const packet = dot(16, 'cyan').moveTo(boxOf(dots[0]).point('bottom'));
  s.add(heading(c.title), roleLabels, dots, fit, calibration, test);
  c.show('fit', [links[0], links[1], packet]);
  c.on('fit', () =>
    s.play(to(packet, (n) => n.moveTo(boxOf(fit).point('top')), { duration: 1.4 })),
  );
  c.show('freeze', [freeze, links[2], links[3]]);
  c.show('feedback', reject);
  c.swap('feedback', freeze, contaminated);
  c.on('feedback', () => s.play(tint(fit, 'red')));
  c.hide('independent', reject);
  c.swap('independent', contaminated, freeze);
  c.on('independent', () => s.play(tint(fit, 'cyan')));
  c.show('audit', audit);
}
