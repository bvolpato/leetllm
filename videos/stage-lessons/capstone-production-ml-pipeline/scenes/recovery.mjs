import { column, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { BODY, open } from '../parts.mjs';
import { probeSwitch } from '../probe-switch.mjs';

export default function recovery(s, c) {
  const [header, reports, action, desk] = BODY.rows([0.8, 2.1, 1, 3.2], 'normal');
  const [a, b] = reports.columns(2, 'loose');
  const bench = probeSwitch(s, desk, { release: 'v1', id: 'eval-1', delay: 9 });
  const policy = place(label('Cost limit · no increase above baseline', { size: 38 }), header);
  const health = place(
    label('Day 8   ·   v1   ·   900 requests   ·   p95 130 ms   ·   0.4% errors', { size: 38 }),
    header,
  );
  const report = (room, title, value, color) =>
    place(column([note(title), mono(value, { size: 44, color })], { gap: 'normal' }), room);
  const pending = report(a, 'Report A  /  quality', 'Labels pending', 'yellow');
  const mature = report(b, 'Report B  /  mature cost change', '+14%   (limit 0%)', 'pink');
  const prompt = (v, color) => place(label(v, { size: 38, color }), action);
  const vote = prompt('Which report calls for restoring v0?', 'yellow');
  const wait = prompt('A   ·   hold monitoring   ·   keep v1', 'yellow');
  const rollback = prompt('B   ·   rollback required   ·   verify the retained target', 'pink');
  const restored = prompt('Rollback recorded   ·   v0 reloaded and selected', 'blue');
  open(s, c);
  s.add(bench.nodes, policy);
  c.on('recovery-probe', () => {
    bench.send();
    bench.report('v1');
  });
  c.swap('recovery-windows', policy, health);
  c.show('recovery-pending', pending);
  c.show('recovery-measured', mature);
  c.show('recovery-vote', vote);
  c.swap('recovery-hold', vote, wait);
  c.swap('recovery-breach', wait, rollback);
  c.on('recovery-select', () => bench.select('v0'));
  c.swap('recovery-select', rollback, restored, { after: true });
  c.on('recovery-replay', bench.send);
  c.on('recovery-score', () => bench.score('v0'));
  c.on('recovery-result', () => bench.report('v0'));
}
