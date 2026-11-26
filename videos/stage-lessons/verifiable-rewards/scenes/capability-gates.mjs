// Scene 30: The same candidate can improve reasoning and fail release (Multi-metric release gates)
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

export default function capabilityGates(s, c) {
  const phase = s.value(0);
  const sReas = s.value(0);
  const sInst = s.value(0);
  const sRef = s.value(0);
  const sBlk = s.value(0);
  const sPts = s.value(0);
  const sRep = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3d1c4c14');
  const title = heroTitle(['Improve Reasoning,', 'Still Fail Release'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'MULTI-METRIC RELEASE GATES · REGRESSION BUDGETS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sr = Math.max(0.65, sReas.value);
    const si = Math.max(0.65, sInst.value);
    const sf = Math.max(0.65, sRef.value);
    const sb = sBlk.value;
    const sp = sPts.value;
    const rp = sRep.value;

    const metrics = [
      {
        name: 'Checked Reasoning',
        from: '61%',
        to: '74%',
        delta: '+13 pp',
        rule: 'Target: gain',
        pass: true,
        col: COSMOS.emerald,
        op: sr,
        y: -125,
      },
      {
        name: 'Instruction Following',
        from: '92%',
        to: '81%',
        delta: '-11 pp',
        rule: 'Max drop: -3 pp',
        pass: false,
        col: COSMOS.rose,
        op: si,
        y: 15,
      },
      {
        name: 'Unnecessary Refusal',
        from: '4%',
        to: '13%',
        delta: '+9 pp',
        rule: 'Max rise: +2 pp',
        pass: false,
        col: COSMOS.rose,
        op: sf,
        y: 155,
      },
    ];

    const nodes = [
      txt(
        'CANDIDATE PRODUCT WORKSHEET (BEFORE -> AFTER)',
        -830,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    metrics.forEach((m) => {
      nodes.push(
        glassCell(-235, m.y, 1180, 108, m.col, {
          fill: m.pass ? '#0e2524' : '#28111a',
          glow: m.op > 0.7 ? 8 : 3,
          opacity: m.op,
        }),
        txt(m.name, -795, m.y - 16, 28, COSMOS.ink, 'sans', 'left').opacity(m.op),
        txt(m.rule, -795, m.y + 24, 26, COSMOS.muted, 'mono', 'left').opacity(m.op),
        txt(`${m.from} -> ${m.to}`, -120, m.y + 2, 32, COSMOS.ink, 'mono').opacity(m.op),
        txt(m.delta, 190, m.y + 2, 36, m.col, 'mono')
          .glow(6, m.col)
          .opacity(m.op),
      );
    });

    // Right verdict box
    nodes.push(
      glassCell(630, 15, 430, 385, sb > 0.3 ? COSMOS.rose : COSMOS.gold, {
        fill: sb > 0.3 ? '#291018' : '#171a2d',
        glow: sb > 0.3 ? 10 * pulse : 4,
      }),
      txt('RELEASE DECISION', 630, -125, 26, COSMOS.muted, 'mono'),
      txt(
        sb > 0.3 ? 'BLOCKED' : 'CHECK GATES',
        630,
        -45,
        48,
        sb > 0.3 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ).glow(8, sb > 0.3 ? COSMOS.rose : COSMOS.gold),
      rect(320, 3, { fill: COSMOS.rule, stroke: null }).at(630, 15),
      txt(
        sp > 0.3 ? '+13 pp reasoning does NOT' : 'Apply EVERY required gate',
        630,
        66,
        26,
        COSMOS.ink,
        'sans',
      ),
      txt(
        sp > 0.3 ? 'offset -11 pp instruction!' : 'with confidence intervals',
        630,
        106,
        26,
        COSMOS.rose,
        'sans',
      ),
      txt(
        rp > 0.3 ? 'Mix general data & re-eval' : 'Predeclare cohorts & rules',
        630,
        162,
        26,
        COSMOS.emerald,
        'mono',
      ),
      glowDot(-820, 325, { radius: 6, color: COSMOS.gold }),
      txt(
        'Served assistant still owns instruction, safety, latency & operating contracts after any RLVR gain',
        -790,
        327,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-capability-gates-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-reasoning-capability-gates', () => s.play(sReas.to(1, { duration: 0.45 })));
  c.on('vr-instruction-capability-gates', () => s.play(sInst.to(1, { duration: 0.45 })));
  c.on('vr-refusal-capability-gates', () => s.play(sRef.to(1, { duration: 0.45 })));
  c.on('vr-blocked-capability-gates', () => s.play(sBlk.to(1, { duration: 0.45 })));
  c.on('vr-capability-gates-b1', () => s.play(sPts.to(0.6, { duration: 0.35 })));
  c.on('vr-points-capability-gates', () => s.play(sPts.to(1, { duration: 0.45 })));
  c.on('vr-capability-gates-b2', () => s.play(sRep.to(0.6, { duration: 0.35 })));
  c.on('vr-repair-capability-gates', () =>
    s.play(sRep.to(1, { duration: remainDuration(c, 'vr-repair-capability-gates', 0.45) })),
  );
}
