import { captions, frame, record, signal, vertex, wire } from '../parts.mjs';

export default function instrument(s, c) {
  frame(
    s,
    'Can a flag identify the effect of uptake?',
    'Candidate encouragement design',
    'Instrument assumptions',
  );
  const a = vertex('Workflow', 'a', 'cyan'),
    y = vertex('Resolution', 'y', 'green'),
    u = vertex('Hidden urgency', 'cause', 'dim', { dash: true });
  const flag = vertex('Random flag', [0.18, 0.87]),
    delay = vertex('Latency', [0.83, 0.87], 'red');
  const ua = wire(u, a),
    uy = wire(u, y),
    ay = wire(a, y, 'cyan'),
    za = wire(flag, a, 'yellow'),
    zl = wire(flag, delay, 'red'),
    ly = wire(delay, y, 'red');
  const [uptake, independence, exclusion] = record(s, [
    ['Relevance', 'Does uptake change?'],
    ['Independence', 'Randomized flag'],
    ['Exclusion', 'Through workflow only'],
  ]);
  s.add(u, a, y, ua, uy, ay);
  signal(s, c, 'confound', [ua, uy]);
  c.show('flag', [flag, za]);
  signal(s, c, 'changes', [za]);
  signal(s, c, 'relevance', [za, ay]);
  uptake(c, 'relevance', 'Flag → workflow');
  c.show('latency', [delay, zl, ly]);
  signal(s, c, 'failure', [zl, ly]);
  exclusion(c, 'failure', 'Violated by latency', true);
  captions(s, c, 'Hidden urgency can influence both routing and resolution.', [
    ['flag', 'A randomized flag encourages use of the assistant.'],
    ['relevance', 'The outcome must respond to the flag only through workflow uptake.'],
    ['failure', 'A delay changes resolution along a path that bypasses the workflow.', true],
  ]);
}
