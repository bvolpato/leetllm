// Scene 09: A spill changes accesses and can consume another residency budget: 4B store + 4B load x 20 = 160B + CUDA 13 shared spilling.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function spillWorkload(s, c) {
  const phase = s.value(0);
  const showAccess = s.value(0);
  const showIters = s.value(0);
  const showTotal = s.value(0);
  const showStatic = s.value(0);
  const showLaunchMax = s.value(0);
  const showShared = s.value(0);
  const showSharedRes = s.value(0);

  const bgAura = aura(0, 20, 640, '#fb923c1e', '#5ce1e618');
  const title = heroTitle(['Spills, Traffic &', 'Residency Budgets'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'LOCAL MEMORY SPILLS & CUDA 13 SHARED SPILL',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sa = showAccess.value;
    const si = showIters.value;
    const st = showTotal.value;
    const ss = showStatic.value;
    const lm = showLaunchMax.value;
    const sh = showShared.value;
    const sr = showSharedRes.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Thread <-> Local Memory spill loop
      glassCell(-640, -110, 320, 118, ROLE.ir, { fill: '#0f2035', glow: 8 }),
      txt('THREAD REGISTERS', -640, -138, 26, ROLE.ir, 'mono'),
      txt('pressure overflow', -640, -86, 26, COSMOS.muted, 'sans'),

      glassCell(-640, 145, 320, 118, ROLE.warn, { fill: '#2a1810', glow: 9 * pulse }),
      txt('LOCAL MEMORY', -640, 116, 26, ROLE.warn, 'mono'),
      txt('device-backed (cached)', -640, 168, 26, COSMOS.muted, 'sans'),

      glowingArc([-720, -48], [-720, 84], 0, {
        color: ROLE.warn,
        width: 3.6,
        opacity: sa > 0.5 ? 0.92 : 0.35,
      }),
      glowingArc([-560, 84], [-560, -48], 0, {
        color: ROLE.ir,
        width: 3.6,
        opacity: sa > 0.5 ? 0.92 : 0.35,
      }),
      txt('4B store', -825, 18, 26, ROLE.warn, 'mono'),
      txt('4B load', -455, 18, 26, ROLE.ir, 'mono'),

      // Center: Dynamic spill byte calculation
      glassCell(-30, -108, 480, 172, st > 0.5 ? COSMOS.gold : ROLE.warn, {
        fill: '#221c10',
        glow: st > 0.5 ? 10 : 4,
      }),
      txt('DYNAMIC REQUESTS / THREAD', -30, -158, 26, COSMOS.muted, 'mono'),
      txt(
        si > 0.5 ? '(4 B + 4 B) × 20 iters' : '1 spill store + 1 spill load',
        -30,
        -108,
        28,
        COSMOS.ink,
        'mono',
      ),
      txt(
        st > 0.5 ? '= 160 B / thread' : 'waiting...',
        -30,
        -56,
        34,
        st > 0.5 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),

      // Lower-center: Static report & launch_bounds rules
      glassCell(-30, 130, 480, 148, lm > 0.5 ? ROLE.fail : ss > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: '#0e1b30',
        glow: ss > 0.5 ? 7 : 0,
      }),
      txt('CAPS & LAUNCH BOUNDS', -30, 88, 26, COSMOS.muted, 'mono'),
      txt(
        lm > 0.5
          ? 'block > maxThreads → FAIL'
          : ss > 0.5
            ? 'static width × exec count'
            : 'ptxas static spill report',
        -30,
        138,
        26,
        lm > 0.5 ? ROLE.fail : COSMOS.ink,
        'mono',
      ),
      txt('ABI min floor · time warmed', -30, 182, 26, COSMOS.muted, 'sans'),

      // Right: CUDA 13 shared-memory spilling trade-off
      glassCell(580, 10, 520, 320, sh > 0.5 ? ROLE.triton : COSMOS.dim, {
        fill: sh > 0.5 ? '#1b1433' : '#0b101d',
        glow: sh > 0.5 ? 10 : 0,
      }),
      txt('CUDA 13 SHARED SPILL', 580, -108, 28, ROLE.triton, 'mono'),
      txt(
        sh > 0.5 ? 'Shared mem before local' : 'whole-program option',
        580,
        -42,
        28,
        COSMOS.ink,
        'sans',
      ),
      txt(
        sr > 0.5 ? 'Extra SMEM can cut blocks' : 'Excludes dynamic SMEM',
        580,
        26,
        26,
        sr > 0.5 ? ROLE.warn : COSMOS.muted,
        'mono',
      ),
      txt(
        sr > 0.5 ? 'Compare regs + SMEM + time' : 'No warp reg reallocation',
        580,
        96,
        26,
        sr > 0.5 ? ROLE.cubin : COSMOS.muted,
        'sans',
      ),
    ];

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-820 + u * 1640, 336, { radius: 6, color: sr > 0.5 ? ROLE.triton : ROLE.warn }),
      txt(
        sr > 0.5
          ? 'Compare regs, stack, spills, SMEM reports & warmed timings on target'
          : 'Count requested spill bytes here; measure DRAM traffic on GPU',
        0,
        392,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('spill-accesses', () =>
    s.play(showAccess.to(1, { duration: remainDuration(c, 'spill-accesses', 0.4) })),
  );
  c.on('spill-iterations', () =>
    s.play(showIters.to(1, { duration: remainDuration(c, 'spill-iterations', 0.4) })),
  );
  c.on('spill-total', () =>
    s.play(showTotal.to(1, { duration: remainDuration(c, 'spill-total', 0.45) })),
  );
  c.on('static-dynamic', () =>
    s.play(showStatic.to(1, { duration: remainDuration(c, 'static-dynamic', 0.4) })),
  );
  c.on('launch-maximum', () =>
    s.play(showLaunchMax.to(1, { duration: remainDuration(c, 'launch-maximum', 0.4) })),
  );
  c.on('shared-spill', () =>
    s.play(showShared.to(1, { duration: remainDuration(c, 'shared-spill', 0.45) })),
  );
  c.on('shared-residency', () =>
    s.play(showSharedRes.to(1, { duration: remainDuration(c, 'shared-residency', 0.45) })),
  );
}
