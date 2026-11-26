// Scene 20: Who supplied the value in slot one? Early reuse race vs waiting for completion event on Page 14 slot 1.
import {
  COSMOS,
  LEASE_EARLY,
  LEASE_WAIT,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function integrationLease(s, c) {
  const phase = s.value(0);
  const earlyWrite = s.value(0);
  const askRet = s.value(0);
  const revEarlyRead = s.value(0); // strictly withheld until lease-early-read!
  const revLateRead = s.value(0); // strictly withheld until lease-late-read!
  const devEvent = s.value(0);
  const lateWrite = s.value(0);

  const bgAura = aura(0, 20, 660, '#ff6b8b1a', '#6ee7b71a');

  const title = heroTitle(['Who Supplied the Value', 'in Slot One?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.bad,
    eyebrow: 'ALLOCATOR LEASE RACE · PAGE 14 SLOT 1',
    subtitle: 'R2 cancelled on host, but GPU read expects [0, 1]; R9 wants to write [1, 0]',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const ew = earlyWrite.value > 0.5;
    const ask = askRet.value > 0.5;
    const er = revEarlyRead.value > 0.5;
    const lr = revLateRead.value > 0.5;
    const ev = devEvent.value > 0.5;
    const lw = lateWrite.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Top track: Policy A (Immediate Reuse - Race!)
      txt('TOP RUN · IMMEDIATE REUSE', -855, -135, 26, ew ? ROLE.bad : ROLE.warn, 'mono', 'left'),
      line([-840, -50], [840, -50], { stroke: COSMOS.rule, width: 3 }),

      glassCell(-655, -50, 280, 92, ROLE.r2, { fill: '#102438', glow: 5 }),
      txt('Initial: [0, 1]', -655, -50, 28, ROLE.r2, 'mono'),

      glassCell(-245, -50, 330, 92, ew ? ROLE.bad : COSMOS.dim, {
        fill: ew ? '#30101c' : '#0c1222',
        glow: ew ? 10 * pulse : 0,
      }),
      txt(
        ew ? 'R9 writes [1, 0]' : 'R9 waiting...',
        -245,
        -50,
        28,
        ew ? ROLE.bad : COSMOS.dim,
        'mono',
      ),

      glassCell(175, -50, 320, 92, er ? ROLE.bad : COSMOS.gold, {
        fill: er ? '#33101d' : '#241e10',
        glow: er ? 11 * pulse : 6,
      }),
      txt(
        er ? `R2 reads [${LEASE_EARLY.returned.join(', ')}]!` : 'R2 reads -> ?',
        175,
        -50,
        28,
        er ? ROLE.bad : COSMOS.gold,
        'mono',
      ),

      glassCell(620, -50, 340, 92, ROLE.r1, { fill: '#1c1336', glow: 5 }),
      txt(
        ew ? `Final slot: [${LEASE_EARLY.value.join(', ')}]` : 'Final slot: [0, 1]',
        620,
        -50,
        26,
        COSMOS.ink,
        'mono',
      ),

      // Bottom track: Policy B (Wait for Completion Event - Safe!)
      txt('BOTTOM RUN · WAIT FOR GPU COMPLETION EVENT', -855, 65, 26, ROLE.good, 'mono', 'left'),
      line([-840, 150], [840, 150], { stroke: COSMOS.rule, width: 3 }),

      glassCell(-655, 150, 280, 92, ROLE.r2, { fill: '#102438', glow: 5 }),
      txt('Initial: [0, 1]', -655, 150, 28, ROLE.r2, 'mono'),

      glassCell(-245, 150, 330, 92, lr ? ROLE.good : COSMOS.gold, {
        fill: lr ? '#0e2b24' : '#241e10',
        glow: lr ? 10 * pulse : 6,
      }),
      txt(
        lr ? `R2 reads [${LEASE_WAIT.returned.join(', ')}]` : 'R2 reads -> ?',
        -245,
        150,
        28,
        lr ? ROLE.good : COSMOS.gold,
        'mono',
      ),

      glassCell(175, 150, 320, 92, ev ? ROLE.good : COSMOS.dim, {
        fill: ev ? '#0f2824' : '#0b101d',
        glow: ev ? 9 : 0,
        dash: ev ? undefined : [8, 6],
      }),
      txt(
        ev ? 'Event: DONE -> R9' : 'Wait for event...',
        175,
        150,
        26,
        ev ? ROLE.good : COSMOS.dim,
        'mono',
      ),

      glassCell(620, 150, 340, 92, lw ? ROLE.good : COSMOS.dim, {
        fill: lw ? '#102824' : '#0c1222',
        glow: lw ? 9 : 0,
      }),
      txt(
        lw ? `R9 writes [${LEASE_WAIT.value.join(', ')}]` : 'Final slot: [0, 1]',
        620,
        150,
        26,
        lw ? ROLE.good : COSMOS.muted,
        'mono',
      ),
    ];

    // Bottom verdict strip (strictly withheld during prediction & gated step-by-step!)
    let vCol = COSMOS.cyan;
    let v1 = 'Same page 14, slot 1, and math in both runs; only write timing differs';
    if (ask && !er) {
      vCol = COSMOS.gold;
      v1 = 'Predict: what vector does R2 read return in the top run vs bottom run?';
    } else if (er && !lr) {
      vCol = ROLE.bad;
      v1 = 'Top run picks up R9 [1, 0] (corrupted!) · Checking bottom run next...';
    } else if (lr && !ev) {
      vCol = ROLE.warn;
      v1 = 'Top run returns R9 [1, 0] (corrupted!) · Bottom run returns R2 [0, 1] (correct!)';
    } else if (ev && !lw) {
      vCol = ROLE.good;
      v1 = 'Device event DONE: zero active readers -> allocator hands Page 14 to R9';
    } else if (lw) {
      vCol = ROLE.good;
      v1 =
        'Both slots end holding [1, 0], yet only waiting preserved R2 output: inspect reader trace!';
    }

    nodes.push(
      glassCell(0, 340, 1660, 110, vCol, { fill: '#0e172a', glow: 9 }),
      txt(v1, 0, 340, 28, vCol, 'mono').glow(5, vCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('lease-early-write', () =>
    s.play(earlyWrite.to(1, { duration: remainDuration(c, 'lease-early-write', 0.4) })),
  );
  c.on('lease-question', () =>
    s.play(askRet.to(1, { duration: remainDuration(c, 'lease-question', 0.4) })),
  );
  c.after('lease-early-read', () =>
    s.play(revEarlyRead.to(1, { duration: remainAfter(c, 'lease-early-read', 0.4) })),
  );
  c.after('lease-late-read', () =>
    s.play(revLateRead.to(1, { duration: remainAfter(c, 'lease-late-read', 0.4) })),
  );
  c.on('lease-event', () =>
    s.play(devEvent.to(1, { duration: remainDuration(c, 'lease-event', 0.4) })),
  );
  c.on('lease-late-write', () =>
    s.play(lateWrite.to(1, { duration: remainDuration(c, 'lease-late-write', 0.4) })),
  );
}
