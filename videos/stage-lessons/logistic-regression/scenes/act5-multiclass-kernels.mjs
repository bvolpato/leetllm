// Act 5 (Scenes 26-29): Multiclass Softmax Heads & Probability Simplex,
// Numerically Stable Softmax (Log-Sum-Exp Shift), Margin vs Hinge Loss (SVM),
// and RBF Kernel Similarity (+ 3D Kernel Surface) & Gaussian Process Uncertainty.
import {
  Node,
  circle,
  dynamic,
  gridPlane3d,
  group,
  line,
  polyPath,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaGrid,
  cinematic3d,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowCol,
  glowDot,
  glowTex,
  gpFixture,
  guardedDynamic,
  heroTitle,
  livingDrift,
  makeAxes,
  marginFixture,
  mix,
  multiclassSnapshot,
  neonCurve,
  orbitScene,
  rule,
  sampleCurve,
  scaleTrack,
  smooth,
  softplus,
  stableDistribution,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 26. multiclass-heads: Let each class receive its own residual (+ 2D Probability Simplex)
// Cues: lr-multiclass-heads-step-0, lr-softmax-heads, lr-class-distribution,
//       lr-multiclass-heads-step-1, lr-class-residual, lr-multiclass-fit,
//       lr-multiclass-heads-step-2, lr-shared-head-shift
// ---------------------------------------------------------------------------
export function multiclassHeads(s, c) {
  const s0P = s.value(0);
  const headP = s.value(0);
  const distP = s.value(0);
  const s1P = s.value(0);
  const resP = s.value(0);
  const fitP = s.value(0);
  const s2P = s.value(0);
  const shiftP = s.value(0);
  const drift = s.value(0);

  const classNames = ['auto', 'review', 'escalate'];
  const classCols = [ROLE.negative, ROLE.threshold, ROLE.positive];

  s.add(cinemaGrid({ accent: ROLE.loss, seed: 26 }));
  s.add(decorAura(340, 0, 520, '#a78bfa1c', '#5ce1e614'));

  const headline = heroTitle(['Three Linear Heads', '& Softmax Simplex'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.loss,
    eyebrow: 'MULTICLASS LOGISTIC REGRESSION (6 ROWS × 3 CLASSES)',
  });

  // View 01 (Beats 0-1): 6-row softmax probabilities on left + live 2D probability simplex triangle on right!
  const view01 = guardedDynamic(
    () => fadeOut(s2P.value),
    (vis) => {
      const s1 = s1P.value;
      const ft = fitP.value;
      const ds = distP.value;
      const step =
        s1 < 0.05
          ? 0
          : ft > 0.9
            ? 1000
            : Math.min(999, Math.round(Math.expm1(smooth(s1) * Math.log(1001))));
      const snap = multiclassSnapshot(step);
      const nodes = [];

      // Left table: 6 rows × 3 class probability bars
      nodes.push(txt('AUTO', -460, -220, 26, classCols[0], 'mono'));
      nodes.push(txt('REVIEW', -235, -220, 26, classCols[1], 'mono'));
      nodes.push(txt('ESCALATE', -10, -220, 26, classCols[2], 'mono'));

      snap.rows.forEach((r, i) => {
        const y = -155 + i * 68;
        const rowCol = classCols[r.label];
        nodes.push(txt(r.id, -815, y, 26, rowCol, 'mono', 'left'));
        nodes.push(txt(`[${r.x[1]}, ${r.x[2]}]`, -735, y, 26, COSMOS.muted, 'mono', 'left'));
        for (let k = 0; k < 3; k++) {
          const bx = -565 + k * 235;
          const p = r.probabilities[k];
          nodes.push(
            scaleTrack(bx, y, 122, 28, { stroke: '#2c3d63', radius: 6 }),
            glowBar(bx, y, Math.max(6, 122 * p), 28, classCols[k], { glow: 7, radius: 6 }),
            ds > 0.3 || s1 > 0.1
              ? txt(p.toFixed(2), bx + 138, y, 26, classCols[k], 'mono', 'left')
              : group(),
          );
        }
      });

      // Right: 2D Probability Simplex Triangle (vertices = pure classes, 6 dots migrate from center to corners!)
      const vAuto = [260, 175];
      const vRev = [530, -175];
      const vEsc = [800, 175];
      nodes.push(
        new Node(polyPath([vAuto, vRev, vEsc], true)).fill('#0d152a', 0.65).stroke('#4b6299', 2.6),
        txt('Auto', vAuto[0] - 20, vAuto[1] + 42, 26, classCols[0], 'mono'),
        txt('Review', vRev[0], vRev[1] - 36, 26, classCols[1], 'mono'),
        txt('Escalate', vEsc[0] + 10, vEsc[1] + 42, 26, classCols[2], 'mono'),
        txt('PROBABILITY SIMPLEX Δ²', 530, -230, 26, ROLE.score, 'mono'),
      );
      snap.rows.forEach((r, i) => {
        const [p0, p1, p2] = r.probabilities;
        const sx = p0 * vAuto[0] + p1 * vRev[0] + p2 * vEsc[0];
        const sy = p0 * vAuto[1] + p1 * vRev[1] + p2 * vEsc[1];
        const col = classCols[r.label];
        nodes.push(glowDot(sx, sy, { radius: 10, color: col, glow: 12 }));
      });

      // Bottom equation crossfading cleanly between Beat 0 (Z = XW, Softmax) and Beat 1 (Gradient & loss 0.0055)
      const preS1 = fadeOut(s1);
      const postS1 = fadeIn(s1);
      if (preS1 > 0.02) {
        nodes.push(
          glowTex('Z = X W, \\qquad P_{ik} = \\frac{e^{Z_{ik}}}{\\sum_j e^{Z_{ij}}}', {
            x: 0,
            y: 360,
            size: 42,
            color: ROLE.score,
          }).opacity(preS1),
        );
      }
      if (postS1 > 0.02) {
        nodes.push(
          group(
            glowTex('\\nabla_W L = \\frac{1}{N} X^\\top (P - Y)', {
              x: -310,
              y: 360,
              size: 40,
              color: ROLE.threshold,
            }),
            txt(
              ft > 0.5 ? `Loss = ${snap.loss.toFixed(4)}` : `Step ${step}`,
              440,
              360,
              34,
              ROLE.good,
              'mono',
            ),
          ).opacity(postS1),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Adding shared constant c to every class head shifts logits, preserves probabilities!
  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const sh = 3.0 * smooth(shiftP.value);
      const snap = multiclassSnapshot(1000);
      const row = snap.rows[2]; // M3
      const baseY = 175;
      const nodes = [
        txt(
          'SHIFT INVARIANCE:  ADD +c TO EVERY CLASS HEAD (ROW M3)',
          0,
          -220,
          28,
          ROLE.threshold,
          'mono',
        ),
      ];
      row.logits.forEach((z, k) => {
        const cx = -510 + k * 510;
        const shiftedZ = z + sh;
        const p = row.probabilities[k];
        nodes.push(
          txt(classNames[k].toUpperCase(), cx, -135, 30, classCols[k], 'mono'),
          txt(`z = ${shiftedZ.toFixed(2)}`, cx, -65, 40, ROLE.threshold, 'mono'),
          glowCol(cx, baseY, 130, Math.max(10, 195 * p), classCols[k], { glow: 10 }),
          txt(`p = ${p.toFixed(4)}`, cx, baseY + 46, 34, ROLE.score, 'mono'),
        );
      });
      nodes.push(
        glowTex('\\operatorname{softmax}(z + c\\mathbf{1}) = \\operatorname{softmax}(z)', {
          x: 0,
          y: 335,
          size: 44,
          color: ROLE.score,
        }),
        txt(
          'Pin a reference head to zero to recover binary logistic regression',
          0,
          402,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view01, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-multiclass-heads-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-softmax-heads', headP, 1, { dur: 0.75 });
  cueTo(s, c, 'lr-class-distribution', distP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-multiclass-heads-step-1', s1P, 1, { dur: 1.3 });
  cueTo(s, c, 'lr-class-residual', resP, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-multiclass-fit', fitP, 1, { dur: 0.6 });
  cueTo(s, c, 'lr-multiclass-heads-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-shared-head-shift', shiftP, 1, { dur: 0.95 });
}

// ---------------------------------------------------------------------------
// 27. stable-softmax: Keep an extremely wrong class expensive
// Cues: lr-stable-softmax-step-0, lr-shift-largest, lr-exp-normalizer,
//       lr-stable-softmax-step-1, lr-extreme-class-loss,
//       lr-stable-softmax-step-2, lr-clipped-class-loss
// ---------------------------------------------------------------------------
export function stableSoftmax(s, c) {
  const s0P = s.value(0);
  const shiftP = s.value(0);
  const normP = s.value(0);
  const s1P = s.value(0);
  const extP = s.value(0);
  const s2P = s.value(0);
  const clipP = s.value(0);
  const drift = s.value(0);

  const row0 = [10, 12, 10];
  const dist0 = stableDistribution(row0);
  const rowExt = [1000, 0, -1000];
  const distExt = stableDistribution(rowExt);
  const clippedPenalty = -Math.log(1e-15);

  s.add(cinemaGrid({ accent: ROLE.score, seed: 27 }));
  s.add(decorAura(0, 0, 560, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Max-Shifted Softmax', '& Log-Sum-Exp Loss'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.score,
    eyebrow: 'PREVENTING OVERFLOW & SILENT CLIPPING CAPS',
  });

  // View 0 (Beat 0): [10, 12, 10] -> subtract max 12 -> [-2, 0, -2] -> exp -> normalize
  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const sh = smooth(shiftP.value);
      const nm = normP.value;
      const nodes = [
        txt('SUBTRACT MAX LOGIT (12) BEFORE EXPONENTIATING', 0, -220, 28, ROLE.threshold, 'mono'),
      ];
      row0.forEach((v, i) => {
        const cx = -520 + i * 520;
        const curZ = v - 12 * sh;
        nodes.push(
          txt(`CLASS ${i}`, cx, -135, 28, COSMOS.muted, 'mono'),
          txt(curZ.toFixed(2), cx, -60, 50, ROLE.threshold, 'mono').glow(8, ROLE.threshold),
          txt(
            sh > 0.7 ? `exp = ${dist0.exponentials[i].toFixed(4)}` : 'exp(z − m)',
            cx,
            45,
            32,
            ROLE.score,
            'mono',
          ),
          txt(
            nm > 0.5 ? `p = ${dist0.probabilities[i].toFixed(4)}` : 'p = ?',
            cx,
            130,
            34,
            nm > 0.5 ? ROLE.good : COSMOS.dim,
            'mono',
          ),
        );
      });
      nodes.push(
        glowTex(
          nm > 0.5
            ? `\\sum_j e^{z_j - \\max z} = ${dist0.normalizer.toFixed(4)}`
            : 'z_j^{\\prime} = z_j - \\max_k z_k \\le 0',
          { x: 0, y: 295, size: 42, color: ROLE.threshold },
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Extreme logits [1000, 0, -1000], target class 2 -> shifted [0, -1000, -2000] -> loss = 2000 nats
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(s1P.value), fadeOut(s2P.value)),
    (vis) => {
      const ex = extP.value;
      const nodes = [
        txt(
          'EXTREME ROW:  [1000, 0, −1000]  ·  TARGET = CLASS 2',
          0,
          -220,
          28,
          ROLE.positive,
          'mono',
        ),
      ];
      rowExt.forEach((v, i) => {
        const cx = -520 + i * 520;
        const isTgt = i === 2;
        nodes.push(
          txt(
            `CLASS ${i}${isTgt ? ' (TARGET)' : ''}`,
            cx,
            -135,
            28,
            isTgt ? ROLE.positive : COSMOS.muted,
            'mono',
          ),
          txt(`z = ${v}`, cx, -60, 42, ROLE.threshold, 'mono'),
          txt(`shifted = ${distExt.shifted[i]}`, cx, 25, 32, ROLE.score, 'mono'),
          txt(`exp = ${distExt.exponentials[i]}`, cx, 105, 32, COSMOS.ink, 'mono'),
        );
      });
      nodes.push(
        glowTex(
          ex > 0.5
            ? 'L = \\ln(1 + 0 + 0) - (-2000) = 2000\\text{ nats}'
            : 'L = \\ln\\!\\left(\\sum_j e^{z_j^{\\prime}}\\right) - z_y^{\\prime}',
          { x: 0, y: 285, size: 44, color: ex > 0.5 ? ROLE.positive : ROLE.score },
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Logit-space 2000 nats vs clipped 1e-15 capped at 34.54 nats
  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const cl = smooth(clipP.value);
      const bx = -660;
      const maxW = 1120;
      const clipW = Math.max(20, maxW * (clippedPenalty / 2000));
      const nodes = [
        txt(
          'SAME EXTREME WRONG TARGET:  TRUE LOSS vs PROBABILITY CLIPPING',
          0,
          -220,
          28,
          COSMOS.muted,
          'mono',
        ),
        txt('Logit-space loss:  2000.00 nats', bx, -110, 34, ROLE.positive, 'mono', 'left'),
        scaleTrack(bx, -45, maxW, 64, { stroke: '#2c3d63', radius: 10 }),
        glowBar(bx, -45, maxW, 64, ROLE.positive, { glow: 12, radius: 10 }),
        txt(
          cl > 0.3
            ? `Clipped at 10⁻¹⁵:  ${clippedPenalty.toFixed(2)} nats  (hides 98% of the error!)`
            : 'Probability clipping cap...',
          bx,
          105,
          34,
          ROLE.threshold,
          'mono',
          'left',
        ),
        scaleTrack(bx, 170, maxW, 64, { stroke: '#2c3d63', radius: 10 }),
        glowBar(bx, 170, clipW * Math.max(0.2, cl), 64, ROLE.threshold, { glow: 10, radius: 8 }),
        txt(
          'Compute cross-entropy directly from shifted logits; rounded [1, 0, 0] is not calibrated certainty',
          0,
          345,
          28,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-stable-softmax-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-shift-largest', shiftP, 1, { dur: 0.9 });
  cueTo(s, c, 'lr-exp-normalizer', normP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-stable-softmax-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-extreme-class-loss', extP, 1, { dur: 0.6 });
  cueTo(s, c, 'lr-stable-softmax-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-clipped-class-loss', clipP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 28. margin-objective: Compare two losses on the same signed margin
// Cues: lr-margin-objective-step-0, lr-functional-margin, lr-hinge-cleared,
//       lr-margin-objective-step-1, lr-weight-penalty,
//       lr-margin-objective-step-2, lr-implementation-hinge
// ---------------------------------------------------------------------------
export function marginObjective(s, c) {
  const s0P = s.value(0);
  const margP = s.value(0);
  const clrP = s.value(0);
  const s1P = s.value(0);
  const penP = s.value(0);
  const s2P = s.value(0);
  const impP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 28 }));
  s.add(decorAura(-180, 0, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['Hinge Loss', 'vs Logistic Loss'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: 'SIGNED FUNCTIONAL MARGIN  m = y · s  (y ∈ {−1, +1})',
  });

  // View 0 (Beat 0): Hinge vs Logistic at m = 0.4 -> m = 1.4
  const ax0 = makeAxes({
    x0: -790,
    y0: -205,
    w: 940,
    h: 455,
    xDom: [-1, 2],
    yDom: [0, 2.2],
    xTicks: [-1, 0, 0.4, 1, 1.4, 2],
    yTicks: [0, 0.5, 1, 1.5, 2],
    xLabel: 'signed functional margin  y · s',
    yLabel: 'loss',
  });
  const hingePts0 = sampleCurve(ax0, (x) => Math.max(0, 1 - x), -1, 2, 90);
  const logPts0 = sampleCurve(ax0, (x) => softplus(-x), -1, 2, 90);

  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const mVal = mix(0.4, 1.4, smooth(clrP.value));
      const m = marginFixture(mVal, 1);
      const rx = 510;
      return group(
        ax0.node,
        line(ax0.pt(1, 0), ax0.pt(1, 2.2), { stroke: '#4d6499', width: 2, dash: [6, 6] }),
        neonCurve(hingePts0, [ROLE.threshold, ROLE.warn], { width: 4.5, glow: 11 }),
        neonCurve(logPts0, [ROLE.score, ROLE.good], { width: 4.5, glow: 11 }),
        glowDot(...ax0.pt(m.margin, m.hinge), { radius: 12, color: ROLE.threshold, glow: 14 }),
        glowDot(...ax0.pt(m.margin, m.logistic), { radius: 12, color: ROLE.score, glow: 14 }),
        txt(`MARGIN  m = ${m.margin.toFixed(2)}`, rx, -175, 34, ROLE.positive, 'mono'),
        txt(`Hinge:    ${m.hinge.toFixed(3)}`, rx, -75, 38, ROLE.threshold, 'mono'),
        txt(`Logistic: ${m.logistic.toFixed(3)}`, rx, 10, 38, ROLE.score, 'mono'),
        txt(
          mVal > 1.05
            ? 'Past m = 1: hinge hits 0, logistic stays positive'
            : 'Inside margin (0.4): hinge still pushes (+0.600)',
          0,
          375,
          30,
          COSMOS.muted,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  // View 1 (Beat 1): Soft-margin SVM objective 0.5 ||w||^2 + C sum hinge
  const ax1 = makeAxes({
    x0: -790,
    y0: -205,
    w: 940,
    h: 455,
    xDom: [0, 3],
    yDom: [0, 5],
    xTicks: [0, 1, 2, 3],
    yTicks: [0, 1, 2, 3, 4, 5],
    xLabel: 'scalar weight a',
    yLabel: 'objective',
  });
  const h1 = sampleCurve(ax1, (x) => Math.max(0, 1 - x), 0, 3, 90);
  const p1 = sampleCurve(ax1, (x) => 0.5 * x * x, 0, 3, 90);
  const c1 = sampleCurve(ax1, (x) => Math.max(0, 1 - x) + 0.5 * x * x, 0, 3, 90);

  const view1 = guardedDynamic(
    () => Math.min(fadeIn(s1P.value), fadeOut(s2P.value)),
    (vis) => {
      const pn = penP.value;
      const aNow = 1.0 + 1.5 * smooth(s1P.value);
      const yNow = Math.max(0, 1 - aNow) + (pn > 0.2 ? 0.5 * aNow * aNow : 0);
      const rx = 510;
      const nodes = [
        ax1.node,
        neonCurve(h1, ROLE.score, { width: 3.4, glow: 7 }),
        pn > 0.2
          ? group(
              neonCurve(p1, ROLE.threshold, { width: 3.4, glow: 7 }),
              neonCurve(c1, [ROLE.positive, ROLE.warn], { width: 4.8, glow: 12 }),
            ).opacity(pn)
          : group(),
        glowDot(...ax1.pt(aNow, Math.min(5, yNow)), { radius: 12, color: ROLE.positive, glow: 14 }),
        glowTex('\\frac{1}{2}\\|w\\|^2 + C \\sum_i \\max(0, 1 - y_i s_i)', {
          x: rx,
          y: -115,
          size: 32,
          color: ROLE.positive,
        }),
        txt('Support vectors: m ≤ 1', rx, 5, 30, ROLE.threshold, 'mono'),
        txt('Safe rows (m > 1): 0 hinge force', rx, 75, 28, ROLE.score, 'sans'),
        txt('Geometric margin = (y · s) / ‖w‖', 0, 375, 30, COSMOS.muted, 'mono'),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Ordinary hinge vs LinearSVC default squared hinge
  const ax2 = makeAxes({
    x0: -790,
    y0: -205,
    w: 940,
    h: 455,
    xDom: [-1, 2],
    yDom: [0, 4],
    xTicks: [-1, 0, 1, 2],
    yTicks: [0, 1, 2, 3, 4],
    xLabel: 'signed functional margin',
    yLabel: 'loss',
  });
  const h2 = sampleCurve(ax2, (x) => Math.max(0, 1 - x), -1, 2, 90);
  const sq2 = sampleCurve(ax2, (x) => Math.max(0, 1 - x) ** 2, -1, 2, 90);

  const view2 = guardedDynamic(
    () => fadeIn(s2P.value),
    (vis) => {
      const mNow = mix(-0.8, 1.5, smooth(impP.value));
      const rx = 510;
      return group(
        ax2.node,
        neonCurve(h2, ROLE.threshold, { width: 4.2, glow: 10 }),
        neonCurve(sq2, [ROLE.positive, ROLE.loss], { width: 4.5, glow: 12 }),
        glowDot(...ax2.pt(mNow, Math.max(0, 1 - mNow)), { radius: 11, color: ROLE.threshold }),
        glowDot(...ax2.pt(mNow, Math.max(0, 1 - mNow) ** 2), { radius: 11, color: ROLE.positive }),
        txt('Ordinary hinge: max(0, 1 − m)', rx, -115, 28, ROLE.threshold, 'mono'),
        txt('Squared hinge: max(0, 1 − m)²', rx, -45, 28, ROLE.positive, 'mono'),
        txt('LinearSVC defaults to squared hinge', rx, 55, 28, COSMOS.ink, 'sans'),
        txt('Decision score ≠ calibrated probability', 0, 375, 30, COSMOS.muted, 'serif'),
      ).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lr-margin-objective-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-functional-margin', margP, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-hinge-cleared', clrP, 1, { dur: 0.95 });
  cueTo(s, c, 'lr-margin-objective-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-weight-penalty', penP, 1, { dur: 0.8 });
  cueTo(s, c, 'lr-margin-objective-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-implementation-hinge', impP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 29. kernel-uncertainty: Use the same similarity for two different predictive jobs (+ 3D RBF Mountain!)
// Cues: lr-kernel-uncertainty-step-0, lr-kernel-distances, lr-kernel-uncertainty-step-1,
//       lr-gp-posterior-mean, lr-gp-posterior-variance, lr-kernel-uncertainty-step-2,
//       lr-gp-observation-noise
// ---------------------------------------------------------------------------
export function kernelUncertainty(s, c) {
  const s0P = s.value(0);
  const distP = s.value(0);
  const s1P = s.value(0);
  const meanP = s.value(0);
  const varP = s.value(0);
  const s2P = s.value(0);
  const noiseP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.score, seed: 29 }));
  s.add(decorAura(430, -20, 520, '#5ce1e61c', '#a78bfa18'));

  const headline = heroTitle(['RBF Similarity', '& GP Posterior Band'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.score,
    eyebrow: 'NONLINEAR KERNELS vs CONTINUOUS GP REGRESSION',
  });

  // Beat 0 Right: Orbiting 3D RBF Gaussian kernel bell k(u, v) = exp(-(u^2 + v^2)/2)
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 15.6,
    unit: 86,
    focus: [0, 0, 0.85],
  }).at(480, -45);

  const floor3d = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2.6, 2.6],
    z: 0,
    step: 1,
    color: '#293b66',
    opacity: 0.45,
  });

  const rbfSurf = surface((u, v) => Math.exp(-(u * u + v * v) / 2) * 2.4, {
    x: [-2.6, 2.6],
    y: [-2.6, 2.6],
    resolution: [20, 20],
    colors: [ROLE.negative, ROLE.score, ROLE.good, ROLE.threshold],
    mesh: '#8fa9e0',
  });
  view3d.add(floor3d, rbfSurf);

  const view3dWrap = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => view3d.opacity(vis),
  );

  // View 0 (Beat 0): Left 1D RBF decay curve + d=1 (0.607) & d=3 (0.011) probes + Right 3D kernel bell
  const ax0 = makeAxes({
    x0: -800,
    y0: -205,
    w: 770,
    h: 440,
    xDom: [0, 4],
    yDom: [0, 1.05],
    xTicks: [0, 1, 2, 3, 4],
    yTicks: [0, 0.5, 1],
    xLabel: 'distance d  (length scale ℓ = 1)',
    yLabel: 'RBF similarity k',
  });
  const rbf1d = sampleCurve(ax0, (d) => gpFixture(d).similarity, 0, 4, 100);

  const view0 = guardedDynamic(
    () => fadeOut(s1P.value),
    (vis) => {
      const dNow = 3 * smooth(distP.value);
      const g = gpFixture(dNow);
      return group(
        ax0.node,
        neonCurve(rbf1d, [ROLE.threshold, ROLE.score, ROLE.negative], { width: 4.5, glow: 11 }),
        glowDot(...ax0.pt(dNow, g.similarity), { radius: 12, color: ROLE.threshold, glow: 15 }),
        glowTex('k(d) = \\exp\\!\\left(-\\frac{d^2}{2\\ell^2}\\right)', {
          x: 480,
          y: -315,
          size: 38,
          color: ROLE.score,
        }),
        txt(
          distP.value > 0.7
            ? `d = 1 → ${gpFixture(1).similarity.toFixed(3)}   ·   d = 3 → ${gpFixture(3).similarity.toFixed(3)}`
            : `d = ${dNow.toFixed(2)}  →  k = ${g.similarity.toFixed(3)}`,
          480,
          295,
          30,
          ROLE.threshold,
          'mono',
        ),
        txt(
          'RBF SVM builds nonlinear margins from similarities; feature scale and ℓ matter',
          0,
          375,
          28,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  // View 12 (Beats 1-2): Continuous 1-observation GP Regression posterior mean + ±1σ latent/observation band
  const ax1 = makeAxes({
    x0: -790,
    y0: -205,
    w: 960,
    h: 455,
    xDom: [-4, 4],
    yDom: [-1.5, 3],
    xTicks: [-4, -2, 0, 2, 4],
    yTicks: [-1, 0, 1, 2, 3],
    xLabel: 'distance from observed input x₀ = 0',
    yLabel: 'GP regression value',
  });

  const view12 = guardedDynamic(
    () => fadeIn(s1P.value),
    (vis) => {
      const mn = meanP.value;
      const vr = varP.value;
      const ns = smooth(noiseP.value);
      const s2 = s2P.value;
      const nodes = [ax1.node];

      // Posterior ±1σ uncertainty band polygon
      if (vr > 0.05) {
        const upPts = [];
        const loPts = [];
        for (let i = 0; i <= 70; i++) {
          const x = -4 + (8 * i) / 70;
          const g = gpFixture(x);
          const std = Math.sqrt(g.latentVariance + 0.04 * ns);
          upPts.push(ax1.pt(x, g.mean + std));
          loPts.unshift(ax1.pt(x, g.mean - std));
        }
        nodes.push(
          new Node(polyPath([...upPts, ...loPts], true))
            .fill(ns > 0.5 ? ROLE.threshold : ROLE.score, 0.16 * vr)
            .stroke(null),
        );
      }

      // Posterior mean curve
      if (mn > 0.05) {
        const mPts = sampleCurve(ax1, (d) => gpFixture(d).mean, -4, 4, 100);
        nodes.push(neonCurve(mPts, [ROLE.score, ROLE.good], { width: 4.5, glow: 11 }).opacity(mn));
      }

      // Observed datum (x0 = 0, y = 2)
      const obsPt = ax1.pt(0, 2);
      nodes.push(
        glowDot(obsPt[0], obsPt[1], { radius: 12, color: ROLE.positive, glow: 15 }),
        txt('observed y = 2', obsPt[0] + 135, obsPt[1] - 48, 26, ROLE.positive, 'mono'),
      );

      // Right equations & GP readouts
      const rx = 510;
      nodes.push(
        txt('SEPARATE GP REGRESSION', rx, -205, 26, ROLE.threshold, 'mono'),
        glowTex('\\mu(x) = \\frac{2 k}{1.04}', { x: rx, y: -115, size: 40, color: ROLE.score }),
        glowTex('\\sigma_f^2(x) = 1 - \\frac{k^2}{1.04}', {
          x: rx,
          y: 5,
          size: 38,
          color: ROLE.loss,
        }),
        txt(
          s2 > 0.3
            ? `At x₀: μ = ${gpFixture(0).mean.toFixed(3)}, σ_f = ${gpFixture(0).latentStd.toFixed(3)}`
            : 'Noise variance σ_n² = 0.04',
          rx,
          120,
          28,
          ROLE.score,
          'mono',
        ),
        txt(
          ns > 0.5 ? 'New observation: +0.04 variance' : 'Latent ±1σ band shrinks near x₀',
          rx,
          190,
          28,
          ns > 0.5 ? ROLE.threshold : COSMOS.muted,
          'sans',
        ),
        txt(
          s2 > 0.3
            ? 'Exact dense GP costs O(N³) time and O(N²) memory; regression ≠ classification'
            : 'Zero prior mean · unit prior variance · Gaussian noise variance 0.04',
          0,
          375,
          28,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view3dWrap, view0, view12);
  livingDrift(s, c, drift, 1);
  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.15, phi: 0.94, distance: 14.6 },
    { startOffset: 0.15, endMargin: 0.6 },
  );
  cueTo(s, c, 'lr-kernel-uncertainty-step-0', s0P, 1, { dur: 0.7 });
  cueTo(s, c, 'lr-kernel-distances', distP, 1, { dur: 1.0 });
  cueTo(s, c, 'lr-kernel-uncertainty-step-1', s1P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-gp-posterior-mean', meanP, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-gp-posterior-variance', varP, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-kernel-uncertainty-step-2', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'lr-gp-observation-noise', noiseP, 1, { dur: 0.85 });
}
