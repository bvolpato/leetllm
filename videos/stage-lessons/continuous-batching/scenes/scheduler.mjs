// Scene 05: scheduler: Safe iteration boundary, A retires -> D admitted -> E waits at tick 4 -> E joins at tick 5 -> 1 free page blocks D.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function scheduler(s, c) {
  const phase = s.value(0); // 0=A done/D fits, 1=tick4 E waits, 2=B ends/E joins tick5, 3=1 page short

  const bgAura = aura(0, 0, 740, '#14335c28', '#24184022');
  const title = heroTitle(['Safe Iteration Boundaries:', 'When Can E Join?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.d,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ph = Math.round(phase.value);
    const seat0 = ph === 3 ? 'OPEN (1 pg free)' : 'D  (admitted @ tick 3)';
    const seat1 =
      ph >= 2 ? 'E  (joined @ tick 5)' : ph === 1 ? 'B  (final tick 4)' : 'B  (running)';
    const seat2 = 'C  (running -> tick 6)';
    const queue =
      ph === 0
        ? 'Waiting: D fits (seats + work + KV)'
        : ph === 1
          ? 'Waiting: E arrived (all 3 seats full!)'
          : ph === 2
            ? 'Waiting: empty (E admitted safely)'
            : 'Waiting: D needs 2 pages, only 1 free!';

    const nodes = [
      txt(
        'ACTIVE SEAT TABLE (CHANGED ONLY AT SAFE BOUNDARIES)',
        -855,
        -215,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill(`Seat 1:  ${seat0}`, -380, -100, {
        w: 920,
        h: 78,
        color: ph === 3 ? ROLE.warn : ROLE.d,
        size: 30,
        glow: 8,
        opacity: alpha,
      }),
      chipPill(`Seat 2:  ${seat1}`, -380, 5, {
        w: 920,
        h: 78,
        color: ph >= 2 ? ROLE.ok : ROLE.b,
        size: 30,
        glow: ph >= 2 ? 12 : 6,
        opacity: alpha,
      }),
      chipPill(`Seat 3:  ${seat2}`, -380, 110, {
        w: 920,
        h: 78,
        color: ROLE.c,
        size: 30,
        glow: 6,
        opacity: alpha,
      }),

      // Right decision gates
      txt('ADMISSION CHECKS', 220, -215, 26, ROLE.d, 'mono', 'left').opacity(alpha),
      chipPill('1. Open Seat', 475, -100, {
        w: 510,
        h: 74,
        color: ph === 1 ? ROLE.warn : ROLE.ok,
        size: 28,
        opacity: alpha,
      }),
      chipPill('2. Pass Token Budget', 475, 5, {
        w: 510,
        h: 74,
        color: ROLE.ok,
        size: 28,
        opacity: alpha,
      }),
      chipPill(ph === 3 ? '3. KV Pages: 1 < 2 (BLOCK)' : '3. Free KV Pages Ready', 475, 110, {
        w: 510,
        h: 74,
        color: ph === 3 ? ROLE.warn : ROLE.ok,
        fill: ph === 3 ? '#2e1420' : '#10182d',
        size: 26,
        glow: ph === 3 ? 12 : 6,
        opacity: alpha,
      }),

      // Bottom queue & safety rule
      chipPill(queue, 0, 265, {
        w: 1260,
        h: 76,
        color: ph === 3 ? ROLE.warn : ph >= 2 ? ROLE.ok : ROLE.d,
        size: 30,
        glow: 10,
        opacity: alpha,
      }),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'iteration-boundary', (d) => s.play(phase.to(0, { duration: d })));
  playCue(s, c, 'fitting-request', (d) => s.play(phase.to(0, { duration: d })));
  playCue(s, c, 'scheduler-launch', (d) => s.play(phase.to(0, { duration: d })));
  playCue(s, c, 'later-arrival', (d) => s.play(phase.to(1, { duration: d })));
  playCue(s, c, 'admission-boundary', (d) => s.play(phase.to(1, { duration: d })));
  playCue(s, c, 'scheduler-b-finishes', (d) => s.play(phase.to(1.6, { duration: d })));
  playCue(s, c, 'scheduler-e-joins', (d) => s.play(phase.to(2, { duration: d })));
  playCue(s, c, 'empty-correct', (d) => s.play(phase.to(3, { duration: d })));
  playCue(s, c, 'request-fits', (d) => s.play(phase.to(3, { duration: d })));
}
