// Scene 12: learn: "Follow the output point"
// Live output-point pull dynamics: ∂o/∂z_j = α_j (v_j - o).
// 1) Raise Birds logit by +1 -> gold dot glides toward blue ring v_Birds.
// 2) Coincide both rings at [3, -1] -> raise logit again -> shares jump 42%->66%, prediction withheld -> dot stays put (grad=0).
// 3) Distinct values + mask Birds (-inf) -> sing stays at 100% -> grad=0.
// 4) Unblock + push sing logit up -> Birds drops to ~1% -> tiny routing gradient.
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  SCALED,
  V,
  cinemaAtmosphere,
  fmt,
  glowRing,
  glowVector,
  pct,
  playCue,
  shareRibbon,
  softmax,
  vecStr,
  vectorPlane,
} from '../parts.mjs';

export default function learn(s, c) {
  const title = heroTitle(['Follow the', 'output point'], {
    x: -850,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.query,
  });

  // Wide coordinate plane spanning [-0.5, 3.6] × [-1.6, 2.5] so both [2,1]/[1,2] and [3,-1] fit generously!
  const plane = vectorPlane({
    originX: 110,
    originY: 140,
    scale: 185,
    xMin: -0.3,
    xMax: 3.6,
    yMin: -1.6,
    yMax: 2.5,
    step: 1.0,
    xLabel: 'v₁',
    yLabel: 'v₂',
  });

  // Live physical simulation state
  const zB = s.value(SCALED[1][0]); // 0.424 -> 1.424 -> 0.424 -> -30 (masked) -> 0.424
  const zS = s.value(SCALED[1][1]); // 0.742 -> 1.742 -> 4.95
  const vBx = s.value(V[0][0]); // 2 -> 3 -> 2
  const vBy = s.value(V[0][1]); // 1 -> -1 -> 1
  const vSx = s.value(V[1][0]); // 1 -> 3 -> 1
  const vSy = s.value(V[1][1]); // 2 -> -1 -> 2
  const maskedBirds = s.value(0); // 1 when Birds is blocked (-inf)
  const hideGoldForPredict = s.value(0); // 1 during prediction pause before fixed-output!
  const showPullFormula = s.value(0);
  const showZeroGrad = s.value(0);

  const stageVis = s.value(1);

  const simLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const mb = maskedBirds.value > 0.5;
    const shares = mb ? [0, 1] : softmax([zB.value, zS.value]);
    const vb = [vBx.value, vBy.value];
    const vs = [vSx.value, vSy.value];
    const out = [shares[0] * vb[0] + shares[1] * vs[0], shares[0] * vb[1] + shares[1] * vs[1]];
    const pullB = [shares[0] * (vb[0] - out[0]), shares[0] * (vb[1] - out[1])];

    const pB = plane.toScreen(vb[0], vb[1]);
    const pS = plane.toScreen(vs[0], vs[1]);
    const pO = plane.toScreen(out[0], out[1]);
    const dist = Math.hypot(pB[0] - pS[0], pB[1] - pS[1]);

    // Connecting segment when endpoints are distinct
    if (dist > 6) {
      nodes.push(
        glowingTrail([pB, pS], {
          gradientColors: [ROLE.birds, ROLE.query, ROLE.sing],
          width: 4,
          glow: 8,
          opacity: (mb ? 0.25 : 0.85) * alpha,
        }),
      );
    }

    // Endpoint rings (Birds blue, sing cyan)
    nodes.push(
      glowRing(pB[0], pB[1], 16, mb ? ROLE.mask : ROLE.birds, { width: 3.5, glow: 9 }),
      glowRing(pS[0], pS[1], 21, ROLE.sing, { width: 3.5, glow: 9 }),
    );

    const movingEndpoints = Math.abs(vb[0] - 2) > 0.05 && Math.abs(vb[0] - 3) > 0.05;
    if (!movingEndpoints) {
      if (dist > 30) {
        nodes.push(
          txt(
            mb ? 'v_Birds (masked)' : `v_Birds ${vecStr(vb, 0)}`,
            pB[0] + 28,
            pB[1] + 28,
            26,
            mb ? ROLE.mask : ROLE.birds,
            'mono',
            'left',
          ).opacity(alpha),
          txt(
            `v_sing ${vecStr(vs, 0)}`,
            pS[0] + 28,
            pS[1] - 28,
            26,
            ROLE.sing,
            'mono',
            'left',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          txt('v_Birds = v_sing = [3, -1]', 490, -375, 28, ROLE.sing, 'mono', 'center').opacity(
            alpha,
          ),
        );
      }
    }

    // Gold output point (hidden ONLY during prediction pause before fixed-output!)
    const showO = hideGoldForPredict.value < 0.5;
    if (showO) {
      nodes.push(
        glowDot(pO[0], pO[1], { radius: 11, color: ROLE.query, glow: 16, opacity: alpha }),
      );
      // Pull vector arrow when significant
      const pullLen = Math.hypot(pullB[0], pullB[1]);
      if (showPullFormula.value > 0.4 && pullLen > 0.04) {
        const pullTip = plane.toScreen(out[0] + pullB[0] * 1.4, out[1] + pullB[1] * 1.4);
        nodes.push(
          glowVector(pO, pullTip, {
            color: ROLE.amber,
            width: 4,
            tipSize: 14,
            glow: 8,
            opacity: alpha,
          }),
        );
      }
    } else {
      nodes.push(
        txt('Where does o land?', pB[0] - 26, pB[1] + 54, 30, ROLE.query, 'serif', 'right')
          .glow(7, ROLE.query)
          .opacity(alpha),
      );
    }

    // LEFT COLUMN: Live Logits, Conserved Shares, Output & Gradient Readout
    const lx = -530;
    nodes.push(
      txt(
        `logits:  Birds ${mb ? '-∞' : fmt(zB.value, 2)}   |   sing ${fmt(zS.value, 2)}`,
        lx,
        -195,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      shareRibbon({
        x: lx,
        y: -75,
        width: 600,
        height: 54,
        shares,
        colors: [mb ? ROLE.mask : ROLE.birds, ROLE.sing],
        labels: ['Birds', 'sing'],
        opacity: alpha,
      }),
      txt(
        showO ? `output o = ${vecStr(out, 2)}` : 'output o = [?, ?]',
        lx,
        45,
        34,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(7, ROLE.query)
        .opacity(alpha),
    );

    if (showPullFormula.value > 0.05) {
      const zero = Math.hypot(pullB[0], pullB[1]) < 0.015;
      const gCol = !showO ? ROLE.query : zero ? ROLE.mask : ROLE.value;
      nodes.push(
        txt(
          showO ? `∂o/∂z_Birds = ${vecStr(pullB, 2)}` : '∂o/∂z_Birds = [?, ?]',
          lx,
          235,
          30,
          gCol,
          'mono',
          'center',
        )
          .glow(6, gCol)
          .opacity(showPullFormula.value * alpha),
      );
      if (showO && zero && showZeroGrad.value > 0.05) {
        nodes.push(
          txt('routing gradient = 0', lx, 298, 30, ROLE.mask, 'mono', 'center')
            .glow(6, ROLE.mask)
            .opacity(alpha),
        );
      }
    }

    return nodes;
  });

  const pullEq = glowTex('\\frac{\\partial o}{\\partial z_j} = \\alpha_j\\,(v_j - o)', {
    x: -530,
    y: 148,
    size: 42,
    color: ROLE.amber,
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.birds), title, plane.node, simLayer);

  // Beat 0: Raise Birds logit by +1 -> gold point travels toward blue ring
  playCue(s, c, 'raise-first', (d) => s.play(zB.to(SCALED[1][0] + 1, { duration: d })), {
    dur: 0.9,
  });

  // Beat 1: Pull formula ∂o/∂z_j = α_j (v_j - o)
  c.show('pull', pullEq);
  playCue(s, c, 'pull', (d) => s.play(showPullFormula.to(1, { duration: d })), { dur: 0.45 });

  // Beat 2: Restore score -> move both values to [3, -1] -> raise logit by +1 -> WITHHOLD landing!
  playCue(s, c, 'restore', (d) => s.play(zB.to(SCALED[1][0], { duration: d })), { dur: 0.65 });
  playCue(
    s,
    c,
    'meet',
    (d) =>
      s.play(
        vBx.to(3, { duration: d }),
        vBy.to(-1, { duration: d }),
        vSx.to(3, { duration: d }),
        vSy.to(-1, { duration: d }),
      ),
    { dur: 0.85 },
  );
  playCue(
    s,
    c,
    'raise-again',
    (d) =>
      s.play(
        hideGoldForPredict.to(1, { duration: Math.min(0.2, d) }),
        zB.to(SCALED[1][0] + 1, { duration: d }),
      ),
    { dur: 0.75 },
  );
  playCue(s, c, 'predict', (d) => s.play(hideGoldForPredict.to(1, { duration: d })), { dur: 0.25 });

  // Beat 3: Spoken reveal AFTER fixed-output! Lower logit back, show zero routing gradient
  playCue(s, c, 'fixed-output', (d) => s.play(hideGoldForPredict.to(0, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'lower-again', (d) => s.play(zB.to(SCALED[1][0], { duration: d })), { dur: 0.7 });
  playCue(s, c, 'zero-grad', (d) => s.play(showZeroGrad.to(1, { duration: d })), { dur: 0.45 });

  // Beat 4: Distinct values back -> block Birds (-inf) -> raise sing logit by +1 (share stays 100%)
  playCue(
    s,
    c,
    'distinct',
    (d) =>
      s.play(
        vBx.to(V[0][0], { duration: d }),
        vBy.to(V[0][1], { duration: d }),
        vSx.to(V[1][0], { duration: d }),
        vSy.to(V[1][1], { duration: d }),
      ),
    { dur: 0.75 },
  );
  playCue(s, c, 'block', (d) => s.play(maskedBirds.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'single-score', (d) => s.play(zS.to(SCALED[1][1] + 1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 5: Unblock Birds -> push sing logit far up (~1% Birds share -> vanishing routing gradient)
  playCue(
    s,
    c,
    'unblock',
    (d) => s.play(maskedBirds.to(0, { duration: d }), zS.to(SCALED[1][1], { duration: d })),
    { dur: 0.55 },
  );
  playCue(s, c, 'concentrate', (d) => s.play(zS.to(4.85, { duration: d })), { dur: 0.9 });

  void pct;
}
