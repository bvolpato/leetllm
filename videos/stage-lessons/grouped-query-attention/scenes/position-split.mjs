// Scene 15: position-split - Why RoPE breaks naive MLA absorption (quarter-turn key rotation).
import {
  COSMOS,
  MLA,
  ROLE,
  buildVectorPlane,
  cinemaAtmosphere,
  dotProd,
  glowDot,
  glowTex,
  glowVector,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function positionSplit(s, c) {
  const baseKey = MLA.W.map((row) => dotProd(row, MLA.c0)); // [5, 2]
  const rotKey = [-baseKey[1], baseKey[0]]; // [-2, 5]
  const q0Abs = MLA.WT.map((row) => dotProd(row, MLA.q)); // [1, 2]
  const q1Abs = MLA.WT.map((row) => dotProd(row, [MLA.q[1], -MLA.q[0]])); // [0, -1]

  const phase = s.value(0);
  const angle = s.value(0); // 0 -> pi/2 on 'turn'
  const showAxisNote = s.value(0);
  const showId = s.value(0);
  const showFirstQ = s.value(0);
  const showTurnHead = s.value(0);
  const showAsk = s.value(0);
  const showRotKey = s.value(0);
  const showNeg = s.value(0);
  const showNextQ = s.value(0);
  const footStage = s.value(0); // 0=none, 1=axis, 2=back, 3=split, 4=scale, 5=coords

  const title = heroTitle(['Can the same query', 'survive a rotation?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.pos,
    eyebrow: 'MLA · WHY ROPE MUST BE DECOUPLED',
  });

  const ropeEq = glowTex(
    String.raw`q'_s = W^{\top} R_s^{\top} q \;\neq\; \text{constant across } s`,
    { x: 425, y: -395, size: 34, color: ROLE.pos, glow: 7 },
  );

  // Clean centered-left 2D vector plane spanning x in [-2.6, 5.6], y in [-0.6, 5.6]
  const plane = buildVectorPlane({
    originX: -545,
    originY: 265,
    scale: 88,
    xMin: -2.6,
    xMax: 5.5,
    yMin: -0.6,
    yMax: 5.5,
    step: 1,
    xLabel: 'x₁',
    yLabel: 'x₂',
    showTicks: true,
  });

  const live = guardedDynamic(1, () => {
    const a = angle.value;
    const axn = showAxisNote.value;
    const sid = showId.value;
    const fq = showFirstQ.value;
    const th = showTurnHead.value;
    const ask = showAsk.value;
    const rk = showRotKey.value;
    const ng = showNeg.value;
    const nq = showNextQ.value;
    const fs = Math.round(footStage.value);

    // Current rotated key vector
    const kx = baseKey[0] * Math.cos(a) - baseKey[1] * Math.sin(a);
    const ky = baseKey[0] * Math.sin(a) + baseKey[1] * Math.cos(a);
    const kTip = plane.toScreen(kx, ky);
    const projPt = plane.toScreen(kx, 0);

    const nodes = [
      rule(25, -310, 25, 375, COSMOS.rule, 1.6).opacity(0.6),
      // Fixed query q = (1, 0)
      glowVector(plane.origin, plane.toScreen(...MLA.q), {
        color: ROLE.query,
        width: 7,
        tipSize: 16,
        glow: 10,
      }),
      txt('q = (1, 0)', plane.toScreen(1.0, 0)[0], 390, 26, ROLE.query, 'mono', 'center'),
      // Rotating key vector k(theta)
      glowVector(plane.origin, kTip, {
        color: ROLE.key,
        width: 5.5,
        tipSize: 15,
        glow: 9,
      }),
      // Dashed vertical projection to the fixed query axis + gold dot
      line(kTip, projPt, { stroke: ROLE.pos, width: 3.4, dash: [7, 5] }),
      glowDot(projPt[0], projPt[1], { radius: 9.5, color: ROLE.gold, glow: 13 }),
    ];

    // Subtle rotation arc trail once turning begins
    if (a > 0.05) {
      nodes.push(
        glowingArc(plane.toScreen(baseKey[0], baseKey[1]), kTip, -60, {
          color: ROLE.pos,
          width: 2.4,
          glow: 6,
          core: false,
          opacity: 0.75,
        }),
      );
    }

    // --- RIGHT: Dual Position Ledger (strict withholding on Position 1!) ---
    const rx = 85;
    nodes.push(
      txt('POSITION 0 · 0° IDENTITY ROTATION', rx, -260, 26, ROLE.key, 'mono', 'left'),
      txt('Latent c = (1, 2)', rx, -214, 28, COSMOS.muted, 'mono', 'left'),
    );
    if (sid > 0.02) {
      nodes.push(
        txt(
          `Key k₀ = (${baseKey[0]}, ${baseKey[1]})   →   score = 5`,
          rx,
          -160,
          30,
          ROLE.key,
          'mono',
          'left',
        ).opacity(sid),
      );
    }
    if (fq > 0.02) {
      nodes.push(
        txt(
          `Absorbed q′₀ = (${q0Abs[0]}, ${q0Abs[1]})   ·   q′₀ · c = 5`,
          rx,
          -108,
          30,
          ROLE.query,
          'mono',
          'left',
        )
          .glow(6, ROLE.query)
          .opacity(fq),
      );
    }

    // Position 1 section
    if (th > 0.02) {
      nodes.push(
        rule(rx, -48, 845, -48, COSMOS.rule, 1.5).opacity(0.65 * th),
        txt(
          'POSITION 1 · 90° COUNTERCLOCKWISE ROTATION',
          rx,
          -8,
          26,
          ROLE.pos,
          'mono',
          'left',
        ).opacity(th),
        txt('Same latent c = (1, 2)', rx, 38, 28, COSMOS.muted, 'mono', 'left').opacity(th),
      );
    }
    if (ask > 0.02 && rk < 0.02) {
      nodes.push(
        txt('Can we reuse q′₀ = (1, 2)?', rx, 118, 36, ROLE.gold, 'serif', 'left')
          .glow(8, ROLE.gold)
          .opacity(ask),
      );
    }
    if (rk > 0.05) {
      nodes.push(
        txt(
          `Rotated key k₁ = (${rotKey[0]}, ${rotKey[1]})`,
          rx,
          98,
          32,
          ROLE.key,
          'mono',
          'left',
        ).opacity(rk),
      );
    }
    if (ng > 0.02) {
      nodes.push(
        txt('Fixed query reads score = −2   (not 5!)', rx, 154, 32, ROLE.alert, 'mono', 'left')
          .glow(7, ROLE.alert)
          .opacity(ng),
      );
    }
    if (nq > 0.02) {
      nodes.push(
        txt(
          `New absorbed q′₁ = (${q1Abs[0]}, ${q1Abs[1]})   ·   q′₁ · c = −2`,
          rx,
          212,
          30,
          ROLE.gold,
          'mono',
          'left',
        )
          .glow(7, ROLE.gold)
          .opacity(nq),
      );
    }

    // Decoupled DeepSeek MLA recap strip when fs >= 3
    if (fs >= 3) {
      nodes.push(
        txt(
          fs === 3
            ? 'Fix: split content + RoPE dot products'
            : fs === 4
              ? 'softmax((content + position) / √192)'
              : 'Cache: 512 content + 64 RoPE floats',
          rx,
          306,
          26,
          ROLE.value,
          'mono',
          'left',
        ).glow(6, ROLE.value),
      );
    }

    // Floating footer caption
    const footMap = [
      '',
      'Gold dot = horizontal coordinate of key = dot product with q = (1, 0)',
      'Each past position s would force a different absorbed query Wᵀ Rₛᵀ q',
      'Decoupling RoPE lets the content query q′ travel unchanged down history',
      'Add content + positional scores, scale by 1/√192, then take softmax',
      'DeepSeek MLA caches 512 content floats + 64 RoPE floats per token',
    ];
    if (fs > 0) {
      nodes.push(
        txt(footMap[fs], 0, 438, 28, fs === 2 ? ROLE.alert : COSMOS.muted, 'sans', 'center'),
      );
    } else if (axn > 0.5) {
      nodes.push(txt(footMap[1], 0, 438, 28, ROLE.gold, 'sans', 'center'));
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.pos, ROLE.gold), title, plane.node, live);
  c.show('back', ropeEq, { fade: 0.4 });
  runPhase(s, c, phase, 14);

  playCue(
    s,
    c,
    'axis',
    (d) => s.play(showAxisNote.to(1, { duration: d }), footStage.to(1, { duration: 0.2 })),
    { dur: 0.4 },
  );
  playCue(s, c, 'identity', (d) => s.play(showId.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'first-q', (d) => s.play(showFirstQ.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(
    s,
    c,
    'turn',
    (d) => s.play(showTurnHead.to(1, { duration: 0.25 }), angle.to(Math.PI / 2, { duration: d })),
    { dur: 1.4 },
  );
  playCue(s, c, 'ask', (d) => s.play(showAsk.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'key', (d) => s.play(showRotKey.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'negative', (d) => s.play(showNeg.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'next-q', (d) => s.play(showNextQ.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'back', (d) => s.play(footStage.to(2, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'split', (d) => s.play(footStage.to(3, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'scale', (d) => s.play(footStage.to(4, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'coords', (d) => s.play(footStage.to(5, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
}
