import { assertEqual, boxOf, dot, dynamic, place, rect, row, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox } from '../../kit-narrated.mjs';
import { sandboxAck } from '../parts.mjs';

export default function scene(s, c) {
  const [title, wire, time, range, foot] = area.rows([0.6, 2, 0.8, 1.2, 0.85], 'normal');
  const ports = [2 ** 30, 2 ** 31];
  const samples = ports.map((port) => 'OK ' + port + '\nPAYLOAD');
  const [good, bad] = samples.map((sample) => sandboxAck(sample));
  assertEqual(good.port, ports[0], 'included lower port');
  assertEqual(bad.status, 'invalid', 'excluded upper port');
  assertEqual(good.leftover, 'PAYLOAD', 'first stream leaves payload');
  assertEqual(samples[1].slice(bad.consumed), 'PAYLOAD', 'second stream leaves payload');

  const [bytes, cursorLane] = wire.rows([2.2, 0.65], 'normal');
  const cells = bytes.columns([0.65, 2.7, 0.8, 1.8], 'normal');
  const field = (r, text, color) =>
    place(
      namedBox(text, {
        width: r.width - 12,
        height: 112,
        size: 51,
        font: 'mono',
        color,
      }),
      r,
    );
  const ok = field(cells[0], 'OK', 'pink');
  const port = ports.map((v) => field(cells[1], String(v), 'pink'));
  const end = field(cells[2], '↵', 'pink');
  const payload = field(cells[3], 'PAYLOAD', 'blue');
  const marker = dot(15, 'yellow');
  const y = cursorLane.point('center')[1];
  const start = [boxOf(ok).point('left')[0] + 14, y],
    stop = [boxOf(end).point('center')[0], y];
  marker.moveTo(start);
  const clock = place(
    row(
      [mono('64 bytes max', { size: 38 }), label('One 2 s deadline for the line', { size: 38 })],
      { gap: 'loose' },
    ),
    time,
  );
  const deadline = 2,
    elapsed = 1.5;
  assertEqual(deadline - elapsed, 0.5, 'remaining time after a slow fragment');
  const [bar, value] = range.columns([1.7, 1], 'wide');
  const full = place(rect(bar.width, 40, { stroke: 'dim', fill: 'surface' }), bar);
  const remaining = s.value(deadline);
  const remainingBar = dynamic(() => {
    const width = (bar.width * remaining.value) / deadline;
    return rect(width, 40, { stroke: 'pink', fill: 'pink' }).moveTo([
      bar.right - width / 2,
      bar.point('center')[1],
    ]);
  });
  const elapsedLabel = place(mono(elapsed + ' s elapsed', { size: 40 }), value);
  const left = place(
    mono(deadline + ' − ' + elapsed + ' = ' + (deadline - elapsed) + ' s left', { size: 38 }),
    value,
  );
  const bounds = place(mono(ports[0] + '  ≤  port  <  ' + ports[1], { size: 48 }), range);
  const status = (v, color) => place(label(v, { size: 41, color }), foot);
  const accepted = status('Return ' + good.port + '   ·   PAYLOAD unread', 'green');
  const question = status('Can this stream carry the next command?', 'yellow');
  const reject = status('Port out of range   ·   handshake rejected', 'yellow');
  const run = (cue) =>
    c.on(cue, () => s.play(to(marker, (n) => n.moveTo(stop), { duration: 1.3 })));
  s.add(
    heading(c.title),
    place(label('Input stream', { size: 39 }), title),
    ok,
    port[0],
    end,
    payload,
    marker,
  );
  c.on('read', () =>
    s.play(
      to(marker, (n) => n.moveTo([boxOf(port[0]).point('right')[0] - 12, y]), { duration: 1.3 }),
    ),
  );
  c.on('stop', () => s.play(to(marker, (n) => n.moveTo(stop), { duration: 0.35 })));
  c.on('replay', () => s.play(to(marker, (n) => n.moveTo(start), { duration: 0.3 })));
  c.show('limits', clock);
  c.show('limits', [full, remainingBar]);
  c.on('elapsed', () =>
    s.play(
      remaining.to(deadline - elapsed, { duration: 0.7 }),
      to(marker, (n) => n.moveTo([boxOf(ok).point('right')[0] - 12, y]), { duration: 0.7 }),
    ),
  );
  c.show('elapsed', elapsedLabel, { after: true });
  c.swap('left', elapsedLabel, left, { after: true });
  c.swap('complete', [full, remainingBar, left], bounds);
  run('complete');
  c.show('first', accepted, { after: true });
  c.hide('upper', accepted);
  c.swap('upper', port[0], port[1], { after: true });
  c.after('upper', () => {
    s.play(to(marker, (n) => n.moveTo(start), { duration: 0.18 }));
    s.play(to(marker, (n) => n.moveTo(stop), { duration: 1.3 }));
  });
  c.show('ask', question);
  c.swap('reject', question, reject, { after: true });
}
