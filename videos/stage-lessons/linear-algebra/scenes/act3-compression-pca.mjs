// Act 3: Rank-1 Truncation & Frobenius Error, Cosine Retrieval Ties,
// PCA Centering, Centered Spread & Zero Cross-Sum, Projecting a New Ticket, and Sparse Densification.
import { Node, circle, dot, dynamic, group, line, polygon, rect } from 'vizmatic/stage';
import {
  A,
  COSMOS,
  LA,
  V,
  aura,
  bracketMatrix,
  cinemaGrid,
  common,
  contrast,
  cueTo,
  dotProduct,
  fmt,
  glassPlate,
  glowDot,
  glowTex,
  livingDrift,
  markDecor,
  mean,
  numberRuler,
  photonWire,
  polyPath,
  pulseCue,
  rightAngle,
  txt,
  vecArrow,
  vectorPlane2d,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 12. truncate: Spend the one-number budget
// Cues: discard-contrast, collapsed-route, reconstruction-error[CB]
// ---------------------------------------------------------------------------
export function truncate(s, c) {
  const projP = s.value(0);
  const routeAskP = s.value(0);
  const errP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.contrast, opacity: 0.48, seed: 12 }));
  s.add(aura(-230, 30, 560, '#60a5fa22', '#ff6b8b16'));

  const eqErr = glowTex(String.raw`\|A - A_1\|_F = \sqrt{4 \cdot (0.5)^2} = 1`, {
    x: 540,
    y: 265,
    size: 38,
    color: COSMOS.gold,
    glow: 8,
  });

  const live = dynamic(() => {
    const p = projP.value;
    const ask = routeAskP.value;
    const err = errP.value;
    const pulse = 1 + 0.08 * Math.sin(drift.value * Math.PI * 8);

    const plane = vectorPlane2d({
      originX: -390,
      originY: 225,
      scale: 310,
      xRange: [-0.35, 1.55],
      yRange: [-0.35, 1.45],
      xLabel: 'slow pages',
      yLabel: 'rollback',
    });

    const diag0 = plane.pt(-0.25, -0.25);
    const diag1 = plane.pt(1.38, 1.38);

    const nodes = [
      txt('RANK-1 TRUNCATION', -840, -420, 26, COSMOS.gold, 'mono', 'left'),
      txt('Drop contrast, keep common only', -840, -360, 46, COSMOS.ink, 'serif', 'left'),
      plane.node,
      markDecor(
        line(diag0, diag1, { stroke: LA.common, width: 3.6, dash: [12, 10] }).glow(8, LA.common),
      ),
    ];

    // Project each of the 3 tickets perpendicularly onto the common diagonal
    const currentRows = A.map((row) => {
      const c0 = dotProduct(row, common);
      const c1 = dotProduct(row, contrast);
      return [
        c0 * common[0] + (1 - p) * c1 * contrast[0],
        c0 * common[1] + (1 - p) * c1 * contrast[1],
      ];
    });

    currentRows.forEach((ptW, i) => {
      const col = LA.tickets[i];
      const origPt = plane.pt(A[i][0], A[i][1]);
      const curPt = plane.pt(ptW[0], ptW[1]);
      if (p > 0.04 && i < 2) {
        nodes.push(
          markDecor(line(origPt, curPt, { stroke: col, width: 2.6, dash: [6, 7] }).opacity(0.7)),
          circle(11, { fill: null, stroke: col, width: 2.4 })
            .at(origPt[0], origPt[1])
            .opacity(0.55),
        );
      }
      nodes.push(
        circle(i === 1 ? 22 : 15, {
          fill: i === 1 ? null : col,
          stroke: col,
          width: i === 1 ? 4.8 : 2,
        })
          .at(curPt[0], curPt[1])
          .glow(12, col),
      );
    });

    // Right readout panel: reconstructed matrix & prediction withholding
    const rx = 540;
    nodes.push(
      glassPlate(rx, -10, 620, 700, { stroke: '#3a4f80', glow: 6 }),
      txt(
        p > 0.5 ? 'RECONSTRUCTED  A₁  (RANK 1)' : 'ORIGINAL TABLE  A',
        rx,
        -295,
        26,
        COSMOS.cyan,
        'mono',
      ),
      bracketMatrix(currentRows, {
        cx: rx,
        cy: -105,
        cellW: 165,
        cellH: 88,
        textSize: 38,
        bracketColor: p > 0.5 ? COSMOS.gold : COSMOS.cyan,
        formatCell: (v) => fmt(v, 2),
        cellColor: (r) => (err > 0.2 && r < 2 ? COSMOS.gold : LA.tickets[r]),
      }),
    );

    if (err > 0.05) {
      nodes.push(
        txt('4 ENTRIES MISS BY ±0.5', rx, 85, 30, COSMOS.gold, 'mono')
          .glow(8, COSMOS.gold)
          .opacity(err),
        txt('Router sees [0.5, 0.5] for BOTH', rx, 145, 28, LA.contrast, 'sans').opacity(err),
        txt('Best possible rank-1 error = 1.0', rx, 198, 28, COSMOS.muted, 'sans').opacity(err),
      );
    } else if (ask > 0.05) {
      nodes.push(
        txt('HAND TO THE ROUTER', rx, 95, 26, COSMOS.gold, 'mono').opacity(ask),
        txt('Can it still separate', rx, 155, 36, COSMOS.gold, 'serif')
          .glow(8, COSMOS.gold)
          .opacity(ask * Math.min(1, pulse)),
        txt('slow pages from rollback?', rx, 208, 36, COSMOS.gold, 'serif')
          .glow(8, COSMOS.gold)
          .opacity(ask * Math.min(1, pulse)),
      );
    } else {
      nodes.push(
        txt('Keep 75% of energy (3 of 4)', rx, 115, 30, LA.common, 'sans'),
        txt('Drop 25% of energy (contrast)', rx, 175, 28, LA.contrast, 'sans'),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'discard-contrast', projP, 1, { dur: 1.4 });
  pulseCue(s, c, 'collapsed-route', routeAskP, 1, { dur: 0.45 });
  // Strict prediction withholding (caption_boundary: true)
  cueTo(s, c, 'reconstruction-error', errP, 1, { after: true, dur: 0.75 });
  c.after('reconstruction-error', () => s.add(eqErr));
}

// ---------------------------------------------------------------------------
// 13. retrieval-check: Who gets the second search result?
// Cues: retrieval-ties, break-tie
// ---------------------------------------------------------------------------
export function retrievalCheck(s, c) {
  const tieP = s.value(0);
  const rankP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.48, seed: 13 }));
  s.add(aura(-230, 30, 560, '#5ce1e622', '#ffd16614'));

  const live = dynamic(() => {
    const p = tieP.value;
    const rP = rankP.value;

    const mapVec = (row) => {
      const c0 = dotProduct(row, common);
      const c1 = dotProduct(row, contrast);
      return [
        c0 * common[0] + (1 - p) * c1 * contrast[0],
        c0 * common[1] + (1 - p) * c1 * contrast[1],
      ];
    };
    const qVec = mapVec([1, 0]);
    const tVecs = A.map(mapVec);
    const cosines = tVecs.map(
      (v) => dotProduct(v, qVec) / (Math.hypot(...v) * Math.hypot(...qVec)),
    );

    const plane = vectorPlane2d({
      originX: -410,
      originY: 220,
      scale: 310,
      xRange: [-0.3, 1.5],
      yRange: [-0.3, 1.4],
      xLabel: 'slow pages',
      yLabel: 'rollback',
    });

    const orig = plane.pt(0, 0);
    const nodes = [
      txt('COSINE RETRIEVAL CHECK', -840, -420, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Query: slow pages  [1, 0]', -840, -360, 48, COSMOS.ink, 'serif', 'left'),
      plane.node,
      // Query arrow
      vecArrow(orig, plane.pt(qVec[0], qVec[1]), {
        color: COSMOS.gold,
        width: 7.5,
        tip: 18,
        glow: 14,
      }),
    ];

    // Ticket arrows collapsing together as contrast vanishes
    tVecs.forEach((v, i) => {
      const col = LA.tickets[i];
      const tip = plane.pt(v[0], v[1]);
      nodes.push(
        vecArrow(orig, tip, {
          color: col,
          width: i === 2 ? 5.2 : 4.2,
          tip: 13,
          glow: 9,
          opacity: 0.9,
        }),
        glowDot(tip[0], tip[1], { radius: 9, color: col, glow: 10 }),
      );
    });

    // Right panel: live cosine table + Top-2 Search Results (strictly withheld until break-tie!)
    const rx = 500;
    const names = [
      '#1 Slow pages (relevant)',
      '#2 Rollback (irrelevant)',
      '#3 Both issues (relevant)',
    ];

    nodes.push(
      glassPlate(rx, 20, 680, 740, { stroke: '#3a4f80', glow: 6 }),
      txt('COSINE SIMILARITY TO QUERY', rx, -295, 26, COSMOS.cyan, 'mono'),
    );

    cosines.forEach((score, i) => {
      const yy = -210 + i * 94;
      const col = LA.tickets[i];
      nodes.push(
        txt(names[i], rx - 295, yy, 26, col, 'sans', 'left'),
        txt(fmt(score, 2), rx + 295, yy, 36, p > 0.7 ? COSMOS.gold : col, 'mono', 'right').glow(
          6,
          col,
        ),
      );
    });

    nodes.push(
      markDecor(line([rx - 295, 36], [rx + 295, 36], { stroke: '#2c3d66', width: 1.8 })),
      txt('TOP-2 SEARCH RESULTS', rx, 86, 26, COSMOS.gold, 'mono'),
    );

    if (p < 0.2) {
      nodes.push(
        txt('1. Slow pages   (1.00)', rx - 280, 152, 30, LA.slow, 'mono', 'left'),
        txt('2. Both issues  (0.71)', rx - 280, 212, 30, LA.both, 'mono', 'left'),
        txt('Recall@2 = 2 / 2 = 1.00', rx, 305, 36, LA.fit, 'mono').glow(8, LA.fit),
      );
    } else if (rP < 0.05) {
      const pulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 8);
      nodes.push(
        txt('All three tie at cos = 1.00!', rx, 148, 30, COSMOS.gold, 'mono'),
        txt('Tie-break in ticket order:', rx, 208, 28, COSMOS.muted, 'sans'),
        txt('Which two get returned?', rx, 282, 38, COSMOS.gold, 'serif')
          .glow(10, COSMOS.gold)
          .opacity(pulse),
      );
    } else {
      nodes.push(
        txt('1. Slow pages   (1.00)', rx - 280, 152, 30, LA.slow, 'mono', 'left').opacity(rP),
        txt('2. Rollback     (1.00)  miss', rx - 280, 212, 30, LA.rollback, 'mono', 'left')
          .glow(8, LA.rollback)
          .opacity(rP),
        txt('Recall@2:  1.00 → 0.50  (1/2)', rx, 305, 36, LA.rollback, 'mono')
          .glow(10, LA.rollback)
          .opacity(rP),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'retrieval-ties', tieP, 1, { dur: 1.5 });
  // Strict prediction withholding: reveal slot #2 & Recall@2=0.5 only after break-tie
  cueTo(s, c, 'break-tie', rankP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 14. pca-center: Move the origin to the average ticket
// Cues: centering-rule
// ---------------------------------------------------------------------------
export function pcaCenter(s, c) {
  const shiftP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.48, seed: 14 }));
  s.add(aura(-120, 20, 560, '#ffd16620', '#5ce1e614'));

  const eqCenter = glowTex(
    String.raw`X_{\text{centered}} = X - \mu, \quad \mu = \left[\tfrac{2}{3},\, \tfrac{2}{3}\right]`,
    {
      x: 520,
      y: 175,
      size: 36,
      color: COSMOS.gold,
      glow: 8,
    },
  );

  const live = dynamic(() => {
    const p = shiftP.value;
    const plane = vectorPlane2d({
      originX: -355,
      originY: 95,
      scale: 225,
      xRange: [-1.1, 1.35],
      yRange: [-1.0, 1.35],
      xLabel: '',
      yLabel: '',
    });

    const ptsW = A.map((row) => [row[0] - mean[0] * p, row[1] - mean[1] * p]);
    const ptsS = ptsW.map((pt) => plane.pt(pt[0], pt[1]));
    const meanW = [mean[0] * (1 - p), mean[1] * (1 - p)];
    const meanS = plane.pt(meanW[0], meanW[1]);
    const origS = plane.pt(0, 0);

    const nodes = [
      txt('PRINCIPAL COMPONENT ANALYSIS  ·  STEP 1', -840, -420, 26, COSMOS.gold, 'mono', 'left'),
      txt('Center the cloud on its average', -840, -360, 48, COSMOS.ink, 'serif', 'left'),
      plane.node,
      txt('slow mentions', -355, 368, 26, COSMOS.muted, 'mono'),
      txt('rollback mentions', -355, -248, 26, COSMOS.muted, 'mono'),
      // Rigid glowing triangle translating without distorting!
      markDecor(
        polygon(ptsS, {
          fill: '#5ce1e618',
          stroke: COSMOS.cyan,
          width: 3,
        }).glow(8, COSMOS.cyan),
      ),
    ];

    // Translation arrow from mean to origin
    if (p < 0.92) {
      nodes.push(
        vecArrow(meanS, origS, {
          color: COSMOS.gold,
          width: 4.5,
          tip: 13,
          glow: 8,
          opacity: 1 - p * 0.6,
        }),
      );
    }

    // Yellow centroid cross
    const crossR = 16;
    nodes.push(
      markDecor(
        group(
          line([meanS[0] - crossR, meanS[1]], [meanS[0] + crossR, meanS[1]], {
            stroke: COSMOS.gold,
            width: 4.5,
          }).glow(10, COSMOS.gold),
          line([meanS[0], meanS[1] - crossR], [meanS[0], meanS[1] + crossR], {
            stroke: COSMOS.gold,
            width: 4.5,
          }).glow(10, COSMOS.gold),
        ),
      ),
    );

    ptsS.forEach((pt, i) => {
      const col = LA.tickets[i];
      const pulse = 1 + 0.06 * Math.sin(drift.value * Math.PI * 8 + i * 2);
      nodes.push(
        glowDot(pt[0], pt[1], { radius: 13 * pulse, color: col, glow: 14 }),
        dot(5, '#ffffff').at(pt[0], pt[1]),
      );
    });

    // Right info plate showing exact live translated coordinates
    const rx = 520;
    nodes.push(
      glassPlate(rx, 20, 650, 720, { stroke: COSMOS.gold, glow: 6 }),
      txt('COLUMN AVERAGES  μ = [2/3, 2/3]', rx, -285, 26, COSMOS.gold, 'mono'),
      ...ptsW.map((pt, i) =>
        txt(
          `${LA.ticketNames[i].padEnd(12, ' ')} [${fmt(pt[0], 2)}, ${fmt(pt[1], 2)}]`,
          rx - 270,
          -205 + i * 58,
          28,
          LA.tickets[i],
          'mono',
          'left',
        ),
      ),
      markDecor(line([rx - 265, -20], [rx + 265, -20], { stroke: '#2c3d66', width: 1.6 })),
      txt(
        p > 0.6 ? 'Centroid locked at (0, 0)' : 'Subtract μ from every row',
        rx,
        52,
        34,
        COSMOS.ink,
        'serif',
      ),
      txt('All pairwise distances stay fixed', rx, 278, 28, COSMOS.cyan, 'sans'),
      txt('Each point = deviation from average', rx, 330, 26, COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  s.add(live, eqCenter);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'centering-rule', shiftP, 1, { dur: 1.8 });
}

// ---------------------------------------------------------------------------
// 15. pca-spread: Which direction varies most around the average?
// Cues: common-spread, contrast-spread, paired-products, cross-sum[CB], leading-direction
// ---------------------------------------------------------------------------
export function pcaSpread(s, c) {
  const comP = s.value(0);
  const conP = s.value(0);
  const pairP = s.value(0);
  const zeroP = s.value(0);
  const leadP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.contrast, opacity: 0.48, seed: 15 }));
  s.add(aura(-280, 20, 540, '#ff6b8b22', '#60a5fa18'));

  const centered = A.map((r) => [r[0] - mean[0], r[1] - mean[1]]);
  const comScores = centered.map((r) => dotProduct(r, common)); // [-1/(3sqrt2), -1/(3sqrt2), +2/(3sqrt2)]
  const conScores = centered.map((r) => dotProduct(r, contrast)); // [-1/sqrt2, +1/sqrt2, 0]

  const live = dynamic(() => {
    const pCom = comP.value;
    const pCon = conP.value;
    const pPair = pairP.value;
    const pZero = zeroP.value;
    const pLead = leadP.value;

    const plane = vectorPlane2d({
      originX: -310,
      originY: 45,
      scale: 310,
      xRange: [-1.1, 1.1],
      yRange: [-1.1, 1.1],
      xLabel: 'Δ slow',
      yLabel: 'Δ rollback',
    });

    const angle = Math.PI / 4 + (Math.PI / 2) * pCon;
    const dir = [Math.cos(angle), Math.sin(angle)];
    const rulerCol = pCon > 0.5 ? LA.contrast : LA.common;

    const r0 = plane.pt(-1.05 * dir[0], -1.05 * dir[1]);
    const r1 = plane.pt(1.05 * dir[0], 1.05 * dir[1]);

    const nodes = [
      txt('CENTERED SPREAD  ·  PCA', -840, -420, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Which axis maximizes spread?', -840, -360, 48, COSMOS.ink, 'serif', 'left'),
      plane.node,
      markDecor(line(r0, r1, { stroke: rulerCol, width: 4.2 }).glow(10, rulerCol)),
    ];

    // Centered points & live orthogonal projection drops onto the rotating ruler
    centered.forEach((ptW, i) => {
      const col = LA.tickets[i];
      const pScreen = plane.pt(ptW[0], ptW[1]);
      const sc = dotProduct(ptW, dir);
      const projW = [dir[0] * sc, dir[1] * sc];
      const projS = plane.pt(projW[0], projW[1]);
      const showProj = pCom > 0.05;

      if (showProj) {
        nodes.push(
          markDecor(
            line(pScreen, projS, { stroke: col, width: 2.4, dash: [6, 7] }).opacity(0.65 * pCom),
          ),
          circle(i === 1 ? 18 : 13, { fill: null, stroke: col, width: 3.6 })
            .at(projS[0], projS[1])
            .glow(10, col)
            .opacity(pCom),
        );
      }
      nodes.push(glowDot(pScreen[0], pScreen[1], { radius: 12, color: col, glow: 12 }));
    });

    // Right panel: squared spread comparison + paired cross-term proof
    const rx = 500;
    const maxBarW = 360;
    const comW = Math.max(8, (1 / 3) * maxBarW * pCom);
    const conW = Math.max(8, 1.0 * maxBarW * pCon);

    nodes.push(
      glassPlate(rx, 25, 680, 740, { stroke: pLead > 0.5 ? LA.contrast : '#3a4f80', glow: 8 }),
      txt('SQUARED SPREAD AROUND MEAN', rx, -290, 26, COSMOS.muted, 'mono'),
      // Common spread bar = 1/3
      txt('Common  v₁', rx - 295, -222, 28, LA.common, 'sans', 'left'),
      txt(pCom > 0.4 ? '1/3 ≈ 0.33' : '·', rx + 295, -222, 32, LA.common, 'mono', 'right'),
      rect(comW, 24, { fill: LA.common, stroke: null, radius: 6 })
        .at(rx - 295 + comW / 2, -176)
        .glow(8, LA.common)
        .opacity(pCom),
      // Contrast spread bar = 1.0 (3x bigger!)
      txt('Contrast  v₂', rx - 295, -108, 28, LA.contrast, 'sans', 'left'),
      txt(
        pCon > 0.4 ? '1.00  (3× larger!)' : '·',
        rx + 295,
        -108,
        32,
        LA.contrast,
        'mono',
        'right',
      ),
      rect(conW, 24, { fill: LA.contrast, stroke: null, radius: 6 })
        .at(rx - 295 + conW / 2, -62)
        .glow(10, LA.contrast)
        .opacity(pCon),
      markDecor(line([rx - 295, -4], [rx + 295, -4], { stroke: '#2c3d66', width: 1.8 })),
    );

    if (pPair < 0.05) {
      const pulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 8);
      if (pCon > 0.6) {
        nodes.push(
          txt('Could an angle in between', rx, 95, 36, COSMOS.gold, 'serif')
            .glow(8, COSMOS.gold)
            .opacity(pulse),
          txt('give even more spread?', rx, 150, 36, COSMOS.gold, 'serif')
            .glow(8, COSMOS.gold)
            .opacity(pulse),
        );
      } else {
        nodes.push(
          txt('Single-issue tickets collide on common', rx, 100, 28, COSMOS.muted, 'sans'),
          txt('and separate cleanly on contrast', rx, 150, 28, LA.contrast, 'sans'),
        );
      }
    } else {
      // Beat 1: Paired score products -> cross-sum = 0 -> contrast wins 3x!
      const crossTerms = ['+1/6', '−1/6', '0'];
      nodes.push(
        txt('PAIRED SCORE PRODUCTS  (c₁ · c₂)', rx, 48, 26, COSMOS.gold, 'mono').opacity(pPair),
        ...crossTerms.map((term, i) =>
          txt(
            `${LA.ticketNames[i]}:   ${term}`,
            rx - 260,
            106 + i * 50,
            28,
            LA.tickets[i],
            'mono',
            'left',
          ).opacity(pPair),
        ),
      );

      if (pZero > 0.05) {
        nodes.push(
          txt('Sum = +1/6 − 1/6 + 0 = 0', rx, 268, 32, COSMOS.gold, 'mono')
            .glow(8, COSMOS.gold)
            .opacity(pZero),
        );
      }
      if (pLead > 0.05) {
        nodes.push(
          txt('PC1 = Contrast  (75% of variance)', rx, 336, 34, LA.contrast, 'serif')
            .glow(10, LA.contrast)
            .opacity(pLead),
        );
      }
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'common-spread', comP, 1, { dur: 1.0 });
  cueTo(s, c, 'contrast-spread', conP, 1, { dur: 1.2 });
  cueTo(s, c, 'paired-products', pairP, 1, { dur: 0.9 });
  // Strict withholding on caption_boundary cue cross-sum & leading-direction
  cueTo(s, c, 'cross-sum', zeroP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'leading-direction', leadP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 16. pca-new: A new ticket uses the fitted coordinate system
// Cues: new-mentions, center-new-row, read-new-score
// ---------------------------------------------------------------------------
export function pcaNew(s, c) {
  const newP = s.value(0);
  const centerP = s.value(0);
  const readP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.contrast, opacity: 0.48, seed: 16 }));
  s.add(aura(-200, 30, 560, '#ffd16622', '#ff6b8b16'));

  const slowOrig = [1, 0];
  const slowCent = [1 - mean[0], 0 - mean[1]]; // [1/3, -2/3]
  const newOrig = [2, 1];
  const newCent = [2 - mean[0], 1 - mean[1]]; // [4/3, 1/3]
  const sharedScore = dotProduct(newCent, contrast); // -1/sqrt(2)
  const sharedProj = contrast.map((v) => v * sharedScore); // [0.5, -0.5]

  const live = dynamic(() => {
    const pN = newP.value;
    const pC = centerP.value;
    const pR = readP.value;

    const plane = vectorPlane2d({
      originX: -430,
      originY: 165,
      scale: 185,
      xRange: [-1.0, 2.2],
      yRange: [-1.0, 1.4],
      xLabel: '',
      yLabel: '',
    });

    // Pink fitted contrast ruler through origin
    const c0 = plane.pt(-1.05 * contrast[0], -1.05 * contrast[1]);
    const c1 = plane.pt(1.05 * contrast[0], 1.05 * contrast[1]);

    const slowCurW = [slowOrig[0] - mean[0] * pC, slowOrig[1] - mean[1] * pC];
    const newCurW = [newOrig[0] - mean[0] * pC, newOrig[1] - mean[1] * pC];
    const slowCurS = plane.pt(slowCurW[0], slowCurW[1]);
    const newCurS = plane.pt(newCurW[0], newCurW[1]);
    const projS = plane.pt(sharedProj[0], sharedProj[1]);

    const nodes = [
      txt('PROJECTING UNSEEN DATA', -840, -420, 26, COSMOS.gold, 'mono', 'left'),
      txt('Apply the saved training mean & basis', -840, -360, 46, COSMOS.ink, 'serif', 'left'),
      plane.node,
      txt('slow mentions', -430, 398, 26, COSMOS.muted, 'mono'),
      txt('rollback mentions', -620, -145, 26, COSMOS.muted, 'mono', 'left'),
      markDecor(line(c0, c1, { stroke: LA.contrast, width: 4.2 }).glow(10, LA.contrast)),
      // Training slow-only ticket
      glowDot(slowCurS[0], slowCurS[1], { radius: 13, color: LA.slow, glow: 12 }),
    ];

    // New incoming ticket [2, 1]
    if (pN > 0.02) {
      nodes.push(
        glowDot(newCurS[0], newCurS[1], { radius: 14, color: COSMOS.gold, glow: 14 }).opacity(pN),
        dot(5, '#ffffff').at(newCurS[0], newCurS[1]).opacity(pN),
      );
    }

    // Projection beams onto pink contrast line strictly on read-new-score!
    if (pR > 0.02) {
      const slowEnd = [
        slowCurS[0] + (projS[0] - slowCurS[0]) * pR,
        slowCurS[1] + (projS[1] - slowCurS[1]) * pR,
      ];
      const newEnd = [
        newCurS[0] + (projS[0] - newCurS[0]) * pR,
        newCurS[1] + (projS[1] - newCurS[1]) * pR,
      ];
      nodes.push(
        markDecor(line(slowCurS, slowEnd, { stroke: LA.slow, width: 3, dash: [7, 7] })),
        markDecor(line(newCurS, newEnd, { stroke: COSMOS.gold, width: 3, dash: [7, 7] })),
        glowDot(slowEnd[0], slowEnd[1], { radius: 12, color: LA.slow, glow: 12 }),
        circle(20, { fill: null, stroke: COSMOS.gold, width: 4.6 })
          .at(newEnd[0], newEnd[1])
          .glow(12, COSMOS.gold),
      );
    }

    // Right panel (holds exact live coordinates cleanly with zero overlap!)
    const rx = 530;
    const pulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 8);
    nodes.push(
      glassPlate(rx, 25, 620, 720, { stroke: LA.contrast, glow: 6 }),
      txt('FROZEN TRAINING STATS  (μ = [⅔, ⅔])', rx, -280, 26, COSMOS.cyan, 'mono'),
      txt(
        `Slow ticket:  [${fmt(slowCurW[0], 2)}, ${fmt(slowCurW[1], 2)}]`,
        rx - 260,
        -208,
        28,
        LA.slow,
        'mono',
        'left',
      ),
      pN > 0.05
        ? txt(
            `New ticket:   [${fmt(newCurW[0], 2)}, ${fmt(newCurW[1], 2)}]`,
            rx - 260,
            -146,
            28,
            COSMOS.gold,
            'mono',
            'left',
          ).opacity(pN)
        : txt('New ticket arriving...', rx - 260, -146, 28, COSMOS.muted, 'sans', 'left'),
      markDecor(line([rx - 255, -88], [rx + 255, -88], { stroke: '#2c3d66', width: 1.6 })),
    );

    if (pR < 0.05) {
      nodes.push(
        txt('New row: [2, 1] = [1, 0] + [1, 1]', rx, -16, 26, COSMOS.ink, 'mono'),
        txt('Both counts rose by +1', rx, 44, 28, COSMOS.muted, 'sans'),
        pC > 0.4
          ? txt('Where does it land on pink?', rx, 155, 36, COSMOS.gold, 'serif')
              .glow(8, COSMOS.gold)
              .opacity(pulse)
          : txt('Subtract training mean μ first', rx, 155, 28, COSMOS.gold, 'sans'),
      );
    } else {
      nodes.push(
        txt('BOTH LAND ON THE SAME MARK', rx, -16, 26, LA.contrast, 'mono').opacity(pR),
        txt('−1/√2 ≈ −0.707', rx, 62, 46, COSMOS.gold, 'mono').glow(10, COSMOS.gold).opacity(pR),
        txt('Adding [1, 1] is ⊥ to contrast', rx, 158, 28, COSMOS.ink, 'sans').opacity(pR),
        txt('Score = (x_new − μ) · v₂', rx, 232, 30, LA.contrast, 'mono').opacity(pR),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'new-mentions', newP, 1, { dur: 0.8 });
  cueTo(s, c, 'center-new-row', centerP, 1, { dur: 1.2 });
  // Strict withholding during beat 0 hold
  cueTo(s, c, 'read-new-score', readP, 1, { after: true, dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 17. pca-sparse: Centering changes the storage story, too
// Cues: sparse-center
// ---------------------------------------------------------------------------
export function pcaSparse(s, c) {
  const fillP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.contrast, opacity: 0.48, seed: 17 }));
  s.add(aura(-420, 0, 480, '#5ce1e61e', '#07091000'));
  s.add(aura(420, 0, 480, '#ff6b8b24', '#07091000'));

  const live = dynamic(() => {
    const p = fillP.value;
    const cell = 72;
    const gap = 8;
    const pitch = cell + gap;
    const n = 6;
    const gridSpan = (n - 1) * pitch;

    const drawGrid = (cx, cy, centered) => {
      const cells = [];
      for (let r = 0; r < n; r++) {
        for (let col = 0; col < n; col++) {
          const px = cx - gridSpan / 2 + col * pitch;
          const py = cy - gridSpan / 2 + r * pitch;
          const isDiag = r === col;
          const filled = centered && !isDiag && p > 0.05;
          const fillCol = isDiag ? COSMOS.cyan : filled ? LA.contrast : '#11182c';
          const op = isDiag ? 0.9 : filled ? 0.12 + 0.72 * p : 0.7;
          cells.push(
            rect(cell, cell, {
              fill: fillCol,
              stroke: isDiag ? COSMOS.cyan : filled ? LA.contrast : '#2c3d66',
              width: isDiag ? 2.4 : 1.4,
              radius: 8,
            })
              .at(px, py)
              .opacity(op),
            txt(
              isDiag ? (centered && p > 0.5 ? '+.83' : '1') : filled && p > 0.45 ? '−.17' : '0',
              px,
              py,
              26,
              isDiag ? '#070910' : filled && p > 0.45 ? COSMOS.ink : COSMOS.dim,
              'mono',
            ),
          );
        }
      }
      return group(...cells);
    };

    const nonzeros = p > 0.15 ? 6 + Math.round(30 * p) : 6;
    const densityPct = Math.round((nonzeros / 36) * 100);

    return group(
      txt('SPARSE STORAGE COST', -840, -420, 26, LA.contrast, 'mono', 'left'),
      txt('Explicit centering fills every zero', -840, -360, 48, COSMOS.ink, 'serif', 'left'),
      // Left: Original sparse 6x6
      txt('ORIGINAL SPARSE TABLE  X', -460, -268, 28, COSMOS.cyan, 'mono'),
      drawGrid(-460, 25, false),
      txt('6 / 36 nonzeros  (17% dense)', -460, 322, 30, COSMOS.cyan, 'mono'),
      // Right: Explicitly centered X - mu
      txt('EXPLICITLY CENTERED  X − μ', 460, -268, 28, LA.contrast, 'mono'),
      drawGrid(460, 25, true),
      txt(
        `${nonzeros} / 36 nonzeros  (${densityPct}% dense)`,
        460,
        322,
        30,
        p > 0.4 ? LA.contrast : COSMOS.muted,
        'mono',
      ).glow(p > 0.4 ? 8 : 0, LA.contrast),
      // Photon bridge between left and right
      photonWire(
        [
          [-180, 25],
          [180, 25],
        ],
        drift.value * 3,
        { color: LA.contrast, width: 3.4, glow: 10 },
      ),
      txt('− μ', 0, -24, 36, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
      txt(
        'Use implicit sparse PCA or uncentered TruncatedSVD on large sparse tables',
        0,
        408,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'sparse-center', fillP, 1, { dur: 1.8 });
}
