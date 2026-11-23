import { assertEqual, boxOf, column, fadeIn, indicate, line, place, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox } from '../../kit-narrated.mjs';
import { sandboxReadiness } from '../parts.mjs';

export default function scene(s, c) {
  const checks = ['clock', 'kernel randomness', 'network', 'control', 'application state'];
  const receipts = checks.map((name) => ({ name, generation: 4, status: 'Pass' }));
  const stale = { ...receipts[4], generation: 3 };
  assertEqual(
    sandboxReadiness([...receipts.slice(0, 4), stale]).ready,
    false,
    'stale application receipt',
  );
  assertEqual(sandboxReadiness(receipts).ready, true, 'all current observations');

  const [header, body, foot] = area.rows([0.7, 5.3, 0.8], 'normal');
  const [paper, sockets, command] = body.columns([1.15, 1.65, 1.4], 'wide');
  const arrivals = paper.rows(5, 'normal');
  const required = sockets.rows(5, 'normal');
  const titles = header.columns([1.15, 1.65, 1.4], 'wide');
  const heads = ['Incoming receipt', 'A / J4    ·    generation 4', 'Guest supervisor'].map(
    (v, i) => place(label(v, { size: 35, color: i === 1 ? 'cyan' : 'ink' }), titles[i]),
  );
  const empty = checks.map((v, i) =>
    place(
      namedBox(v + '   ·   waiting', {
        width: required[i].width,
        height: 72,
        size: 34,
        color: 'dim',
        dash: true,
      }),
      required[i],
    ),
  );
  const passed = receipts.map((r, i) =>
    place(
      namedBox(r.name + '   ·   g' + r.generation, {
        width: required[i].width,
        height: 72,
        size: 38,
        color: 'green',
      }),
      required[i],
    ),
  );
  const ticket = (r, i, color) =>
    place(
      namedBox('PASS   /   g' + r.generation, {
        width: arrivals[i].width - 36,
        height: 72,
        size: 36,
        color,
        font: 'mono',
      }),
      arrivals[i],
    );
  const old = ticket(stale, 4, 'cyan');
  const waiting = place(
    column([mono('analysis.py', { size: 46 }), label('Queued', { size: 40, color: 'dim' })], {
      gap: 'wide',
    }),
    command,
  );
  const running = place(
    column([mono('analysis.py', { size: 46 }), label('Running', { size: 40, color: 'green' })], {
      gap: 'wide',
    }),
    command,
  );
  const gate = line(command.point('top left'), command.point('bottom left'), {
    width: 10,
    stroke: 'dim',
  });
  const message = (words, color) => place(label(words, { color, size: 43 }), foot);
  const ask = message('Can generation 4 start analysis.py?', 'yellow');
  const held = message('Hold for a generation-4 application check.', 'yellow');
  const started = message('Five current checks passed.', 'green');

  s.add(heading(c.title), heads, empty, gate, waiting);
  const settle = (cue, i) => {
    const slip = ticket(receipts[i], i, 'cyan');
    c.on(cue, () => {
      s.play(fadeIn(slip, { duration: 0.12 }));
      s.play(to(slip, (n) => n.moveTo(boxOf(empty[i]).point('center')), { duration: 0.55 }));
    });
    c.hide(cue, empty[i], { lead: 0 });
    c.swap(cue, slip, passed[i], { lead: -0.7 });
  };
  for (const [i, cue] of ['clock', 'kernel', 'net', 'control'].entries()) settle(cue, i);
  c.show('old', old);
  c.show('ask', ask);
  c.swap('hold', ask, held, { after: true });
  c.on('stale', () => s.play(indicate(old, { color: 'yellow', scale: 1 })));
  c.hide('current', old, { lead: 0.18, fade: 0.15 });
  settle('current', 4);
  c.swap('open', [waiting, gate, held], [running, started], { after: true });
}
