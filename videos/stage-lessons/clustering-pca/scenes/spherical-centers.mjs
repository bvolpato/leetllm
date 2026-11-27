// Scene 18 (spherical-centers): "Which center gets the query?"
// Mean of (1,0) & (0,1) shrinks inside unit circle (r=0.707) -> C0=[0.1,0] vs C1=[0.8,0.6] Euclidean vs Cosine disagreement -> spherical L2 normalization & opposite-vector fallback.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  QUERY_COLOR,
  aura,
  crossSwap,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function sphericalCenters(s, c) {
  const vMean = s.value(1);
  const vConflict = s.value(0);
  const vSpherical = s.value(0);

  const showMean = s.value(0);
  const showNorm = s.value(0);

  const showEuc = s.value(0);
  const showNear = s.value(0);
  const showCos = s.value(0);
  const showAligned = s.value(0);

  const normToUnit = s.value(0);
  const flipOpposite = s.value(0);
  const showFallback = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a32', '#2a1c4f18');
  const title = heroTitle(['Spherical k-means', '& Unit Centers'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'ARITHMETIC MEAN VS DIRECTIONAL MEAN',
  });

  const cx = -340;
  const cy = 65;
  const R = 270;
  const pt = (x, y) => [cx + x * R, cy - y * R];

  // View 1: Two unit vectors (1,0) and (0,1) average to (0.5, 0.5) inside the unit circle (||m|| = 0.707)
  const viewMean = guardedDynamic(vMean, (a) => {
    const nodes = [
      glowRing(cx, cy, R, COSMOS.rule, { width: 2.5, dash: [8, 6], opacity: a }),
      glowArrow([cx, cy], pt(1, 0), COSMOS.cyan, { width: 4, opacity: a }),
      glowArrow([cx, cy], pt(0, 1), COSMOS.emerald, { width: 4, opacity: a }),
      txt('(1, 0)', ...pt(0.88, -0.18), 28, COSMOS.cyan, 'mono').opacity(a),
      txt('(0, 1)', ...pt(-0.24, 0.92), 28, COSMOS.emerald, 'mono').opacity(a),
      // Right-side explanation
      txt('UNIT-CIRCLE MEAN SHRINKAGE', 110, -210, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('Two unit arrows: (1, 0) and (0, 1)', 110, -140, 28, COSMOS.ink, 'mono', 'left').opacity(
        a,
      ),
    ];

    if (showMean.value > 0.02) {
      nodes.push(
        line(pt(1, 0), pt(0, 1), { stroke: COSMOS.muted, width: 2.2, dash: [6, 5] }).opacity(
          showMean.value * a,
        ),
        glowArrow([cx, cy], pt(0.5, 0.5), QUERY_COLOR, {
          width: 4.5,
          opacity: showMean.value * a,
        }),
        txt('mean (0.5, 0.5)', ...pt(0.56, 0.62), 26, QUERY_COLOR, 'mono', 'left').opacity(
          showMean.value * a,
        ),
        txt(
          'Arithmetic mean lands INSIDE the circle!',
          110,
          -52,
          28,
          QUERY_COLOR,
          'sans',
          'left',
        ).opacity(showMean.value * a),
      );
    }
    if (showNorm.value > 0.02) {
      nodes.push(
        txt('||mean|| = √(0.5² + 0.5²) ≈ 0.707 < 1.0', 110, 25, 30, DANGER_COLOR, 'mono', 'left')
          .glow(6, DANGER_COLOR)
          .opacity(showNorm.value * a),
        txt(
          'Euclidean distance depends on center norm as well as angle',
          110,
          98,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showNorm.value * a),
      );
    }
    return nodes;
  });

  // View 2: Q=(1,0), C0=(0.1,0), C1=(0.8,0.6): Euclidean picks C1 (dist 0.632 < 0.9), Cosine picks C0 (cos 1.0 > 0.8)!
  const viewConflict = guardedDynamic(vConflict, (a) => {
    const qP = pt(1, 0);
    const c0P = pt(0.1, 0);
    const c1P = pt(0.8, 0.6);

    const nodes = [
      glowRing(cx, cy, R, COSMOS.rule, { width: 2.5, dash: [8, 6], opacity: a }),
      glowArrow([cx, cy], qP, QUERY_COLOR, { width: 4.2, opacity: a }),
      txt('Q (1, 0)', qP[0] + 18, qP[1] + 34, 26, QUERY_COLOR, 'mono', 'left').opacity(a),
      glowDot(c0P[0], c0P[1], { radius: 9, color: COSMOS.cyan, glow: 11, opacity: a }),
      txt('C0 (0.1, 0)', c0P[0], c0P[1] + 38, 26, COSMOS.cyan, 'mono').opacity(a),
      glowDot(c1P[0], c1P[1], { radius: 9, color: COSMOS.emerald, glow: 11, opacity: a }),
      txt('C1 (0.8, 0.6)', c1P[0], c1P[1] - 32, 26, COSMOS.emerald, 'mono').opacity(a),
      txt('ROUTING DISAGREEMENT', 110, -210, 26, DANGER_COLOR, 'mono', 'left').opacity(a),
    ];

    if (showEuc.value > 0.02) {
      nodes.push(
        line(qP, c1P, { stroke: COSMOS.emerald, width: 3.5 }).opacity(showEuc.value * a),
        line(qP, c0P, { stroke: COSMOS.cyan, width: 2.5, dash: [7, 5] }).opacity(showEuc.value * a),
        txt('Euclidean from Q:', 110, -135, 26, COSMOS.muted, 'mono', 'left').opacity(
          showEuc.value * a,
        ),
        txt(
          'd(Q, C1) = 0.63  <  d(Q, C0) = 0.90',
          110,
          -82,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        ).opacity(showEuc.value * a),
      );
    }
    if (showNear.value > 0.02) {
      nodes.push(
        txt('⇒  Euclidean opens list C1', 110, -28, 28, COSMOS.emerald, 'mono', 'left')
          .glow(6, COSMOS.emerald)
          .opacity(showNear.value * a),
      );
    }
    if (showCos.value > 0.02) {
      nodes.push(
        glowArrow([cx, cy], c0P, COSMOS.cyan, { width: 5, opacity: showCos.value * a }),
        txt('Cosine from origin:', 110, 72, 26, COSMOS.muted, 'mono', 'left').opacity(
          showCos.value * a,
        ),
        txt(
          'cos(Q, C0) = 1.00  >  cos(Q, C1) = 0.80',
          110,
          125,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(showCos.value * a),
      );
    }
    if (showAligned.value > 0.02) {
      nodes.push(
        txt('⇒  Cosine opens list C0 (DIFFERENT LIST!)', 110, 182, 28, DANGER_COLOR, 'mono', 'left')
          .glow(7, DANGER_COLOR)
          .opacity(showAligned.value * a),
      );
    }

    return nodes;
  });

  // View 3: Spherical k-means normalizes sum onto unit circle + opposite vectors cancel to 0 -> fallback
  const viewSpherical = guardedDynamic(vSpherical, (a) => {
    const n = normToUnit.value;
    const opp = flipOpposite.value;
    const ang2 = (Math.PI / 2) * (1 - opp) + Math.PI * opp; // rotates from +y to -x (opposite!)
    const v2 = [Math.cos(ang2), Math.sin(ang2)];
    const sumVec = [1 + v2[0], v2[1]];
    const sumNorm = Math.hypot(...sumVec);
    const scale = sumNorm > 0.05 ? 0.5 + (1 / sumNorm - 0.5) * n : 0;
    const ctr = [sumVec[0] * scale, sumVec[1] * scale];

    const nodes = [
      glowRing(cx, cy, R, COSMOS.cyan, { width: 2.8, glow: 7, opacity: a }),
      glowArrow([cx, cy], pt(1, 0), COSMOS.cyan, { width: 4, opacity: a }),
      glowArrow([cx, cy], pt(v2[0], v2[1]), COSMOS.emerald, { width: 4, opacity: a }),
      txt('SPHERICAL K-MEANS UPDATE', 110, -210, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('1. Normalize inputs to unit length', 110, -142, 28, COSMOS.ink, 'sans', 'left').opacity(
        a,
      ),
      txt('2. Assign by maximum dot product', 110, -84, 28, COSMOS.ink, 'sans', 'left').opacity(a),
    ];

    if (sumNorm > 0.08) {
      nodes.push(
        glowArrow([cx, cy], pt(ctr[0], ctr[1]), QUERY_COLOR, { width: 4.5, opacity: a }),
        txt(
          n > 0.5 ? 'c = Σx / ||Σx|| (unit circle)' : 'unnormalized sum',
          cx,
          cy + R + 44,
          26,
          QUERY_COLOR,
          'mono',
        ).opacity(a),
      );
    }

    if (n > 0.5) {
      nodes.push(
        txt(
          '3. Divide sum by ||sum|| → lands ON unit circle',
          110,
          -10,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(a),
      );
    }
    if (opp > 0.5) {
      nodes.push(
        glowDot(cx, cy, { radius: 11, color: DANGER_COLOR, glow: 14, opacity: a }),
        txt(
          'Opposite vectors: (1, 0) + (−1, 0) = (0, 0)!',
          110,
          92,
          28,
          DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(7, DANGER_COLOR)
          .opacity(a),
      );
    }
    if (showFallback.value > 0.02) {
      nodes.push(
        txt(
          'Zero sum or empty group → trigger explicit seed fallback',
          110,
          165,
          28,
          QUERY_COLOR,
          'sans',
          'left',
        ).opacity(showFallback.value * a),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, viewMean, viewConflict, viewSpherical);

  tweenCue(s, c, 'mean', showMean, 1, { duration: 0.45 });
  tweenCue(s, c, 'norm', showNorm, 1, { duration: 0.45 });

  crossSwap(s, c, 'groups', vMean, vConflict, { duration: 0.55 });
  tweenCue(s, c, 'euclidean', showEuc, 1, { duration: 0.45 });
  tweenCue(s, c, 'near', showNear, 1, { duration: 0.45 });
  tweenCue(s, c, 'cosine', showCos, 1, { duration: 0.45 });
  tweenCue(s, c, 'aligned', showAligned, 1, { duration: 0.45 });

  crossSwap(s, c, 'normalize', vConflict, vSpherical, { duration: 0.55 });
  tweenCue(s, c, 'unit', normToUnit, 1, { duration: 0.65 });
  tweenCue(s, c, 'zero', flipOpposite, 1, { duration: 0.75 });
  tweenCue(s, c, 'fallback', showFallback, 1, { duration: 0.45 });
}
