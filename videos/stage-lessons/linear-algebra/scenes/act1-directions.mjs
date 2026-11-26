// Act 1: Flag-Count Collision, 2D Ticket Coordinates, Orthonormal Basis & Projection,
// Common Output Strength, and Contrast Output Strength.
import { Node, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  A,
  COSMOS,
  LA,
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
  numberRuler,
  photonWire,
  polyPath,
  pulseCue,
  rightAngle,
  strengths,
  txt,
  vecArrow,
  vectorPlane2d,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Can a flag count tell these tickets apart?
// Cues: ticket-first, opening-question, count-flags[CB], file-opening-notes
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const firstP = s.value(0);
  const askP = s.value(0);
  const collideP = s.value(0);
  const fileP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.blue, opacity: 0.52, seed: 1 }));
  s.add(aura(-420, -140, 480, '#60a5fa26', '#18274a0c'));
  s.add(aura(420, 140, 480, '#ff6b8b24', '#26183a0c'));

  const live = dynamic(() => {
    const p1 = firstP.value;
    const pQ = askP.value;
    const pC = collideP.value;
    const pF = fileP.value;
    const pulse = 1 + 0.08 * Math.sin(drift.value * Math.PI * 8);

    const ruler = numberRuler({
      cx: 0,
      cy: 12,
      width: 1240,
      min: 0,
      max: 2,
      ticks: [0, 1, 2],
      caption: '',
    });
    const xOne = ruler.mapX(1);

    // Blue slow-page dot starts cleanly below the blue ticket plate and glides onto 1
    const blueStartX = -460;
    const blueStartY = -92;
    const blueDotX = blueStartX + (xOne - blueStartX) * p1;
    const blueDotY = blueStartY + (12 - blueStartY) * p1;
    const cardAlpha = Math.max(0.18, 1 - 0.82 * pF);

    const nodes = [
      txt('SUPPORT DESK ROUTER', -840, -420, 26, COSMOS.cyan, 'mono', 'left'),
      txt('One saved number per ticket', -840, -360, 50, COSMOS.ink, 'serif', 'left'),
      ruler.node,
      txt('Total active flags saved by the router', -620, 118, 26, COSMOS.muted, 'sans', 'left'),
      // Blue slow-page ticket indicator (well above dot start)
      group(
        glassPlate(-460, -225, 540, 128, { stroke: LA.slow, glow: 8 }),
        txt('Page stuck loading', -695, -248, 34, LA.slow, 'serif', 'left'),
        txt('slow = 1   ·   rollback = 0', -695, -192, 26, COSMOS.muted, 'mono', 'left'),
      ).opacity(cardAlpha),
      // Trailing glowing tether from ticket 1 to count ruler
      p1 > 0.05 && pF < 0.7
        ? markDecor(
            line([blueStartX, -155], [blueDotX, blueDotY], {
              stroke: LA.slow,
              width: 2.2,
              dash: [8, 10],
            }).opacity(0.45 * (1 - pF)),
          )
        : group(),
      glowDot(blueDotX, blueDotY, { radius: 15 * pulse, color: LA.slow, glow: 16 }),
      dot(6, '#ffffff').at(blueDotX, blueDotY),
    ];

    // Pink rollback ticket enters on opening-question, ring waits cleanly above the pink plate!
    if (pQ > 0.02) {
      const pinkBaseX = 460;
      const pinkBaseY = 146;
      const pinkRingX = pinkBaseX + (xOne - pinkBaseX) * pC;
      const pinkRingY = pinkBaseY + (12 - pinkBaseY) * pC;

      nodes.push(
        group(
          glassPlate(460, 280, 540, 128, { stroke: LA.rollback, glow: 8 }),
          txt('Rollback request', 225, 256, 34, LA.rollback, 'serif', 'left'),
          txt('slow = 0   ·   rollback = 1', 225, 312, 26, COSMOS.muted, 'mono', 'left'),
        ).opacity(pQ * cardAlpha),
      );

      if (pC > 0.02 && pF < 0.7) {
        nodes.push(
          markDecor(
            line([pinkBaseX, 212], [pinkRingX, pinkRingY], {
              stroke: LA.rollback,
              width: 2.2,
              dash: [8, 10],
            }).opacity(0.45 * (1 - pF)),
          ),
        );
      }

      // Pink ring lands right around blue dot at 1 on count-flags
      nodes.push(
        circle(25, { fill: null, stroke: LA.rollback, width: 5.5 })
          .at(pinkRingX, pinkRingY)
          .glow(14, LA.rollback)
          .opacity(pQ),
      );

      // Question prompt while waiting (strictly withheld until count-flags completes)
      if (pC < 0.05) {
        nodes.push(
          txt('Where does the pink ring land?', 460, -220, 36, COSMOS.gold, 'serif')
            .glow(8, COSMOS.gold)
            .opacity(pQ),
        );
      }
    }

    // Collision badge appears ONLY after count-flags reveals the answer
    if (pC > 0.7) {
      const a = Math.min(1, (pC - 0.7) / 0.3);
      nodes.push(
        txt('COLLISION AT COUNT = 1', 460, -220, 32, COSMOS.gold, 'mono')
          .glow(10, COSMOS.gold)
          .opacity(a),
        txt(
          pF > 0.4
            ? 'Router sees 1 for both tickets: different teams, same score'
            : 'Both tickets sum to 1',
          0,
          412,
          32,
          COSMOS.ink,
          'sans',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'ticket-first', firstP, 1, { dur: 0.75 });
  cueTo(s, c, 'opening-question', askP, 1, { dur: 0.6 });
  // Strict prediction withholding (caption_boundary: true): ring lands only after phrase completes
  cueTo(s, c, 'count-flags', collideP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'file-opening-notes', fileP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 2. tickets: Give the tickets two coordinates
// Cues: ticket-coordinates
// ---------------------------------------------------------------------------
export function tickets(s, c) {
  const plotP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.5, seed: 2 }));
  s.add(aura(260, 0, 560, '#5ce1e622', '#1722420a'));

  const live = dynamic(() => {
    const p = plotP.value;
    const plane = vectorPlane2d({
      originX: 80,
      originY: 220,
      scale: 310,
      xRange: [-0.4, 1.65],
      yRange: [-0.35, 1.45],
      xLabel: 'slow pages',
      yLabel: 'rollback',
    });

    const nodes = [
      txt('FEATURE MATRIX  A', -535, -390, 26, COSMOS.cyan, 'mono'),
      bracketMatrix(A, {
        cx: -535,
        cy: -90,
        cellW: 112,
        cellH: 88,
        textSize: 40,
        bracketColor: COSMOS.cyan,
        cellColor: (r) => LA.tickets[r],
      }),
      txt('slow', -591, -245, 26, LA.slow, 'mono'),
      txt('rollback', -479, -245, 26, LA.rollback, 'mono'),
      plane.node,
    ];

    // Row labels cleanly left of the matrix + animated flight onto the 2D plane
    const rowNames = ['Slow only', 'Rollback', 'Both'];
    const labelOffsets = [
      [0, 56],
      [-32, -32],
      [28, 34],
    ];

    A.forEach((row, i) => {
      const col = LA.tickets[i];
      const startX = -385;
      const startY = -178 + i * 88;
      const [tx, ty] = plane.pt(row[0], row[1]);
      const px = startX + (tx - startX) * p;
      const py = startY + (ty - startY) * p;

      nodes.push(
        txt(rowNames[i], -690, startY, 26, col, 'sans', 'right'),
        p > 0.04 && p < 0.96
          ? photonWire(
              [
                [startX, startY],
                [tx, ty],
              ],
              p,
              { color: col, width: 2.6, glow: 8 },
            )
          : group(),
      );

      if (p > 0.05) {
        const pulse = 1 + 0.07 * Math.sin(drift.value * Math.PI * 8 + i * 2);
        nodes.push(
          glowDot(px, py, { radius: 14 * pulse, color: col, glow: 14 }).opacity(Math.min(1, p * 2)),
          dot(5, '#ffffff')
            .at(px, py)
            .opacity(Math.min(1, p * 2)),
        );
      }

      if (p > 0.65) {
        const a = Math.min(1, (p - 0.65) / 0.35);
        const [ox, oy] = labelOffsets[i];
        nodes.push(
          txt(
            `[${row[0]}, ${row[1]}]`,
            tx + ox,
            ty + oy,
            30,
            col,
            'mono',
            i === 1 ? 'right' : i === 2 ? 'left' : 'center',
          )
            .glow(5, col)
            .opacity(a),
        );
      }
    });

    // Diagonal ruler sweeping across all three once plotted
    if (p > 0.78) {
      const a = Math.min(1, (p - 0.78) / 0.22);
      const r0 = plane.pt(-0.25, -0.25);
      const r1 = plane.pt(1.22, 1.22);
      nodes.push(
        markDecor(
          line(r0, r1, { stroke: COSMOS.gold, width: 3.4, dash: [12, 10] })
            .glow(10, COSMOS.gold)
            .opacity(0.85 * a),
        ),
        txt('One plane holds all three tickets', -640, 210, 30, COSMOS.ink, 'serif').opacity(a),
        txt('Now a ruler can sweep any angle', -640, 262, 26, COSMOS.gold, 'sans').opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'ticket-coordinates', plotP, 1, { dur: 1.5 });
}

// ---------------------------------------------------------------------------
// 3. basis: Build a point from two directions
// Cues: unit-directions, common-component, contrast-component, projection-residual
// ---------------------------------------------------------------------------
export function basis(s, c) {
  const normP = s.value(0);
  const comp1P = s.value(0);
  const comp2P = s.value(0);
  const dropP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.blue, opacity: 0.48, seed: 3 }));
  s.add(aura(-120, 40, 560, '#60a5fa20', '#ff6b8b12'));

  const xVec = [3, 1];
  const cCommon = dotProduct(xVec, common); // 2 * sqrt(2)
  const cContrast = dotProduct(xVec, contrast); // -sqrt(2)
  const projCommon = common.map((v) => v * cCommon); // [2, 2]
  const partContrast = contrast.map((v) => v * cContrast); // [1, -1]

  const live = dynamic(() => {
    const uP = normP.value;
    const p1 = comp1P.value;
    const p2 = comp2P.value;
    const pD = dropP.value;

    const plane = vectorPlane2d({
      originX: -410,
      originY: 225,
      scale: 155,
      xRange: [-1.4, 3.6],
      yRange: [-0.8, 2.9],
      xLabel: 'slow mentions',
      yLabel: 'rollback mentions',
      unitCircle: true,
      circleColor: COSMOS.gold,
    });

    const orig = plane.pt(0, 0);
    // Shrink [1,1] -> common and [-1,1] -> contrast
    const scaleFactor = 1 + (Math.SQRT1_2 - 1) * uP;
    const v1Tip = plane.pt(scaleFactor, scaleFactor);
    const v2Tip = plane.pt(-scaleFactor, scaleFactor);

    // Line spanning the common direction
    const spanA = plane.pt(-0.7, -0.7);
    const spanB = plane.pt(2.75, 2.75);

    const nodes = [
      plane.node,
      markDecor(
        line(spanA, spanB, { stroke: LA.common, width: 2.2, dash: [10, 10] }).opacity(0.42),
      ),
      vecArrow(orig, v1Tip, { color: LA.common, width: 5.5, glow: 10 }),
      vecArrow(orig, v2Tip, { color: LA.contrast, width: 5.5, glow: 10 }),
      // Right angle between v1 and v2
      markDecor(rightAngle(orig, v1Tip, v2Tip, { size: 22, stroke: COSMOS.gold, width: 2.4 })),
      txt(uP > 0.5 ? 'v₁' : '[1, 1]', -178, 148, 26, LA.common, 'mono', 'center'),
      txt(uP > 0.5 ? 'v₂' : '[−1, 1]', -592, -22, 28, LA.contrast, 'mono', 'right'),
    ];

    // Ticket x = [3, 1] and head-to-tail construction
    if (p1 > 0.02) {
      const tip1 = plane.pt(projCommon[0] * p1, projCommon[1] * p1);
      const xPt = plane.pt(xVec[0], xVec[1]);
      nodes.push(
        glowDot(xPt[0], xPt[1], { radius: 11, color: COSMOS.gold, glow: 12 }),
        txt('x = [3, 1]', xPt[0] + 22, xPt[1] - 28, 28, COSMOS.gold, 'mono', 'left'),
        vecArrow(orig, tip1, { color: LA.common, width: 6.5, tip: 16, glow: 12 }),
      );

      if (p2 > 0.02) {
        const projPt = plane.pt(projCommon[0], projCommon[1]);
        const curTip = plane.pt(
          projCommon[0] + partContrast[0] * p2 * (1 - pD),
          projCommon[1] + partContrast[1] * p2 * (1 - pD),
        );
        // Show pink contrast arrow while building, then let it fall away into dashed residual
        if (1 - pD > 0.04) {
          nodes.push(
            vecArrow(projPt, curTip, {
              color: LA.contrast,
              width: 6,
              tip: 15,
              glow: 10,
              opacity: 1 - pD,
            }),
          );
        }
        if (pD > 0.15) {
          nodes.push(
            markDecor(
              line(projPt, xPt, {
                stroke: LA.contrast,
                width: 3,
                dash: [9, 8],
              })
                .glow(6, LA.contrast)
                .opacity(pD),
            ),
            markDecor(
              rightAngle(projPt, orig, xPt, { size: 26, stroke: COSMOS.gold, width: 3 }).opacity(
                pD,
              ),
            ),
            glowDot(projPt[0], projPt[1], { radius: 14, color: COSMOS.emerald, glow: 16 }).opacity(
              pD,
            ),
            txt(
              'proj = [2, 2]',
              projPt[0] - 26,
              projPt[1] - 42,
              30,
              COSMOS.emerald,
              'mono',
              'right',
            )
              .glow(6, COSMOS.emerald)
              .opacity(pD),
          );
        }
      }
    }

    // Right floating readout column (zero clutter, strictly current state)
    const rx = 620;
    nodes.push(
      glassPlate(rx, -40, 490, 560, { stroke: '#3a4f80', glow: 6 }),
      txt('ORTHONORMAL BASIS', rx, -268, 26, COSMOS.cyan, 'mono'),
      txt('v₁ · v₂ = 0', rx, -210, 36, COSMOS.gold, 'mono'),
      txt(uP > 0.5 ? '‖v₁‖ = ‖v₂‖ = 1' : 'Normalize to length 1', rx, -154, 30, COSMOS.ink, 'mono'),
      markDecor(line([rx - 195, -106], [rx + 195, -106], { stroke: '#2c3d66', width: 1.6 })),
    );

    if (pD > 0.4) {
      nodes.push(
        txt('ORTHOGONAL PROJECTION', rx, -52, 26, COSMOS.emerald, 'mono'),
        txt('[3, 1] → [2, 2]', rx, 14, 40, COSMOS.emerald, 'mono').glow(8, COSMOS.emerald),
        txt('Residual [1, −1] ⊥ v₁', rx, 84, 30, LA.contrast, 'mono'),
        txt('Nearest point on blue line', rx, 154, 28, COSMOS.muted, 'sans'),
      );
    } else if (p2 > 0.4) {
      nodes.push(
        txt('DECOMPOSE  x = [3, 1]', rx, -52, 26, COSMOS.muted, 'mono'),
        txt('Common:   [2, 2]', rx, 12, 32, LA.common, 'mono'),
        txt('Contrast:  [1, −1]', rx, 68, 32, LA.contrast, 'mono'),
        txt('Drop pink: where does it land?', rx, 152, 28, COSMOS.gold, 'serif').glow(
          6,
          COSMOS.gold,
        ),
      );
    } else if (p1 > 0.1) {
      nodes.push(
        txt('COMMON CONTRIBUTION', rx, -52, 26, LA.common, 'mono'),
        txt('x · v₁ = 2√2', rx, 14, 36, LA.common, 'mono'),
        txt('(x · v₁) v₁ = [2, 2]', rx, 82, 32, COSMOS.ink, 'mono'),
      );
    } else {
      const pulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 6);
      nodes.push(
        txt('Two perpendicular unit arrows', rx, -46, 28, COSMOS.muted, 'sans'),
        txt('span every point in R²', rx, 8, 28, COSMOS.ink, 'sans'),
        txt('Unit circle radius = 1', rx, 94, 28, COSMOS.gold, 'mono').opacity(pulse),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'unit-directions', normP, 1, { dur: 0.9 });
  cueTo(s, c, 'common-component', comp1P, 1, { dur: 0.8 });
  cueTo(s, c, 'contrast-component', comp2P, 1, { dur: 0.8 });
  // Strictly after beat 1 hold: projection lands only when "Let the pink part fall away" completes
  cueTo(s, c, 'projection-residual', dropP, 1, { after: true, dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 4. common-output: Measure what one direction produces
// Cues: common-scores, common-energy
// ---------------------------------------------------------------------------
export function commonOutput(s, c) {
  const scoreP = s.value(0);
  const energyP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.common, opacity: 0.48, seed: 4 }));
  s.add(aura(320, -20, 560, '#60a5fa24', '#ffd16614'));

  const commonScores = A.map((row) => dotProduct(row, common)); // [1/sqrt2, 1/sqrt2, 2/sqrt2]
  const commonSq = commonScores.map((v) => v * v); // [0.5, 0.5, 2.0]

  const eqEnergy = glowTex(String.raw`\|A v_1\|^2 = \tfrac{1}{2} + \tfrac{1}{2} + 2 = 3`, {
    x: 350,
    y: 365,
    size: 42,
    color: COSMOS.gold,
    glow: 8,
  });

  const live = dynamic(() => {
    const sP = scoreP.value;
    const eP = energyP.value;

    const nodes = [
      txt('COMMON DIRECTION  v₁ = [1, 1]/√2', -480, -395, 28, LA.common, 'mono'),
      bracketMatrix(A, {
        cx: -610,
        cy: -90,
        cellW: 110,
        cellH: 96,
        textSize: 40,
        bracketColor: COSMOS.cyan,
        cellColor: (r) => LA.tickets[r],
      }),
      txt('×', -425, -90, 44, COSMOS.muted, 'mono'),
      bracketMatrix([['1/√2'], ['1/√2']], {
        cx: -265,
        cy: -90,
        cellW: 140,
        cellH: 96,
        textSize: 34,
        bracketColor: LA.common,
        cellColor: () => LA.common,
      }),
      txt('A v₁  dot-product scores', 350, -395, 30, COSMOS.ink, 'serif'),
    ];

    const barLeft = 58;
    const barScale = 295;
    const labelsText = ['Slow only', 'Rollback', 'Both'];
    const exactLabels = ['1/√2', '1/√2', '2/√2'];
    const sqLabels = ['0.5', '0.5', '2.0'];

    commonScores.forEach((sc, i) => {
      const y = -230 + i * 140;
      const col = LA.tickets[i];
      const itemP = Math.max(0, Math.min(1, sP * 3 - i * 0.72));
      const w = Math.max(6, sc * barScale * itemP);

      nodes.push(
        txt(labelsText[i], 32, y, 28, col, 'sans', 'right'),
        markDecor(line([barLeft, y - 36], [barLeft, y + 36], { stroke: '#4d618f', width: 2.4 })),
      );

      if (itemP > 0.02) {
        nodes.push(
          rect(w, 42, { fill: col, stroke: null, radius: 8 })
            .at(barLeft + w / 2, y)
            .glow(8, col)
            .opacity(0.9),
          txt(
            `${exactLabels[i]}  (${fmt(sc, 3)})`,
            barLeft + w + 20,
            y,
            28,
            col,
            'mono',
            'left',
          ).opacity(itemP),
        );
      }

      // Photon beam from matrix vector toward score labels (stops cleanly before label text)
      if (itemP > 0.05 && itemP < 0.95) {
        nodes.push(
          photonWire(
            [
              [-180, -186 + i * 96],
              [-118, y],
            ],
            itemP,
            { color: col, width: 2.8, glow: 8 },
          ),
        );
      }

      // Squared energy bar below each score on common-energy
      if (eP > 0.02) {
        const sqP = Math.max(0, Math.min(1, eP * 2.2 - i * 0.35));
        const sqW = Math.max(6, commonSq[i] * 210 * sqP);
        nodes.push(
          rect(sqW, 20, { fill: COSMOS.gold, stroke: null, radius: 6 })
            .at(barLeft + sqW / 2, y + 48)
            .glow(8, COSMOS.gold)
            .opacity(0.92 * sqP),
          txt(
            `score² = ${sqLabels[i]}`,
            barLeft + sqW + 18,
            y + 48,
            26,
            COSMOS.gold,
            'mono',
            'left',
          ).opacity(sqP),
        );
      }
    });

    // Bottom stacked squared energy bar (0.5 + 0.5 + 2.0 = 3.0)
    if (eP > 0.2) {
      const a = Math.min(1, (eP - 0.2) / 0.5);
      const stripLeft = -760;
      const stripY = 235;
      const unitW = 220;
      let cursor = stripLeft;
      commonSq.forEach((sq, i) => {
        const segW = sq * unitW * a;
        nodes.push(
          rect(segW - 4, 46, {
            fill: LA.tickets[i],
            stroke: COSMOS.gold,
            width: i === 2 ? 2.6 : 1.2,
            radius: 7,
          })
            .at(cursor + segW / 2, stripY)
            .glow(i === 2 ? 12 : 6, LA.tickets[i])
            .opacity(0.88),
        );
        cursor += segW;
      });
      const pulse = 1 + 0.06 * Math.sin(drift.value * Math.PI * 8);
      nodes.push(
        txt('SQUARED LENGTH ACCUMULATED', stripLeft, stripY - 62, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          `Total = ${fmt(3 * a, 1)}   (joint ticket supplies 2 of 3)`,
          stripLeft,
          stripY + 66,
          28,
          COSMOS.gold,
          'sans',
          'left',
        ).opacity(a),
        txt(`‖Av₁‖ = √3 ≈ ${fmt(strengths[0], 3)}`, -480, 365, 36, LA.common, 'mono')
          .glow(8, LA.common)
          .opacity(a * Math.min(1, pulse)),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'common-scores', scoreP, 1, { dur: 1.4 });
  cueTo(s, c, 'common-energy', energyP, 1, { dur: 1.3 });
  c.show('common-energy', eqEnergy);
}

// ---------------------------------------------------------------------------
// 5. contrast-output: Apply the contrast direction
// Cues: contrast-scores, rollback-score, contrast-joint[CB], contrast-length[CB]
// ---------------------------------------------------------------------------
export function contrastOutput(s, c) {
  const slowP = s.value(0);
  const rollP = s.value(0);
  const jointP = s.value(0);
  const lenP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.contrast, opacity: 0.48, seed: 5 }));
  s.add(aura(240, -10, 560, '#ff6b8b22', '#6ee7b712'));

  const contrastScores = A.map((row) => dotProduct(row, contrast)); // [-1/sqrt2, +1/sqrt2, 0]

  const live = dynamic(() => {
    const pSlow = slowP.value;
    const pRoll = rollP.value;
    const pJoint = jointP.value;
    const pLen = lenP.value;

    const zeroX = 345;
    const scaleX = 325;

    const nodes = [
      txt('CONTRAST DIRECTION  v₂ = [−1, 1]/√2', -520, -395, 28, LA.contrast, 'mono'),
      bracketMatrix(A, {
        cx: -660,
        cy: -90,
        cellW: 106,
        cellH: 96,
        textSize: 40,
        bracketColor: COSMOS.cyan,
        cellColor: (r) => LA.tickets[r],
      }),
      txt('×', -490, -90, 44, COSMOS.muted, 'mono'),
      bracketMatrix([['−1/√2'], ['+1/√2']], {
        cx: -340,
        cy: -90,
        cellW: 146,
        cellH: 96,
        textSize: 32,
        bracketColor: LA.contrast,
        cellColor: () => LA.contrast,
      }),
      // Zero reference spine for signed bars
      markDecor(line([zeroX, -320], [zeroX, 145], { stroke: '#6c81b3', width: 3 })),
      txt('0', zeroX, -352, 28, COSMOS.ink, 'mono'),
      txt('−1/√2', zeroX - Math.SQRT1_2 * scaleX, -352, 26, LA.slow, 'mono'),
      txt('+1/√2', zeroX + Math.SQRT1_2 * scaleX, -352, 26, LA.rollback, 'mono'),
    ];

    // Row 0: Slow-only scores -1/sqrt(2)
    const y0 = -230;
    nodes.push(txt('Slow only', -70, y0, 28, LA.slow, 'sans', 'right'));
    if (pSlow > 0.02) {
      const w0 = Math.abs(contrastScores[0]) * scaleX * pSlow;
      nodes.push(
        rect(w0, 44, { fill: LA.slow, stroke: null, radius: 8 })
          .at(zeroX - w0 / 2, y0)
          .glow(8, LA.slow),
        txt('−0.707', zeroX - w0 - 18, y0, 28, LA.slow, 'mono', 'right').opacity(pSlow),
      );
    }

    // Row 1: Rollback-only scores +1/sqrt(2)
    const y1 = -90;
    nodes.push(txt('Rollback', -70, y1, 28, LA.rollback, 'sans', 'right'));
    if (pRoll > 0.02) {
      const w1 = Math.abs(contrastScores[1]) * scaleX * pRoll;
      nodes.push(
        rect(w1, 44, { fill: LA.rollback, stroke: null, radius: 8 })
          .at(zeroX + w1 / 2, y1)
          .glow(8, LA.rollback),
        txt('+0.707', zeroX + w1 + 18, y1, 28, LA.rollback, 'mono', 'left').opacity(pRoll),
      );
    }

    // Row 2: Joint ticket waits with "?" during beat 0 hold, cancels to 0 strictly after contrast-joint!
    const y2 = 50;
    nodes.push(txt('Both', -70, y2, 28, LA.both, 'sans', 'right'));
    if (pJoint < 0.02) {
      const qPulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 8);
      nodes.push(
        txt('Where does [1, 1] land?', zeroX + 260, y2, 32, COSMOS.gold, 'serif')
          .glow(8, COSMOS.gold)
          .opacity(qPulse * Math.max(0.2, pRoll)),
        circle(18, { fill: null, stroke: COSMOS.gold, width: 3, dash: [6, 6] })
          .at(zeroX, y2)
          .opacity(0.65 * Math.max(0.2, pRoll)),
      );
    } else {
      // Opposite halves slide inward and cancel to 0!
      const rem = (1 - pJoint) * Math.SQRT1_2 * scaleX;
      if (rem > 6) {
        nodes.push(
          rect(rem, 26, { fill: LA.slow, stroke: null, radius: 5 }).at(zeroX - rem / 2, y2 - 14),
          rect(rem, 26, { fill: LA.rollback, stroke: null, radius: 5 }).at(
            zeroX + rem / 2,
            y2 + 14,
          ),
        );
      }
      nodes.push(
        glowDot(zeroX, y2, { radius: 14, color: LA.both, glow: 14 }).opacity(pJoint),
        dot(5, '#ffffff').at(zeroX, y2).opacity(pJoint),
        txt('−1/√2 + 1/√2 = 0', zeroX + 34, y2, 30, LA.both, 'mono', 'left')
          .glow(6, LA.both)
          .opacity(pJoint),
      );
    }

    // Bottom comparison of squared lengths & singular values (strictly after contrast-length!)
    if (pLen > 0.02) {
      const a = pLen;
      nodes.push(
        glassPlate(0, 315, 1420, 210, { stroke: COSMOS.gold, glow: 8 }).opacity(a),
        txt('SINGULAR VALUES  σ = ‖A v‖', -660, 250, 26, COSMOS.gold, 'mono', 'left').opacity(a),
        txt('Common:', -660, 314, 30, LA.common, 'sans', 'left').opacity(a),
        txt('‖Av₁‖² = 3   →   σ₁ = √3 ≈ 1.732', -470, 314, 34, LA.common, 'mono', 'left')
          .glow(6, LA.common)
          .opacity(a),
        txt('Contrast:', -660, 376, 30, LA.contrast, 'sans', 'left').opacity(a),
        txt(
          '‖Av₂‖² = 0.5 + 0.5 + 0 = 1   →   σ₂ = 1.000',
          -470,
          376,
          34,
          LA.contrast,
          'mono',
          'left',
        )
          .glow(6, LA.contrast)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'contrast-scores', slowP, 1, { dur: 0.75 });
  cueTo(s, c, 'rollback-score', rollP, 1, { dur: 0.75 });
  // Strict prediction withholding on both caption_boundary cues
  cueTo(s, c, 'contrast-joint', jointP, 1, { after: true, dur: 0.75 });
  cueTo(s, c, 'contrast-length', lenP, 1, { after: true, dur: 0.85 });
}
