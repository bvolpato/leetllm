// Scene 05 (loss): "Price the word that actually appeared"
// Live -ln(p) surprise curve + orbiting 3D cross-entropy surface + log-sum-exp underflow guard.
import {
  COSMOS,
  DANGER_COLOR,
  DOG_TRACE,
  MARK_COLOR,
  PROBS,
  TARGET_COLOR,
  WORD_COLOR,
  aura,
  buildLossLandscape3d,
  buildNegLogCurve2d,
  glowTex,
  guardedDynamic,
  heroTitle,
  lossTrace,
  orbitScene,
  tweenCue,
  txt,
} from '../parts.mjs';

const EXTREME = lossTrace([1000, 0, -1], 1);

export default function loss(s, c) {
  const pMarker = s.value(PROBS[0]);
  const showResult = s.value(0);
  const showGap = s.value(0);
  const showLogTotal = s.value(0);
  const showExtreme = s.value(0);

  const bgAura = aura(420, 20, 520, '#3a1a4e36', '#162f4d18');
  const { view: surf3d } = buildLossLandscape3d(
    () => {
      // Interpolate marker on 3D surface from favorite (z_t=3, z_c=1) to observed (z_t=1, z_c=3)
      const t = Math.max(0, Math.min(1, (PROBS[0] - pMarker.value) / (PROBS[0] - PROBS[1])));
      return [3 - 2 * t, 1 + 2 * t];
    },
    { x: 430, y: 0, unit: 98 },
  );

  const title = heroTitle(['Price the Word', 'That Appeared'], {
    x: -855,
    y: -425,
    size: 56,
    lineHeight: 66,
    accent: MARK_COLOR,
    eyebrow: 'NEGATIVE LOG-LIKELIHOOD & LOG-SUM-EXP',
  });

  const eqCe = glowTex('L = -\\ln(p_{\\text{target}}) = (m - z_c) + \\ln\\!\\sum_j e^{z_j - m}', {
    x: -415,
    y: -215,
    size: 32,
    color: COSMOS.cyan,
    glow: 6,
  });

  const live = guardedDynamic(s.value(1), () => {
    const pVal = pMarker.value;
    const isObs = pVal < 0.4;
    const mCol = isObs ? TARGET_COLOR : WORD_COLOR[0];
    const res = showResult.value;
    const gap = showGap.value;
    const logt = showLogTotal.value;
    const ext = showExtreme.value;

    const curve = buildNegLogCurve2d(-795, -135, 680, 310, pVal, {
      maxLoss: 3.1,
      markerColor: mCol,
    });

    const nodes = [...curve.nodes];

    // Live floating readout near marker (withholds 2.17 nats until `loss-result`)
    const lVal = -Math.log(pVal);
    if (!isObs) {
      nodes.push(
        txt(
          `ran: p = ${PROBS[0].toFixed(3)} → L = ${(-Math.log(PROBS[0])).toFixed(2)} nats`,
          -455,
          -155,
          28,
          WORD_COLOR[0],
          'mono',
        ),
      );
    } else if (res > 0.02) {
      nodes.push(
        txt(
          `slept: p = ${PROBS[1].toFixed(3)} → L = ${DOG_TRACE.loss.toFixed(2)} nats`,
          -455,
          -155,
          30,
          MARK_COLOR,
          'mono',
        )
          .glow(8, MARK_COLOR)
          .opacity(res),
      );
    } else {
      nodes.push(
        txt(
          `climbing curve: p = ${pVal.toFixed(2)} → L = ${lVal.toFixed(2)}`,
          -455,
          -155,
          28,
          TARGET_COLOR,
          'mono',
        ),
      );
    }

    // Log-sum-exp decomposition terms revealed strictly after their clauses
    if (gap > 0.02) {
      nodes.push(
        txt(
          `gap (m - z_slept) = 3 - 1 = ${DOG_TRACE.gap.toFixed(3)}`,
          -855,
          268,
          28,
          MARK_COLOR,
          'mono',
          'left',
        ).opacity(gap),
      );
    }
    if (logt > 0.02) {
      nodes.push(
        txt(
          `+ ln(Σ e^(z-m)) = +${DOG_TRACE.logTotal.toFixed(3)}  →  ${DOG_TRACE.loss.toFixed(3)} nats`,
          -855,
          318,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(logt),
      );
    }
    if (ext > 0.02) {
      nodes.push(
        txt(
          `Extreme [1000, 0, -1]: exp(-1000)=0, log-space = ${EXTREME.loss.toFixed(1)} nats`,
          -855,
          376,
          26,
          DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(6, DANGER_COLOR)
          .opacity(ext),
      );
    }

    nodes.push(
      txt('3D CROSS-ENTROPY LANDSCAPE', 430, -405, 26, COSMOS.cyan, 'mono', 'center').glow(
        5,
        COSMOS.cyan,
      ),
      txt(
        'Steep surprise wall vs flat confident floor',
        430,
        452,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ),
    );

    return nodes;
  });

  s.add(bgAura, surf3d, title, eqCe, live);
  orbitScene(s, c, surf3d, { theta: 0.35, phi: 0.94 });

  c.on('loss-favorite', () => {
    s.play(pMarker.to(PROBS[0], { duration: 0.45 }));
  });
  c.on('loss-observed', () => {
    s.play(pMarker.to(PROBS[1], { duration: 1.0 }));
  });
  tweenCue(s, c, 'loss-result', showResult, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'loss-gap', showGap, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'loss-log-total', showLogTotal, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'loss-extreme', showExtreme, 1, { duration: 0.5 });
}
