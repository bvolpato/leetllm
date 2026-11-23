import { place, table } from 'vizmatic/stage';
import { board, body, guide, fmt, readings } from '../parts.mjs';

export default function diagnoseReplay(s, c) {
  board(s, c, 'Where did the new policy stop?', 'Controlled replay · repository policy');
  const old = 90,
    fresh = 30;
  const days = (n) => n + ' days';
  const rows = [
    { id: 'Policy source', value: days(fresh), action: 'Revision deployed' },
    { id: 'Rendered input', value: '?', action: 'Inspect final request' },
    { id: 'Prefix entry', value: '?', action: 'Check matched boundary' },
    { id: 'Answer', value: days(old), action: 'Observed reply' },
  ];
  const history = body;
  const trace = place(
    table(
      [
        { key: 'id', label: 'Boundary' },
        { key: 'value', label: 'Observed', sample: '0 cache reads' },
        { key: 'action', label: 'Replay', sample: 'Inspect generation directly' },
      ],
      rows,
      { width: body.width * 0.96, size: 38, leading: 1.95 },
    ),
    history,
  );
  const trials = place(table([
    { key: 'trial', label: 'Request', sample: 'Before eviction' },
    { key: 'input', label: 'Rendered input', sample: '30 days' },
    { key: 'model', label: 'Model', sample: 'rev 7' },
    { key: 'entry', label: 'Entry', sample: 'Authorized G' },
    { key: 'read', label: 'Read tokens', sample: fmt(guide) },
  ], [
    { id: 'original', trial: 'Original miss', input: days(fresh), model: 'rev 7', entry: 'Unknown', read: '0' },
    { id: 'control', trial: 'Before eviction' },
    { id: 'replay', trial: 'After eviction' },
  ], { width: body.width * 0.96, size: 37, leading: 2.5 }), body);
  const sameRequest = (id) => [
    trials.setCell(id, 'input', days(fresh)), trials.setCell(id, 'model', 'rev 7'),
  ];
  s.add(trace);
  c.on('diagnose-input', () =>
    s.play(trace.light('Rendered input'), trace.setCell('Rendered input', 'value', days(old))),
  );
  c.on('diagnose-change', () => s.play(trace.light('Prefix entry')));
  c.on('diagnose-render', () =>
    s.play(
      trace.setCell('Rendered input', 'value', days(fresh)),
      trace.setCell('Rendered input', 'action', 'Renderer repaired'),
      trace.light('Rendered input'),
    ),
  );
  c.after('diagnose-cold', () =>
    s.play(
      trace.setCell('Prefix entry', 'value', '0 cache reads'),
      trace.setCell('Prefix entry', 'action', 'Verified cold run'),
      trace.light('Answer'),
    ),
  );
  c.after('diagnose-bypass', () =>
    s.play(
      trace.setCell('Answer', 'value', '?'),
      trace.setCell('Answer', 'action', 'Inspect generation directly'),
    ),
  );
  c.swap('diagnose-miss', trace, trials);
  c.on('diagnose-control', () => s.play(trials.light('control'), ...sameRequest('control'),
    trials.setCell('control', 'entry', 'Authorized G')));
  c.after('diagnose-control', () => s.play(trials.setCell('control', 'read', fmt(guide))));
  c.on('diagnose-eviction', () => s.play(trials.light('replay'),
    trials.setCell('replay', 'entry', 'G evicted')));
  c.on('diagnose-repeat', () => s.play(...sameRequest('replay')));
  c.after('diagnose-repeat', () => s.play(trials.setCell('replay', 'read', '0')));
  readings(s, c, 'The observed reply still quotes the old policy.', [
    ['diagnose-input', 'First mismatch · source versus rendered input', 'red'],
    ['diagnose-change', 'Changed input invalidates dependent prefix state.'],
    ['diagnose-cold', 'The stale answer survives a cold prefill.', 'red'],
    ['diagnose-bypass', 'Keep the rendered input and model fixed.'],
    ['diagnose-miss', 'The original miss has no known cause.'],
    ['diagnose-repeat', 'Removing G changes the replay from ' + fmt(guide) + ' read tokens to 0.', 'cyan'],
  ]);
}
