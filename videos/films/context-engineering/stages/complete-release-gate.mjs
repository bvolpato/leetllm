import { CONTEXT_RELEASE_CASES } from '../fixtures.mjs';
import { contextRelease } from '../arithmetic.mjs';
import { caseClock, casePage } from '../case-file.mjs';

export function drawCompleteReleaseGate(ctx, scene, state, api) {
  const { text, box, rule, focus, C } = casePage(ctx, api);
  const clock = caseClock(scene, state);
  const repaired = clock.done('gate-repair');
  const cases = repaired
    ? CONTEXT_RELEASE_CASES.map((r) => (r.id === 'C2' ? { ...r, curated: true } : r))
    : CONTEXT_RELEASE_CASES;
  const result = contextRelease(cases);
  text('Ten paired incident cases', 150, 284, 38);
  text('Assigned input units', 1755, 263, 27, C.muted, 'right');
  text(
    result.rawUnits.toLocaleString('en-US') + '  →  ' + result.curatedUnits.toLocaleString('en-US'),
    1755,
    319,
    40,
    C.blue,
    'right',
  );
  text('Raw', 150, 489, 37);
  text('Curated', 150, 612, 37);
  focus('paired-cases', () => {
    cases.forEach((r, i) => {
      const x = 392 + i * 139;
      text(r.id, x + 53, 402, 30, r.critical ? C.yellow : C.muted, 'center');
      for (const [j, key] of ['raw', 'curated'].entries()) {
        const y = 431 + j * 123;
        const show = j === 0 || clock.started('gate-outcomes');
        const changed = j === 1 && show && r.raw !== r.curated;
        const color = !show ? C.muted : changed ? (r.curated ? C.green : C.pink) : C.ink;
        box(x, y, 107, 81, C.panel, color);
        text(!show ? '?' : r[key] ? 'pass' : 'fail', x + 53, y + 53, 32, color, 'center');
      }
      if (r.critical) {
        rule(x, 655, x + 107, 655, C.yellow, 4);
        text('protected', x + 53, 710, 26, C.yellow, 'center');
      }
    });
  });
  focus('suite-decision', () => {
    const tallied = clock.done('gate-score');
    text('Successes', 150, 818, 27, C.muted);
    text(
      tallied ? result.raw + '/10   →   ' + result.curated + '/10' : 'Compare each pair',
      150,
      883,
      48,
    );
    text('Poisoning events', 735, 818, 27, C.muted);
    text(
      cases.reduce((n, r) => n + r.poison, 0),
      735,
      883,
      48,
    );
    text('Release decision', 1210, 818, 27, C.muted);
    const decided = repaired ? clock.done('gate-approve') : clock.done('gate-hold');
    text(
      decided ? (result.approved ? 'Pass this suite' : 'Hold at C2') : '?',
      1210,
      883,
      48,
      decided ? (result.approved ? C.green : C.pink) : C.yellow,
    );
  });
}

export default {
  id: 'complete-release-gate',
  draw: drawCompleteReleaseGate,
  cues: ['gate-outcomes', 'gate-score', 'gate-hold', 'gate-repair', 'gate-approve'],
};
