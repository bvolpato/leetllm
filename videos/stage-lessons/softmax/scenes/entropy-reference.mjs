// Scene 11 (entropy-reference): "What loss remains at a perfect match?"
// Soft target P=[0.5, 0.5, 0] vs moving prediction Q -> H(P,Q) = H(P) + D_KL(P||Q) -> support & unnormalized weights.
import {
  COSMOS,
  DANGER_COLOR,
  MARK_COLOR,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
  crossEntropy,
  crossSwap,
  entropy,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const P_SPLIT = [0.5, 0.5, 0];
const H_SPLIT = entropy(P_SPLIT); // ln(2) = 0.6931

export default function entropyReference(s, c) {
  const phase = s.value(0);
  const vMain = s.value(1);
  const vEdge = s.value(0);

  // Main view state
  const targetP0 = s.value(0);
  const targetP1 = s.value(1);
  const predQ0 = s.value(0.844);
  const predQ1 = s.value(0.114);
  const predQ2 = s.value(0.042);
  const showH = s.value(0);
  const showCe = s.value(0);
  const showKl = s.value(0);
  const showHalfCost = s.value(0);
  const showMatchZero = s.value(0);

  // Edge cases view state
  const zeroSupport = s.value(0);
  const malformed = s.value(0);
  const showTotal16 = s.value(0);
  const showScaledGrad = s.value(0);
  const normalized = s.value(0);
  const showHalves = s.value(0);
  const showUnitGrad = s.value(0);

  const bgAura = aura(0, 20, 620, '#14384432', '#261a4a18');
  const title = heroTitle(['What Loss Remains', 'at a Perfect Match?'], {
    x: -855,
    y: -425,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'ENTROPY, CROSS-ENTROPY & KL DIVERGENCE',
  });

  const eqIdentity = glowTex('H(P, Q) = H(P) + D_{\\text{KL}}(P \\parallel Q)', {
    x: 410,
    y: -265,
    size: 36,
    color: MARK_COLOR,
    glow: 7,
  });

  // View 1: Paired solid prediction Q vs dashed target P + live H / CE / KL bars
  const viewMain = guardedDynamic(vMain, (a) => {
    const pVec = [targetP0.value, targetP1.value, 0];
    const qVec = [predQ0.value, predQ1.value, predQ2.value];
    const hVal = entropy(pVec);
    const ceVal = crossEntropy(pVec, qVec);
    const klVal = Math.max(0, ceVal - hVal);

    const baseY = 235;
    const maxH = 340;
    const xs = [-690, -455, -220];

    const nodes = [
      rule(-815, baseY, -95, baseY, COSMOS.muted, 2.5).opacity(a * 0.8),
      txt('Solid = Model Q   ·   Dashed = Target P', -455, -188, 26, COSMOS.muted, 'mono').opacity(
        a,
      ),
    ];

    WORDS.forEach((w, i) => {
      const qh = Math.max(4, qVec[i] * maxH);
      const ph = Math.max(0, pVec[i] * maxH);
      nodes.push(
        lumBar(xs[i], baseY - qh / 2, 118, qh, {
          color: WORD_COLOR[i],
          fillOpacity: 0.72,
          strokeWidth: 2,
          glow: 8,
          opacity: a,
        }),
        txt(w, xs[i], baseY + 42, 30, WORD_COLOR[i], 'sans').opacity(a),
        txt(`${(qVec[i] * 100).toFixed(0)}%`, xs[i], baseY + 84, 26, COSMOS.muted, 'mono').opacity(
          a,
        ),
      );
      if (ph > 4) {
        nodes.push(
          lumBar(xs[i], baseY - ph / 2, 134, ph, {
            color: COSMOS.ink,
            fillOpacity: 0.02,
            strokeWidth: 3.2,
            dash: [10, 7],
            glow: 5,
            opacity: a,
          }),
        );
      }
    });

    // Right side: live decomposition bars H(P), D_KL(P||Q), and total H(P,Q)
    // Persistent baseline rails keep right half balanced from frame 0
    const rx = 70;
    const barScale = 420;
    nodes.push(
      txt('LOGARITHMIC LOSS DECOMPOSITION', rx, -192, 26, COSMOS.muted, 'mono', 'left').opacity(
        0.75 * a,
      ),
      rule(rx, -52, rx + 680, -52, COSMOS.rule, 2.5).opacity(0.65 * a),
      rule(rx, 105, rx + 680, 105, COSMOS.rule, 2.5).opacity(0.65 * a),
      rule(rx, 261, rx + 680, 261, COSMOS.rule, 2.5).opacity(0.65 * a),
    );
    if (showH.value > 0.02) {
      const hw = Math.max(4, hVal * barScale);
      nodes.push(
        txt('H(P)  target entropy floor', rx, -135, 26, COSMOS.cyan, 'mono', 'left').opacity(
          showH.value * a,
        ),
        lumBar(rx + hw / 2, -82, hw, 42, {
          color: COSMOS.cyan,
          fillOpacity: 0.72,
          glow: 8,
          opacity: showH.value * a,
        }),
      );
      if (showHalfCost.value > 0.02 || klVal > 0.02) {
        nodes.push(
          txt(
            `${hVal.toFixed(3)} nats`,
            rx + hw + 18,
            -82,
            28,
            COSMOS.cyan,
            'mono',
            'left',
          ).opacity(showH.value * a),
        );
      }
    }
    if (showKl.value > 0.02) {
      const kw = Math.max(4, klVal * barScale);
      nodes.push(
        txt('D_KL(P || Q)  model mismatch', rx, 22, 26, MARK_COLOR, 'mono', 'left').opacity(
          showKl.value * a,
        ),
        lumBar(rx + kw / 2, 75, kw, 42, {
          color: klVal < 0.005 ? TARGET_COLOR : MARK_COLOR,
          fillOpacity: 0.75,
          glow: 8,
          opacity: showKl.value * a,
        }),
      );
      if (showMatchZero.value > 0.02 || klVal > 0.02) {
        nodes.push(
          txt(
            klVal < 0.005 ? '0.000 nats (match!)' : `+${klVal.toFixed(3)} nats`,
            rx + kw + 18,
            75,
            28,
            klVal < 0.005 ? TARGET_COLOR : MARK_COLOR,
            'mono',
            'left',
          ).opacity(showKl.value * a),
        );
      }
    }
    if (showCe.value > 0.02) {
      const cw = Math.max(4, Math.min(1.55, ceVal) * barScale);
      nodes.push(
        txt('H(P, Q)  total cross-entropy', rx, 178, 26, TARGET_COLOR, 'mono', 'left').opacity(
          showCe.value * a,
        ),
        lumBar(rx + cw / 2, 231, cw, 42, {
          color: TARGET_COLOR,
          fillOpacity: 0.78,
          glow: 9,
          opacity: showCe.value * a,
        }),
      );
      if (showHalfCost.value > 0.02) {
        nodes.push(
          txt(`${ceVal.toFixed(3)} nats`, rx + cw + 18, 231, 30, TARGET_COLOR, 'mono', 'left')
            .glow(6, TARGET_COLOR)
            .opacity(showHalfCost.value * a),
        );
      }
    }

    // Prediction prompt while waiting for answer
    if (
      showHalfCost.value < 0.05 &&
      Math.abs(qVec[0] - 0.5) < 0.02 &&
      Math.abs(pVec[0] - 0.5) < 0.02
    ) {
      nodes.push(
        txt(
          'Q matches P = [0.5, 0.5, 0]. How much loss remains?',
          rx,
          345,
          30,
          MARK_COLOR,
          'serif',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(a),
      );
    } else if (showMatchZero.value > 0.02 && klVal < 0.005) {
      nodes.push(
        txt(
          `Floor = −ln(0.5) = ${H_SPLIT.toFixed(3)} nats, KL = 0`,
          rx,
          345,
          30,
          TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(7, TARGET_COLOR)
          .opacity(showMatchZero.value * a),
      );
    }

    return nodes;
  });

  // View 2: Zero support (0*log 0 vs +inf) + unnormalized weights [0.8, 0.8, 0] -> normalize -> [0.5, 0.5, 0]
  const viewEdge = guardedDynamic(vEdge, (a) => {
    const zs = zeroSupport.value;
    const mf = malformed.value;
    const nrm = normalized.value;
    const wVal = 0.8 - 0.3 * nrm;
    const sumVal = 1.6 - 0.6 * nrm;

    const preMf = Math.max(0, 1 - mf * 2.6) * a;
    const nodes = [
      txt('ZERO-WEIGHT CONVENTION', -855, -225, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt(
        'ate:  P(ate) = 0   ⇒   0 · log Q(ate) = 0',
        -855,
        -162,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
      // Persistent support-rule visual contrast until malformed weights appear (zero empty space!)
      ...(preMf > 0.02
        ? [
            lumBar(-545, 185, 580, 130, {
              color: TARGET_COLOR,
              fillOpacity: 0.14,
              glow: 7,
              opacity: preMf,
            }),
            txt('P(ate) = 0  ·  Q(ate) = 0.04', -545, 158, 28, TARGET_COLOR, 'mono').opacity(preMf),
            txt('0 · log Q = 0  (safe)', -545, 212, 28, COSMOS.ink, 'mono').opacity(preMf),
            lumBar(245, 185, 620, 130, {
              color: DANGER_COLOR,
              fillOpacity: 0.14,
              glow: 7,
              opacity: preMf,
            }),
            txt('P(slept) = 0.5  ·  Q(slept) = 0', 245, 158, 28, DANGER_COLOR, 'mono').opacity(
              preMf,
            ),
            txt('−0.5 · log 0 = +∞  (diverges!)', 245, 212, 28, DANGER_COLOR, 'mono').opacity(
              preMf,
            ),
          ]
        : []),
    ];

    if (zs > 0.02) {
      nodes.push(
        txt(
          'slept:  P = 0.5,  Q = 0   ⇒   H(P,Q) = +∞,  KL = +∞',
          -855,
          -92,
          30,
          DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(7, DANGER_COLOR)
          .opacity(zs * a),
      );
    }

    const mfOp = Math.max(0, (mf - 0.45) / 0.55) * a;
    if (mfOp > 0.02) {
      const barY = 95;
      const bw = 225 + 95 * ((wVal - 0.5) / 0.3);
      nodes.push(
        rule(-855, -18, 855, -18, COSMOS.rule, 2).opacity(mfOp),
        rule(-855, 385, 855, 385, COSMOS.cyan, 2.2).opacity(0.65 * mfOp),
        txt(
          'PYTORCH SOFT-TARGET NORMALIZATION CHECK',
          855,
          418,
          26,
          COSMOS.muted,
          'mono',
          'right',
        ).opacity(mfOp),
        txt(
          nrm > 0.5 ? 'NORMALIZED SOFT TARGET (SUM = 1.0)' : 'UNNORMALIZED SUBMITTED WEIGHTS',
          -855,
          36,
          26,
          nrm > 0.5 ? TARGET_COLOR : DANGER_COLOR,
          'mono',
          'left',
        ).opacity(mfOp),
        lumBar(-855 + bw / 2, barY + 25, bw, 56, {
          color: WORD_COLOR[0],
          fillOpacity: 0.78,
          glow: 8,
          opacity: mfOp,
        }),
        txt(`ran: ${wVal.toFixed(1)}`, -855 + bw / 2, barY + 25, 28, COSMOS.bg, 'mono').opacity(
          mfOp,
        ),
        lumBar(-855 + bw + 18 + bw / 2, barY + 25, bw, 56, {
          color: WORD_COLOR[1],
          fillOpacity: 0.78,
          glow: 8,
          opacity: mfOp,
        }),
        txt(
          `slept: ${wVal.toFixed(1)}`,
          -855 + bw + 18 + bw / 2,
          barY + 25,
          28,
          COSMOS.bg,
          'mono',
        ).opacity(mfOp),
      );
    }

    if (showTotal16.value > 0.02 && mfOp > 0.02) {
      nodes.push(
        txt(
          `Sum a = ${sumVal.toFixed(1)}`,
          -140,
          120,
          34,
          nrm > 0.5 ? TARGET_COLOR : DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(7, nrm > 0.5 ? TARGET_COLOR : DANGER_COLOR)
          .opacity(showTotal16.value * mfOp),
      );
    }
    if (showScaledGrad.value > 0.02 && showHalves.value < 0.05) {
      nodes.push(
        txt(
          'Unnormalized gradient:  ∇_z L = a · p − y   (a = 1.6 ≠ 1!)',
          -855,
          225,
          32,
          DANGER_COLOR,
          'mono',
          'left',
        ).opacity(showScaledGrad.value * a),
      );
    }
    if (showHalves.value > 0.02) {
      nodes.push(
        txt(
          'Divide by 1.6  →  [0.5, 0.5, 0]  (sum = 1.0)',
          -855,
          245,
          32,
          TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(6, TARGET_COLOR)
          .opacity(showHalves.value * a),
      );
    }
    if (showUnitGrad.value > 0.02) {
      nodes.push(
        txt('Restored unit gradient:  ∇_z L = p − y', -855, 322, 36, MARK_COLOR, 'mono', 'left')
          .glow(8, MARK_COLOR)
          .opacity(showUnitGrad.value * a),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, viewMain, viewEdge);
  runAmbientPhase(s, c, phase, 2.2);

  // Beat 0 cues
  c.on('entropy-reference-0', () => {
    s.play(targetP1.to(1, { duration: 0.3 }));
  });
  tweenCue(s, c, 'entropy-reader-one', targetP0, 0.5, { duration: 0.45 });
  tweenCue(s, c, 'entropy-reader-two', targetP1, 0.5, { duration: 0.45 });
  c.on('entropy-soft-target', () => {
    s.play(targetP0.to(0.5, { duration: 0.35 }));
    s.play(targetP1.to(0.5, { duration: 0.35 }));
  });
  tweenCue(s, c, 'entropy-h', showH, 1, { duration: 0.45 });
  tweenCue(s, c, 'entropy-ce', showCe, 1, { duration: 0.45 });
  tweenCue(s, c, 'entropy-identities', showKl, 1, { duration: 0.45 });
  c.show('entropy-identities', eqIdentity);

  // Beat 1-2: Match prediction Q = [0.5, 0.5, 0], withhold 0.693 & KL=0 until spoken
  c.on('entropy-reference-1', () => {
    s.play(predQ0.to(0.5, { duration: 0.65 }));
    s.play(predQ1.to(0.5, { duration: 0.65 }));
    s.play(predQ2.to(0, { duration: 0.65 }));
  });
  tweenCue(s, c, 'entropy-half-cost', showHalfCost, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'entropy-match', showMatchZero, 1, { duration: 0.45, after: true });

  // Beat 3: Move Q to [0.8, 0.2, 0] and back to [0.5, 0.5, 0]
  c.on('entropy-stays', () => {
    s.play(predQ0.to(0.8, { duration: 0.65 }));
    s.play(predQ1.to(0.2, { duration: 0.65 }));
  });
  c.on('entropy-return', () => {
    s.play(predQ0.to(0.5, { duration: 0.65 }));
    s.play(predQ1.to(0.5, { duration: 0.65 }));
  });

  // Beat 4: Edge cases
  c.hide('entropy-reference-2', eqIdentity);
  crossSwap(s, c, 'entropy-reference-2', vMain, vEdge, { duration: 0.55 });
  tweenCue(s, c, 'entropy-zero-support', zeroSupport, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'entropy-malformed', malformed, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'entropy-check', showTotal16, 1, { duration: 0.4 });
  tweenCue(s, c, 'entropy-scaled-gradient', showScaledGrad, 1, { duration: 0.45 });
  tweenCue(s, c, 'entropy-normalize', normalized, 1, { duration: 0.7 });
  tweenCue(s, c, 'entropy-halves', showHalves, 1, { duration: 0.4 });
  tweenCue(s, c, 'entropy-unit-gradient', showUnitGrad, 1, { duration: 0.45 });
}
