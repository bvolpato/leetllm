// Scene 32: Teacher traces and rewards enter different optimization steps (Distillation vs direct RLVR: 72.6 vs 47.0)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function teacherTransfer(s, c) {
  const phase = s.value(0);
  const sSup = s.value(0);
  const sOnl = s.value(0);
  const s800 = s.value(0);
  const sDist = s.value(0);
  const sDir = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#2e1d5414');
  const title = heroTitle(['Teacher Traces vs', 'Direct Online RLVR'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'DISTILLATION (SFT) vs DIRECT RL · QWEN-32B AIME PASS@1',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sp = Math.max(0.65, sSup.value);
    const on = Math.max(0.65, sOnl.value);
    const d8 = Math.max(0.65, s800.value);
    const ds = Math.max(0.65, sDist.value);
    const dr = Math.max(0.65, sDir.value);

    const bx = 90;
    const barMax = 660;
    const wDist = (72.6 / 100) * barMax;
    const wDir = (47.0 / 100) * barMax;

    const nodes = [
      // Left: Two optimization paths
      glassCell(-465, -90, 740, 165, COSMOS.cyan, {
        fill: '#102138',
        glow: sp > 0.7 ? 8 : 3,
        opacity: sp,
      }),
      txt('DISTILLATION (OFFLINE SFT)', -800, -135, 26, COSMOS.cyan, 'mono', 'left').opacity(sp),
      txt(
        'Fits teacher traces by token cross-entropy',
        -800,
        -82,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(sp),
      txt(
        '800K R1 mix: 600K reasoning + 200K general',
        -800,
        -34,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(d8),

      glassCell(-465, 118, 740, 165, COSMOS.emerald, {
        fill: '#0e2524',
        glow: on > 0.7 ? 8 : 3,
        opacity: on,
      }),
      txt('DIRECT RLVR (ONLINE POLICY RL)', -800, 72, 26, COSMOS.emerald, 'mono', 'left').opacity(
        on,
      ),
      txt(
        'Samples own rollouts + executable checker',
        -800,
        126,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(on),
      txt(
        'Teacher can cold-start RL or distill afterward',
        -800,
        174,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(on),

      // Right: R1 Table 6 comparison (Qwen-32B AIME pass@1: 72.6% vs 47.0%)
      txt('R1 TABLE 6 · QWEN-32B AIME PASS@1', bx, -192, 26, COSMOS.gold, 'mono', 'left'),

      txt('Distilled from R1 (800K)', bx, -116, 28, COSMOS.emerald, 'sans', 'left').opacity(ds),
      rect(wDist, 66, { fill: '#103c33', stroke: COSMOS.emerald, width: 2.6, radius: 8 })
        .at(bx + wDist * 0.5, -54)
        .glow(ds > 0.7 ? 10 * pulse : 4, COSMOS.emerald)
        .opacity(ds),
      txt('72.6%', bx + wDist + 22, -52, 34, COSMOS.emerald, 'mono', 'left').opacity(ds),

      txt('Directly RL-trained Qwen-32B', bx, 38, 28, COSMOS.amber, 'sans', 'left').opacity(dr),
      rect(wDir, 66, { fill: '#3a2610', stroke: COSMOS.amber, width: 2.6, radius: 8 })
        .at(bx + wDir * 0.5, 100)
        .glow(dr > 0.7 ? 8 : 3, COSMOS.amber)
        .opacity(dr),
      txt('47.0%', bx + wDir + 22, 102, 34, COSMOS.amber, 'mono', 'left').opacity(dr),

      glowDot(-820, 325, { radius: 6, color: COSMOS.gold }),
      txt(
        'Full cost comparison must count teacher generation, filtering & verification alongside student training',
        -790,
        327,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-teacher-transfer-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-supervised-teacher-transfer', () => s.play(sSup.to(1, { duration: 0.45 })));
  c.on('vr-online-teacher-transfer', () => s.play(sOnl.to(1, { duration: 0.45 })));
  c.on('vr-teacher-transfer-b1', () => s.play(s800.to(0.6, { duration: 0.35 })));
  c.on('vr-800k-teacher-transfer', () => s.play(s800.to(1, { duration: 0.45 })));
  c.on('vr-teacher-transfer-b2', () => s.play(sDist.to(0.6, { duration: 0.35 })));
  c.on('vr-distilled-teacher-transfer', () => s.play(sDist.to(1, { duration: 0.45 })));
  c.on('vr-direct-teacher-transfer', () =>
    s.play(sDir.to(1, { duration: remainDuration(c, 'vr-direct-teacher-transfer', 0.45) })),
  );
}
