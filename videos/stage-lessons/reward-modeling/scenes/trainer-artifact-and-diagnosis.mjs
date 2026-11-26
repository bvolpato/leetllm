// Scene 24: Reload the actual scorer before a policy trial: artifact constellation, missing-head flip, divergence diagnosis.
import {
  COSMOS,
  aura,
  circle,
  glowDot,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function trainerArtifactAndDiagnosis(s, c) {
  const phase = s.value(0);
  const showTrainer = s.value(0.45);
  const headMissing = s.value(0);
  const showReplay = s.value(0);
  const showDiag = s.value(0);

  const bgAura = aura(150, 15, 580, '#a78bfa20', '#ff6b8b16');
  const title = heroTitle(['Save the Head,', 'Verify Reload'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'TRL REWARDTRAINER · ARTIFACT INTEGRITY · DIAGNOSIS',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const st = showTrainer.value;
    const hm = headMissing.value;
    const sr = showReplay.value;
    const sd = showDiag.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.4);

    // Left-center orbital constellation: glowing orbs on radius 155 with floating labels outside!
    const cx = -440;
    const cy = 65;
    const r = 152;
    const parts = [
      { label: 'Base Rev', ang: -90, col: COSMOS.cyan, lx: cx, ly: cy - 208, anchor: 'center' },
      {
        label: 'Adapters',
        ang: -18,
        col: COSMOS.violet,
        lx: cx + 186,
        ly: cy - 52,
        anchor: 'left',
      },
      {
        label: 'Score Head',
        ang: 54,
        col: hm > 0.5 ? COSMOS.rose : COSMOS.gold,
        isHead: true,
        lx: cx + 118,
        ly: cy + 162,
        anchor: 'left',
      },
      {
        label: 'Tokenizer',
        ang: 126,
        col: COSMOS.blue,
        lx: cx - 118,
        ly: cy + 162,
        anchor: 'right',
      },
      {
        label: 'Template',
        ang: 198,
        col: COSMOS.emerald,
        lx: cx - 186,
        ly: cy - 52,
        anchor: 'right',
      },
    ];

    const nodes = [
      txt('REQUIRED SCORER ARTIFACT', cx, -215, 26, COSMOS.violet, 'mono').opacity(
        Math.max(0.5, st),
      ),
      circle(82, { fill: '#15142d', stroke: hm > 0.5 ? COSMOS.rose : COSMOS.gold, width: 3.4 })
        .at(cx, cy)
        .glow(10 * pulse, hm > 0.5 ? COSMOS.rose : COSMOS.gold),
      txt('1-SCALAR', cx, cy - 16, 26, COSMOS.gold, 'mono'),
      txt('SCORER', cx, cy + 20, 26, COSMOS.ink, 'mono'),
    ];

    for (const pt of parts) {
      const rad = (pt.ang * Math.PI) / 180;
      const px = cx + Math.cos(rad) * r;
      const py = cy + Math.sin(rad) * r;
      const missing = pt.isHead && hm > 0.5;
      nodes.push(
        line(
          [cx + Math.cos(rad) * 86, cy + Math.sin(rad) * 86],
          [px - Math.cos(rad) * 20, py - Math.sin(rad) * 20],
          {
            stroke: pt.col,
            width: missing ? 2 : 3,
            dash: missing ? [7, 5] : undefined,
          },
        ).opacity(missing ? 0.55 : 0.85),
        circle(18, {
          fill: missing ? '#28101e' : '#10182b',
          stroke: pt.col,
          width: missing ? 3.5 : 2.8,
          dash: missing ? [6, 4] : undefined,
        })
          .at(px, py)
          .glow(missing ? 12 : 8, pt.col),
        txt(pt.label, pt.lx, pt.ly, 26, pt.col, 'mono', pt.anchor),
      );
    }

    // Right-top: Held-out Replay Check (compactly aligned inside safeRight = 860)
    const rx0 = 115;
    const rx1 = 825;
    nodes.push(
      txt('HELD-OUT RELOAD VERIFICATION', rx0, -215, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Live trained:', rx0, -138, 28, COSMOS.emerald, 'mono', 'left'),
      txt('A = 1.80, B = 0.70 (A ≻ B)', rx0 + 235, -138, 26, COSMOS.emerald, 'mono', 'left'),

      txt('Missing head:', rx0, -72, 28, hm > 0.5 ? COSMOS.rose : COSMOS.muted, 'mono', 'left'),
      txt(
        hm > 0.5 ? 'random head → scores FLIP!' : 'must reproduce raw scores',
        rx0 + 235,
        -72,
        26,
        hm > 0.5 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ).glow(hm > 0.5 ? 7 : 0, COSMOS.rose),

      txt(
        sr > 0.4
          ? 'CHECK: match held-out scores before any online trial'
          : 'Split pairs by prompt before passing to RewardTrainer',
        rx0,
        2,
        26,
        sr > 0.4 ? COSMOS.gold : COSMOS.muted,
        'sans',
        'left',
      ),

      // Right-bottom: Diagnostic Signal Monitor (labels clear of curves)
      line([rx0, 72], [rx1, 72], { stroke: '#253355', width: 2 }),
      txt('DIAGNOSTIC MONITOR', rx0, 118, 26, COSMOS.amber, 'mono', 'left').opacity(
        Math.max(0.45, sd),
      ),
    );

    const dx0 = rx0;
    const dx1 = rx1;
    const dy0 = 335;
    const dy1 = 185;
    const proxyPts = Array.from({ length: 28 }, (_, i) => {
      const u = i / 27;
      return [dx0 + u * (dx1 - dx0), dy0 - (0.2 + 0.75 * u) * (dy0 - dy1)];
    });
    const qualPts = Array.from({ length: 28 }, (_, i) => {
      const u = i / 27;
      const q = 0.25 + 1.15 * u * Math.exp(-1.9 * Math.max(0, u - 0.2));
      return [dx0 + u * (dx1 - dx0), dy0 - Math.max(0.1, q) * (dy0 - dy1)];
    });

    nodes.push(
      line([dx0, dy0], [dx1, dy0], { stroke: '#455885', width: 2.2 }),
      line([dx0, dy0], [dx0, dy1], { stroke: '#455885', width: 2.2 }),
      glowingTrail(proxyPts, { color: COSMOS.amber, width: 4.2, opacity: Math.max(0.45, sd) }),
      glowingTrail(qualPts, { color: COSMOS.rose, width: 4.2, opacity: Math.max(0.45, sd) }),
      txt('Proxy ↑', dx1, dy1 - 30, 26, COSMOS.amber, 'mono', 'right'),
      txt('Quality ↓ → STOP', dx1, dy0 + 36, 26, COSMOS.rose, 'mono', 'right').glow(
        sd > 0.4 ? 7 : 0,
        COSMOS.rose,
      ),
      txt(
        'Inspect prompt overlap, label noise, midpoint vs margin, and failing outputs',
        0,
        420,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    // Orbiting check photon around scorer core
    const ang = p * 0.9;
    nodes.push(
      glowDot(cx + Math.cos(ang) * 95, cy + Math.sin(ang) * 95, { radius: 5, color: COSMOS.cyan }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('trainer-artifact-and-diagnosis-step-1', () =>
    s.play(showTrainer.to(1, { duration: 0.45 })),
  );
  c.on('artifact-missing', () => s.play(headMissing.to(1, { duration: 0.45 })));
  c.on('trainer-artifact-and-diagnosis-step-2', () =>
    s.play(headMissing.to(1, { duration: 0.35 })),
  );
  c.on('artifact-replay', () => s.play(showReplay.to(1, { duration: 0.45 })));
  c.on('trainer-artifact-and-diagnosis-step-3', () =>
    s.play(
      showDiag.to(1, { duration: remainDuration(c, 'trainer-artifact-and-diagnosis-step-3', 0.5) }),
    ),
  );
}
