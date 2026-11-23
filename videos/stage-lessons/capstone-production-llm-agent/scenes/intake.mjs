import { pipeline, place } from 'vizmatic/stage';
import { after, bench, C, field, openBench, records } from '../parts.mjs';

export default function intake(s, c) {
  openBench(s, c, 'Which tickets reach the planner?');
  const [top, lanes, bottom] = bench.rows([3, 4, 1], 'wide');
  const receipts = records(
    top,
    [
      ['id', 'Receipt', 0.16],
      ['route', 'Route', 0.29],
      ['bundle', 'Bundle', 0.16],
      ['who', 'Principal', 0.2],
      ['steps', 'Planner steps', 0.19],
    ],
    [
      { id: 'r-104', route: 'guarded agent', bundle: 'v2', who: 'support-1' },
      { id: 'r-105', route: 'human review', bundle: 'v2', who: 'support-1' },
      { id: 'r-106', route: 'guarded agent', bundle: 'v1', who: 'support-1' },
    ],
    { size: 30 },
  );
  const gates = place(
    pipeline(['Bundle', 'Route', 'Grant', 'Planner'], {
      lanes: 3,
      gates: true,
      width: lanes.width - 8,
      size: 34,
    }),
    lanes,
  );
  const bound = field(bottom, 'Host receipt   ·   support-1 → r-104', C.stored);
  const limited = field(bottom, 'Read grant   ·   support-1 → A300 only', C.ticket);
  s.add(receipts, gates);
  c.on('trusted-intake', () => {
    s.play(
      gates.put(['r-104', 'r-105', 'r-106'].map((id, lane) => ({ id, lane, color: C.ticket }))),
    );
    s.play(receipts.light(null, 'route'));
  });
  c.show('bound-principal', bound, after);
  c.on('bound-principal', () => s.play(receipts.light('r-104', 'who')));
  c.after('routine-plans', () => s.play(gates.move('r-104', 3)));
  c.on('human-route', () => s.play(gates.move('r-105', 1)));
  c.after('human-route', () => s.play(gates.stop('r-105'), receipts.light('r-105', 'route')));
  c.after('old-bundle', () => s.play(gates.stop('r-106'), receipts.light('r-106', 'bundle')));
  c.after('preplanning-stops', () => s.play(receipts.setCell('r-105', 'steps', 0), receipts.setCell('r-106', 'steps', 0)));
  c.swap('account-grant', bound, limited, after);
  c.on('account-grant', () => s.play(receipts.light('r-104')));
  c.clear(gates.laneNodes, 0.8, 0.18);
}
