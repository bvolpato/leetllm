import { boxOf, column, dot, fadeIn, indicate, pictogram, place, row, to } from 'vizmatic/stage';
import { label } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'clean-template');

  const [top, bottom] = VIEW.rows([1, 2], 'wide');
  const source = place(
    row([pictogram('snapshot', { size: 90, color: 'green' }), label('clean, paused supervisor')]),
    top,
  );
  const restored = place(
    row(
      [
        column([
          pictogram('snapshot', { size: 65, color: 'green' }),
          label('sealed template', { size: 34 }),
        ]),
        label('→', { color: 'pink' }),
        column([
          pictogram('process', { size: 65, color: 'cyan' }),
          label('restored supervisor: readiness', { size: 34, color: 'cyan' }),
        ]),
      ],
      { gap: 'loose' },
    ),
    top,
  );
  const cols = bottom.columns(3, 'loose');
  const artifacts = ['memory backing', 'VM state', 'matching disks'].map((x, i) =>
    place(
      column([
        pictogram(i === 2 ? 'disk' : 'snapshot', { size: 85, color: 'dim' }),
        label(x, { size: 36 }),
      ]),
      cols[i],
    ),
  );
  const packets = artifacts.map(() => dot(12, 'green').moveTo(boxOf(source).point('bottom')));
  const gate = place(label('User instructions HELD', { color: 'red' }), FOOT);
  const ready = place(
    label('Script waits for this generation’s readiness checks', { color: 'yellow' }),
    FOOT,
  );
  s.add(source, artifacts, gate);
  c.on('seal', () =>
    s.play(
      ...packets.map((d) => fadeIn(d, { duration: 0.1 })),
      ...packets.map((d, i) =>
        to(d, (n) => n.moveTo(boxOf(artifacts[i]).point('top')), { duration: 1.4 }),
      ),
    ),
  );
  c.on('auth', () => s.play(...artifacts.map((x) => indicate(x, { scale: 1, color: 'green' }))));
  c.swap(2, source, restored);
  c.swap('held', gate, ready, { after: true });
}
