import { arrow, boxOf, dot, fadeIn, fadeOut, place, to } from 'vizmatic/stage';
import { label, namedBox, tint } from '../../kit-narrated.mjs';
import { FOOT, VIEW, host } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'clock-refresh');
  const [wall, application] = VIEW.rows(2, 'loose');
  const top = wall.columns(3, 'loose');
  const lower = application.columns(3, 'loose');
  const title = place(label('wall time', { color: 'pink' }), top[0]);
  const saved = place(
    namedBox('saved wall time', { width: 490, height: 105, color: 'pink' }),
    top[1],
  );
  const target = place(
    namedBox('current-time target', { width: 490, height: 105, color: 'dim', dash: true }),
    top[2],
  );
  const current = place(
    namedBox('current wall time', { width: 490, height: 105, color: 'pink' }),
    top[2],
  );
  const signal = place(
    namedBox('generation change', { width: 490, height: 105, color: 'pink' }),
    lower[0],
  );
  const app = place(
    namedBox('compatible userspace', { width: 490, height: 105, color: 'cyan' }),
    lower[1],
  );
  const copied = place(
    namedBox('copied deadline record', { width: 490, height: 105, color: 'cyan' }),
    lower[2],
  );
  const rebuilt = place(
    namedBox('rebuilt deadline record', { width: 490, height: 105, color: 'cyan' }),
    lower[2],
  );
  const clockWire = arrow(boxOf(saved).point('right'), boxOf(target).point('left'), {
    stroke: 'dim',
    pad: 12,
  });
  const wires = [
    arrow(boxOf(signal).point('right'), boxOf(app).point('left'), { stroke: 'dim', pad: 12 }),
    arrow(boxOf(app).point('right'), boxOf(copied).point('left'), { stroke: 'dim', pad: 12 }),
  ];
  const wallMark = dot(12, 'pink').moveTo(boxOf(saved).point('right'));
  const notice = dot(12, 'pink').moveTo(boxOf(signal).point('right'));
  const rebuildSignal = dot(12, 'cyan').moveTo(boxOf(app).point('right'));
  const initial = place(label('Saved clock and copied deadline are separate state'), FOOT);
  const separate = place(
    label('Current wall time leaves the copied deadline unchanged', { color: 'yellow' }),
    FOOT,
  );
  s.add(title, saved, target, signal, app, copied, clockWire, wires, initial);
  c.on('sync', () =>
    s.play(
      fadeIn(wallMark, { duration: 0.1 }),
      to(wallMark, (n) => n.moveTo(boxOf(target).point('left')), { duration: 1.5 }),
    ),
  );
  c.swap('sync', target, current, { after: true });
  c.after('sync', () => s.play(tint(saved, 'dim')));
  c.swap('separate', initial, separate);
  c.on('generation', () => {
    s.play(
      fadeIn(notice, { duration: 0.1 }),
      to(notice, (n) => n.moveTo(boxOf(app).point('left')), { duration: 0.6 }),
    );
    s.play(fadeOut(notice, { duration: 0.1 }));
    s.play(
      fadeIn(rebuildSignal, { duration: 0.1 }),
      to(rebuildSignal, (n) => n.moveTo(boxOf(copied).point('left')), { duration: 0.6 }),
    );
  });
  c.swap('generation', copied, rebuilt, { after: true });
  c.hide('generation', separate, { after: true });
  c.clear([clockWire, ...wires], 0.5, 0.2);
}
