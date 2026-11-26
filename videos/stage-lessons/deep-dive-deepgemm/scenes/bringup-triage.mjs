// Scene 25: Reject incompatible inputs before reading a stopwatch.
// Oct prereqs (SM90/100, Py 3.8+, C++20 <format>, CUDA 12.9+, PyTorch 2.3+/2.9+ Mega MoE, CUTLASS 4);
// Shape gates (% 128, experts % ep == 0); Symptom triage router; Code reading order.
import {
  COSMOS,
  ROLE,
  aura,
  buildTmaTmemPipeline3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function bringupTriage(s, c) {
  const phase = s.value(0);
  const stage3d = s.value(0);
  const step = s.value(0); // 1=Oct prereqs, 2=Mega MoE 2.9+, 3=shape gates, 4=symptom router, 5=speedup/drift, 6=reading order

  const bgAura = aura(445, 20, 520, '#fb923c1c', '#5ce1e61c');
  const { view: pipe3d } = buildTmaTmemPipeline3d(stage3d, phase, { x: 455, y: 15, unit: 92 });

  const title = heroTitle(['Reject Bad Inputs', 'Before the Stopwatch'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'BRING-UP & SYMPTOM TRIAGE',
    subtitle: 'Gate toolchain & shapes first, then route each failure cleanly',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D BRING-UP GATE PIPELINE', 455, -415, 26, ROLE.warn, 'mono').glow(5, ROLE.warn),
      txt(
        'Compute Sanitizer for hazards · Ref math for values',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Top panel: Oct prerequisites & shape gates
    nodes.push(
      glassCell(-665, -110, 388, 128, st >= 0.6 ? ROLE.a : COSMOS.dim, {
        fill: '#101d38',
        glow: st >= 0.6 ? 8 : 0,
      }),
      txt('OCT TOOLCHAIN GATES', -665, -148, 26, ROLE.a, 'mono'),
      txt('SM90/100 · CUDA 12.9+', -665, -108, 26, COSMOS.ink, 'mono'),
      txt(
        st >= 1.6 ? 'PyTorch 2.9+ · C++20' : 'PyTorch 2.3+ · CUT4',
        -665,
        -68,
        26,
        ROLE.gold,
        'mono',
      ),

      glassCell(-245, -110, 415, 128, st >= 2.6 ? ROLE.c : COSMOS.dim, {
        fill: '#0e2030',
        glow: st >= 2.6 ? 8 : 0,
      }),
      txt('STARTUP SHAPE GATES', -245, -148, 26, ROLE.c, 'mono'),
      txt('H % 128 == 0 · I % 128', -245, -108, 26, COSMOS.ink, 'mono'),
      txt('experts % ep == 0', -245, -68, 26, COSMOS.muted, 'mono'),
    );

    // Middle: 4 symptom-to-cause routers
    const symptoms = [
      { sym: 'Wrong output', fix: 'scales · layout · IDs', col: ROLE.bad, x: -665, y: 42 },
      { sym: 'Slow 1st call', fix: 'JIT compile miss', col: ROLE.scale, x: -245, y: 42 },
      { sym: 'Mega MoE hang', fix: 'ranks · rendezvous', col: ROLE.warn, x: -665, y: 160 },
      { sym: 'Speedup gone', fix: 'casts · pack · clocks', col: ROLE.gold, x: -245, y: 160 },
    ];
    symptoms.forEach((item, idx) => {
      const lit = idx < 3 ? st >= 3.5 : st >= 4.5;
      nodes.push(
        glassCell(item.x, item.y, idx % 2 === 0 ? 388 : 415, 96, lit ? item.col : COSMOS.dim, {
          fill: '#0e172a',
          glow: lit ? 8 : 0,
        }),
        txt(item.sym, item.x, item.y - 18, 26, lit ? item.col : COSMOS.muted, 'mono'),
        txt(`-> ${item.fix}`, item.x, item.y + 22, 26, COSMOS.ink, 'sans'),
      );
    });

    // Bottom: Code reading route
    if (st >= 5.5) {
      nodes.push(
        glassCell(-460, 294, 800, 88, ROLE.good, { fill: '#0e2620', glow: 9 }),
        txt('Order: wrappers -> JIT -> tile -> sched -> tests', -460, 294, 26, ROLE.good, 'mono'),
      );
    }

    nodes.push(
      txt(
        'Reproduce one complete supported contract before broad benchmarking',
        -860,
        388,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, pipe3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pipe3d, { theta: -0.2, phi: 0.94 });

  c.on('bt-prereq', () => s.play(step.to(1, { duration: remainDuration(c, 'bt-prereq', 0.45) })));
  c.on('bt-megamoe', () => {
    const dur = remainDuration(c, 'bt-megamoe', 0.45);
    s.play(step.to(2, { duration: dur }));
    s.play(stage3d.to(1, { duration: dur }));
  });
  c.on('bt-gates', () => {
    const dur = remainDuration(c, 'bt-gates', 0.45);
    s.play(step.to(3, { duration: dur }));
    s.play(stage3d.to(2, { duration: dur }));
  });
  c.on('bt-symptoms', () =>
    s.play(step.to(4, { duration: remainDuration(c, 'bt-symptoms', 0.45) })),
  );
  c.on('bt-speedup', () => s.play(step.to(5, { duration: remainDuration(c, 'bt-speedup', 0.45) })));
  c.on('bt-order', () => {
    const dur = remainDuration(c, 'bt-order', 0.45);
    s.play(step.to(6, { duration: dur }));
    s.play(stage3d.to(3, { duration: dur }));
  });
}
