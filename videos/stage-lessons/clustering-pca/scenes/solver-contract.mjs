// Scene 14 (solver-contract): "How much spread runs along each axis?"
// Squared singular value strips σ₁², σ₂² split into n-1=5 sample-variance pieces -> 100×1536 direct SVD vs squared covariance condition!
import {
  COSMOS,
  DANGER_COLOR,
  DISCARDED_ENERGY,
  QUERY_COLOR,
  RETAINED_ENERGY,
  TOTAL_ENERGY,
  aura,
  crossSwap,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function solverContract(s, c) {
  const vStrips = s.value(1);
  const vMatrix = s.value(0);

  const showEnergy = s.value(0);
  const showSvd = s.value(0);
  const showSquare = s.value(0);
  const showPredict = s.value(0);
  const splitPieces = s.value(0);
  const showPiece = s.value(0);
  const showCov = s.value(0);
  const showShare = s.value(0);
  const showZero = s.value(0);

  const showGram = s.value(0);
  const showRank = s.value(0);
  const showRatio = s.value(0);
  const showSolver = s.value(0);
  const showTie = s.value(0);
  const rotPlane = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#2a1c4f18');
  const title = heroTitle(['SVD vs Covariance', '& Sample Variance'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'PCA SOLVERS & NUMERICAL CONDITIONING',
  });

  const eqVar = glowTex('\\lambda_k = \\frac{\\sigma_k^2}{n - 1} = \\frac{\\sigma_k^2}{5}', {
    x: 470,
    y: -255,
    size: 40,
    color: QUERY_COLOR,
    glow: 7,
  });

  // View 1: Squared singular value strips partitioned into n - 1 = 5 equal pieces
  const viewStrips = guardedDynamic(vStrips, (a) => {
    const sp = splitPieces.value;
    const pc = showPiece.value;
    const w1 = 920;
    const w2 = (DISCARDED_ENERGY / RETAINED_ENERGY) * w1;
    const left = -855;

    const nodes = [
      txt(
        'SQUARED SPREAD ALONG TWO PRINCIPAL AXES (n = 6)',
        left,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt(
        `PC1:  σ₁² = ${RETAINED_ENERGY.toFixed(2)}`,
        left,
        -152,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showEnergy.value * a),
      lumBar(left + w1 / 2, -92, w1, 56, {
        color: COSMOS.emerald,
        fillOpacity: 0.7,
        glow: 9,
        opacity: a,
      }),
      txt(
        `PC2:  σ₂² = ${DISCARDED_ENERGY.toFixed(2)}`,
        left,
        8,
        28,
        COSMOS.violet,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showEnergy.value * a),
      lumBar(left + w2 / 2, 68, w2, 56, {
        color: COSMOS.violet,
        fillOpacity: 0.72,
        glow: 9,
        opacity: a,
      }),
      rule(left, 145, 855, 145, COSMOS.cyan, 2.2).opacity(0.6 * a),
      txt(
        `TOTAL SQUARED SPREAD = ${TOTAL_ENERGY.toFixed(2)}   ·   DEGREES OF FREEDOM = n − 1 = 5`,
        left,
        420,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    // Cut into 5 equal pieces strictly after `split`
    if (sp > 0.02) {
      for (let k = 1; k < 5; k++) {
        const x1 = left + (k / 5) * w1;
        const x2 = left + (k / 5) * w2;
        nodes.push(
          rule(x1, -120, x1, -64, COSMOS.bg, 3.5).opacity(sp * a),
          rule(x2, 40, x2, 96, COSMOS.bg, 3.5).opacity(sp * a),
        );
      }
      if (pc > 0.02) {
        nodes.push(
          txt(
            `1 piece = λ₁ = ${(RETAINED_ENERGY / 5).toFixed(2)}`,
            left + w1 + 24,
            -92,
            28,
            COSMOS.emerald,
            'mono',
            'left',
          ).opacity(pc * a),
          txt(
            `1 piece = λ₂ = ${(DISCARDED_ENERGY / 5).toFixed(2)}`,
            left + w2 + 24,
            68,
            28,
            COSMOS.violet,
            'mono',
            'left',
          ).opacity(pc * a),
        );
      }
    }

    // Prediction prompt -> 5 pieces answer -> explained variance ratio
    const pOp = showPredict.value * Math.max(0, 1 - sp * 2.6) * a;
    if (pOp > 0.02) {
      nodes.push(
        txt(
          '6 centered rows sum to 0 (5 free). Into how many pieces do we cut each strip?',
          left,
          198,
          30,
          QUERY_COLOR,
          'serif',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(pOp),
      );
    }

    const ansOp = Math.max(0, (sp - 0.45) / 0.55) * a;
    if (ansOp > 0.02) {
      nodes.push(
        txt(
          showCov.value > 0.5
            ? '5 pieces (n − 1): matches sample covariance eigenvalues identically!'
            : '5 equal pieces (n − 1 = 5 degrees of freedom)',
          left,
          198,
          30,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(ansOp),
      );
    }

    if (showShare.value > 0.02) {
      nodes.push(
        txt(
          `Explained variance ratio:  ${RETAINED_ENERGY.toFixed(1)} / ${TOTAL_ENERGY.toFixed(1)} = ${((RETAINED_ENERGY / TOTAL_ENERGY) * 100).toFixed(1)}%`,
          left,
          285,
          30,
          QUERY_COLOR,
          'mono',
          'left',
        ).opacity(showShare.value * a),
      );
    }
    if (showZero.value > 0.02) {
      nodes.push(
        txt(
          'If every row is identical: total spread = 0 → ratio is 0/0 (undefined)',
          left,
          350,
          26,
          DANGER_COLOR,
          'mono',
          'left',
        ).opacity(showZero.value * a),
      );
    }

    return nodes;
  });

  // View 2: Wide matrix (100 x 1536) vs giant Covariance (1536 x 1536), rank <= 99, condition kappa^2, tied-plane rotation
  const viewMatrix = guardedDynamic(vMatrix, (a) => {
    const rot = rotPlane.value;
    const nodes = [
      txt(
        'WIDE EMBEDDING MATRIX:  n = 100,  d = 1,536',
        -855,
        -245,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      // Thin 100 x 1536 input rectangle
      lumBar(-540, -145, 580, 54, { color: COSMOS.cyan, fillOpacity: 0.35, glow: 8, opacity: a }),
      txt('X_c  (100 × 1,536)', -540, -145, 28, COSMOS.ink, 'mono').opacity(a),
      rule(-855, 418, 855, 418, COSMOS.cyan, 2.2).opacity(0.6 * a),
      txt(
        'PREFER DIRECT SVD ON CENTERED X_c OVER FORMING COVARIANCE XᵀX',
        -855,
        454,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    nodes.push(
      lumBar(-540, 125, 360, 360, {
        color: DANGER_COLOR,
        fillOpacity: 0.16,
        dash: [10, 7],
        glow: 8,
        opacity: (0.4 + 0.6 * showGram.value) * a,
      }),
      txt('Covariance XᵀX', -540, 95, 30, DANGER_COLOR, 'mono').opacity(
        (0.4 + 0.6 * showGram.value) * a,
      ),
      txt('1,536 × 1,536', -540, 150, 34, DANGER_COLOR, 'mono').opacity(
        (0.4 + 0.6 * showGram.value) * a,
      ),
    );

    const rx = 50;
    nodes.push(
      txt('rank ≤ 99  ⇒  ordinary κ = ∞', rx, -155, 30, DANGER_COLOR, 'mono', 'left')
        .glow(6, DANGER_COLOR)
        .opacity((0.45 + 0.55 * showRank.value) * a),
      txt(
        'Forming XᵀX SQUARES condition number:  κ → κ²',
        rx,
        -72,
        28,
        QUERY_COLOR,
        'mono',
        'left',
      ).opacity((0.45 + 0.55 * showRatio.value) * a),
      txt(
        'Direct SVD avoids forming XᵀX (preserves small σ)',
        rx,
        10,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      )
        .glow(6, COSMOS.emerald)
        .opacity((0.45 + 0.55 * showSolver.value) * a),
      txt(
        'Randomized SVD: tune oversampling & power iterations',
        rx,
        72,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity((0.45 + 0.55 * showSolver.value) * a),
    );

    if (showTie.value > 0.02) {
      const cx = 440;
      const cy = 242;
      const ang = rot * 1.1;
      nodes.push(
        glowRing(cx, cy, 82, COSMOS.cyan, { width: 2.5, glow: 8, opacity: showTie.value * a }),
        rule(
          cx - 78 * Math.cos(ang),
          cy - 78 * Math.sin(ang),
          cx + 78 * Math.cos(ang),
          cy + 78 * Math.sin(ang),
          QUERY_COLOR,
          3.5,
        ).opacity(showTie.value * a),
        rule(
          cx + 78 * Math.sin(ang),
          cy - 78 * Math.cos(ang),
          cx - 78 * Math.sin(ang),
          cy + 78 * Math.cos(ang),
          COSMOS.emerald,
          3.5,
        ).opacity(showTie.value * a),
        txt(
          'Tied eigenvalues: axes rotate freely in plane',
          440,
          362,
          26,
          QUERY_COLOR,
          'mono',
        ).opacity(showTie.value * a),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, viewStrips, viewMatrix);

  tweenCue(s, c, 'energy', showEnergy, 1, { duration: 0.45 });
  tweenCue(s, c, 'svd', showSvd, 1, { duration: 0.4 });
  tweenCue(s, c, 'square', showSquare, 1, { duration: 0.4 });
  tweenCue(s, c, 'predict', showPredict, 1, { duration: 0.45 });
  tweenCue(s, c, 'split', splitPieces, 1, { duration: 0.55, after: true });
  c.show('split', eqVar, { after: true });
  tweenCue(s, c, 'piece', showPiece, 1, { duration: 0.45 });
  tweenCue(s, c, 'cov', showCov, 1, { duration: 0.45 });
  tweenCue(s, c, 'share', showShare, 1, { duration: 0.45 });
  tweenCue(s, c, 'zero', showZero, 1, { duration: 0.45 });

  c.hide('wide', eqVar);
  crossSwap(s, c, 'wide', vStrips, vMatrix, { duration: 0.55 });
  tweenCue(s, c, 'gram', showGram, 1, { duration: 0.45 });
  tweenCue(s, c, 'rank', showRank, 1, { duration: 0.45 });
  tweenCue(s, c, 'ratio', showRatio, 1, { duration: 0.45 });
  tweenCue(s, c, 'solver', showSolver, 1, { duration: 0.45 });
  tweenCue(s, c, 'tie', showTie, 1, { duration: 0.45 });
  tweenCue(s, c, 'rotate', rotPlane, 1, { duration: 0.9 });
}
