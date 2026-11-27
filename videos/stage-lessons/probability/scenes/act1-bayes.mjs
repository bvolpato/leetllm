// Act 1 (Scenes 1-6): Intro, Population Base Rate, Bernoulli Indicator,
// Source-Scale Flag Filter, Conditional World Pivot, and Bayes' Rule.
import { arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  metricReadout,
  mix,
  queuePackets,
  rule,
  scaleTrack,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: What are the chances a flag caught abuse?
// Cues: opening-misses, opening-keep, opening-clean, opening-risk
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const missesP = s.value(0);
  const keepP = s.value(0);
  const cleanP = s.value(0);
  const riskP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clean, seed: 1 }));
  s.add(decorAura(-440, 20, 440, '#ff6b8b26', '#161b3400'));
  s.add(decorAura(340, 40, 520, '#5ce1e622', '#121a3000'));

  const headline = heroTitle(['Would You Trust', 'This Flag?'], {
    x: -855,
    y: -430,
    size: 58,
    lineHeight: 68,
    accent: ROLE.posterior,
    eyebrow: 'BASE RATES & CONDITIONING',
  });

  const visual = dynamic(() => {
    const m = missesP.value;
    const k = keepP.value;
    const cl = cleanP.value;
    const rk = riskP.value;

    const nodes = [];

    // Left glowing 10x10 constellation of 100 abusive signups (95 ruby flagged, 5 missed)
    const gridX0 = -790;
    const gridY0 = -125;
    const step = 42;
    nodes.push(
      txt('100 ABUSIVE SIGNUPS', -855, -205, 26, ROLE.abuse, 'mono', 'left'),
      txt(
        m > 0.3 ? '95 flagged  ·  5 missed' : 'Detector recall: 95%',
        -855,
        -166,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );
    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const isMissed = i >= 95;
      const gx = gridX0 + col * step;
      const gy = gridY0 + row * step;
      if (isMissed) {
        const dropY = gy + m * 56;
        const op = Math.max(0.18, 1 - m * 0.72);
        nodes.push(
          circle(9, { fill: null, stroke: ROLE.abuse, width: 2.2 }).at(gx, dropY).opacity(op),
        );
      } else {
        const r = 9.5 + k * 1.5;
        nodes.push(
          dot(r, ROLE.abuse)
            .at(gx, gy)
            .glow(k > 0.2 ? 9 : 5, ROLE.abuse),
        );
      }
    }

    // Right side: Review Queue proportional ribbon (clean wave floods in on opening-clean)
    const qX = -210;
    const qY = -60;
    const qW = 1040;
    const qH = 92;
    const totalScale = 590;
    const redW = (95 / totalScale) * qW;
    const blueW = ((495 * cl) / totalScale) * qW;

    nodes.push(
      txt('REVIEW QUEUE COMPOSITION', qX, qY - 120, 26, COSMOS.cyan, 'mono', 'left'),
      scaleTrack(qX, qY, qW, qH, { stroke: '#32446e', fill: '#0d1427', radius: 14 }),
      glowBar(qX, qY, redW, qH - 6, ROLE.abuse, { glow: 10, radius: 12 }),
      txt('95', qX + redW / 2, qY, 34, '#070910', 'mono'),
      txt('Abusive flags', qX, qY + 76, 26, ROLE.abuse, 'sans', 'left'),
    );

    if (cl > 0.03) {
      nodes.push(
        glowBar(qX + redW + 4, qY, Math.max(8, blueW - 4), qH - 6, ROLE.clean, {
          glow: 9,
          radius: 12,
          opacity: Math.min(1, cl * 1.3),
        }),
      );
      if (cl > 0.55) {
        const cleanCount = Math.round(495 * cl);
        nodes.push(
          txt(`${cleanCount} clean flags`, qX + redW + blueW / 2, qY, 34, '#070910', 'mono'),
          txt(
            '495 clean signups falsely flagged',
            qX + redW + 28,
            qY + 76,
            26,
            ROLE.clean,
            'sans',
            'left',
          ),
        );
      }
    } else {
      // Prediction pause prompt before answer
      nodes.push(
        txt(
          'Pick one flag at random from review...',
          qX + redW + 44,
          qY,
          30,
          COSMOS.muted,
          'serif',
          'left',
        ),
      );
    }

    // Bottom readout withheld until opening-risk completes
    if (rk > 0.05) {
      nodes.push(
        group(
          txt('POSTERIOR ABUSE SHARE IN QUEUE', qX, 145, 26, ROLE.posterior, 'mono', 'left'),
          txt('95 / 590  ≈  16.1%', qX, 222, 68, ROLE.posterior, 'mono', 'left').glow(
            12,
            ROLE.posterior,
          ),
          txt('Roughly 1 flag in 6 caught abuse', qX, 298, 32, COSMOS.ink, 'serif', 'left'),
        ).opacity(rk),
      );
    } else if (cl > 0.5) {
      nodes.push(
        txt(
          '95 abusive + 495 clean = 590 flags in queue',
          qX,
          195,
          32,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, visual);
  cueTo(s, c, 'opening-misses', missesP, 1, { dur: 0.75 });
  cueTo(s, c, 'opening-keep', keepP, 1, { dur: 0.55 });
  cueTo(s, c, 'opening-clean', cleanP, 1, { dur: 1.0 });
  cueTo(s, c, 'opening-risk', riskP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 2. population: Who could we have picked?
// Cues: population-build, population-prior*
// ---------------------------------------------------------------------------
export function population(s, c) {
  const buildP = s.value(0);
  const priorP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clean, seed: 2 }));
  s.add(decorAura(-320, 10, 500, '#5ce1e61f', '#07091000'));

  const headline = heroTitle(['The Whole', 'Sample Space'], {
    x: 240,
    y: -380,
    size: 56,
    lineHeight: 66,
    accent: ROLE.clean,
    eyebrow: '10,000 LABELED SIGNUPS',
  });

  const mosaic = dynamic(() => {
    const b = buildP.value;
    const pr = priorP.value;
    const nodes = [];

    // 10x10 glowing tiles, each tile = 100 signups
    const x0 = -770;
    const y0 = -345;
    const pitch = 74;
    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const cx = x0 + col * pitch;
      const cy = y0 + row * pitch;
      if (i === 0) {
        const glowAmt = 10;
        nodes.push(
          rect(62, 62, { fill: ROLE.abuse, stroke: '#ffd6df', width: 2.2, radius: 10 })
            .at(cx, cy)
            .glow(glowAmt, ROLE.abuse),
          txt('100', cx, cy, 26, '#070910', 'mono'),
        );
      } else {
        const appear = Math.max(0, Math.min(1, (b * 104 - i) / 6));
        if (appear > 0.02) {
          nodes.push(
            rect(62, 62, {
              fill: '#133148',
              stroke: ROLE.clean,
              width: 1.5,
              radius: 10,
            })
              .at(cx, cy)
              .opacity(0.86 * appear),
          );
        } else {
          nodes.push(
            rect(62, 62, {
              fill: '#14203b',
              stroke: '#405a92',
              width: 1.4,
              radius: 10,
            })
              .at(cx, cy)
              .opacity(0.75),
          );
        }
      }
    }

    nodes.push(
      txt('1 red tile = 100 abusive', 240, -145, 30, ROLE.abuse, 'sans', 'left'),
      txt(
        b > 0.4 ? '99 blue tiles = 9,900 clean' : 'Each tile holds 100 signups',
        240,
        -90,
        30,
        ROLE.clean,
        'sans',
        'left',
      ),
      txt('Sample space Ω = 10,000 signups', 240, -28, 28, COSMOS.muted, 'mono', 'left'),
    );

    const prePrior = fadeOut(pr);
    if (prePrior > 0.02) {
      nodes.push(
        group(
          txt('SAMPLING FRAME  Ω', 240, 80, 26, COSMOS.muted, 'mono', 'left'),
          scaleTrack(240, 145, 580, 44, { stroke: ROLE.clean, radius: 10 }),
          glowBar(240, 145, 16, 44, ROLE.abuse, { glow: 10, radius: 6 }),
          glowBar(260, 145, 560, 44, ROLE.clean, { glow: 6, radius: 8, opacity: 0.65 }),
          txt('100 abusive  +  9,900 clean  =  10,000', 240, 215, 26, COSMOS.muted, 'mono', 'left'),
        ).opacity(prePrior),
      );
    }

    const postPrior = fadeIn(pr);
    if (postPrior > 0.02) {
      nodes.push(
        group(
          glowTex('P(\\text{abusive}) = \\frac{100}{10{,}000} = 1\\%', {
            x: 545,
            y: 125,
            size: 46,
            color: ROLE.posterior,
          }),
          txt('Prior base rate before seeing a flag', 240, 235, 30, COSMOS.ink, 'serif', 'left'),
        ).opacity(postPrior),
      );
    }

    return group(...nodes);
  });

  s.add(headline, mosaic);
  cueTo(s, c, 'population-build', buildP, 1, { dur: 1.3 });
  cueTo(s, c, 'population-prior', priorP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 3. indicator: What does one randomly picked label look like?
// Cues: indicator-mean, variance-squares, variance-weights, indicator-variance
// ---------------------------------------------------------------------------
export function indicator(s, c) {
  const meanP = s.value(0);
  const sqP = s.value(0);
  const wtP = s.value(0);
  const varP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.posterior, seed: 3 }));
  s.add(decorAura(0, 60, 560, '#ffd1661c', '#5ce1e60e'));

  const headline = heroTitle(['Bernoulli', 'Mean & Variance'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.posterior,
    eyebrow: 'BINARY RANDOM VARIABLE  Y ∈ {0, 1}',
  });

  const live = dynamic(() => {
    const mn = meanP.value;
    const sq = sqP.value;
    const wt = wtP.value;
    const vr = varP.value;
    const nodes = [];

    // Number line from Y = 0 to Y = 1
    const x0 = -720;
    const x1 = 680;
    const axisY = -30;
    const xMean = mix(x0, x1, 0.01);

    nodes.push(
      line([x0, axisY], [x1, axisY], { stroke: '#4a5f8e', width: 3.5 }),
      glowDot(x0, axisY, { radius: 22, color: ROLE.clean, glow: 14 }),
      txt('Y = 0', x0 - 28, axisY - 56, 34, ROLE.clean, 'mono', 'right'),
      txt('99% clean', x0, axisY + 62, 28, ROLE.clean, 'sans'),
      glowDot(x1, axisY, { radius: 13, color: ROLE.abuse, glow: 14 }),
      txt('Y = 1', x1, axisY - 68, 34, ROLE.abuse, 'mono'),
      txt('1% abusive', x1, axisY + 62, 28, ROLE.abuse, 'sans'),
    );

    // Fulcrum & Expectation E[Y] = 0.01 (goes UPWARD so it never touches labels below axis)
    if (mn > 0.04) {
      nodes.push(
        group(
          line([xMean, axisY - 125], [xMean, axisY - 24], {
            stroke: ROLE.posterior,
            width: 3.5,
            dash: [8, 6],
          }),
          glowDot(xMean, axisY, { radius: 9, color: ROLE.posterior, glow: 12 }),
          glowTex('E[Y] = 1(0.01) + 0(0.99) = 0.01', {
            x: 240,
            y: -275,
            size: 42,
            color: ROLE.posterior,
          }),
        ).opacity(mn),
      );
    }

    // Squared distances from mean
    if (sq > 0.04) {
      const spanX = mix(xMean, x1, sq);
      nodes.push(
        group(
          line([xMean, axisY - 125], [spanX, axisY - 125], {
            stroke: ROLE.abuse,
            width: 4,
          }).glow(8, ROLE.abuse),
          txt('(1 − 0.01)² = 0.9801', (xMean + x1) / 2, axisY - 165, 30, ROLE.abuse, 'mono'),
          txt('(0 − 0.01)² = 0.0001', x0 + 210, axisY + 125, 28, ROLE.clean, 'mono'),
        ).opacity(sq),
      );
    }

    // Weighted contributions to variance (show population PMF strip beforehand for balanced frame)
    const barX = -720;
    const barY = 230;
    const barW = 920;
    const preVis = fadeOut(wt);
    if (preVis > 0.02) {
      nodes.push(
        group(
          txt(
            'POPULATION PROBABILITY MASS  P(Y)',
            barX,
            barY - 56,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
          scaleTrack(barX, barY, barW, 44, { radius: 10 }),
          glowBar(barX, barY, barW * 0.99, 44, ROLE.clean, { glow: 7, radius: 10 }),
          glowBar(barX + barW * 0.99 - 8, barY, 16, 44, ROLE.abuse, { glow: 10, radius: 6 }),
          txt('P(Y = 0) = 0.99', barX, barY + 66, 28, ROLE.clean, 'mono', 'left'),
          txt('P(Y = 1) = 0.01', barX + 640, barY + 66, 28, ROLE.abuse, 'mono', 'left'),
        ).opacity(preVis),
      );
    }
    const wtVis = fadeIn(wt);
    if (wtVis > 0.02) {
      const abuseShare = 0.99; // 0.009801 / 0.0099 = 0.99
      nodes.push(
        group(
          txt(
            'WEIGHTED SQUARED-DISTANCE SHARES',
            barX,
            barY - 56,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
          scaleTrack(barX, barY, barW, 44, { radius: 10 }),
          glowBar(barX, barY, barW * abuseShare * wtVis, 44, ROLE.abuse, { glow: 9, radius: 10 }),
          glowBar(
            barX + barW * abuseShare,
            barY,
            Math.max(10, barW * 0.01 * wtVis),
            44,
            ROLE.clean,
            {
              glow: 9,
              radius: 6,
            },
          ),
          txt('0.01 × 0.9801 = 0.009801', barX, barY + 66, 28, ROLE.abuse, 'mono', 'left'),
          txt('0.99 × 0.0001 = 0.000099', barX + 510, barY + 66, 28, ROLE.clean, 'mono', 'left'),
        ).opacity(wtVis),
      );
    }

    if (vr > 0.04) {
      nodes.push(
        group(
          glowTex('\\mathrm{Var}[Y] = p(1 - p) = 0.0099', {
            x: 525,
            y: 245,
            size: 40,
            color: ROLE.posterior,
          }),
        ).opacity(vr),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'indicator-mean', meanP, 1, { dur: 0.7 });
  cueTo(s, c, 'variance-squares', sqP, 1, { dur: 0.75 });
  cueTo(s, c, 'variance-weights', wtP, 1, { dur: 0.75 });
  cueTo(s, c, 'indicator-variance', varP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 4. filter: Let each source send its flags
// Cues: filter-rates, queue-arrivals, queue-abuse-arrivals, queue-clean-arrivals, queue-total*
// ---------------------------------------------------------------------------
export function filter(s, c) {
  const ratesP = s.value(0);
  const arrivalsP = s.value(0);
  const abuseP = s.value(0);
  const cleanP = s.value(0);
  const totalP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clean, seed: 4 }));
  s.add(decorAura(-440, -140, 420, '#ff6b8b22', '#07091000'));
  s.add(decorAura(340, -140, 460, '#5ce1e622', '#07091000'));

  const headline = heroTitle(['Two Sources,', 'One Shared Queue'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.clean,
    eyebrow: 'SEPARATE DENOMINATORS',
  });

  const live = dynamic(() => {
    const rt = ratesP.value;
    const ar = arrivalsP.value;
    const ab = abuseP.value;
    const cl = cleanP.value;
    const tot = totalP.value;
    const nodes = [];

    // Top source fountains
    const leftX = -460;
    const rightX = 340;
    const srcY = -165;
    nodes.push(
      txt('ABUSIVE SOURCE  (100)', leftX, srcY - 56, 28, ROLE.abuse, 'mono'),
      scaleTrack(leftX - 240, srcY, 480, 40, { stroke: ROLE.abuse }),
      glowBar(leftX - 240, srcY, 480 * 0.95, 40, ROLE.abuse, { glow: 10 }),
      txt('95% flagged inside abuse', leftX, srcY + 58, 28, ROLE.abuse, 'sans'),
      txt('CLEAN SOURCE  (9,900)', rightX, srcY - 56, 28, ROLE.clean, 'mono'),
      scaleTrack(rightX - 240, srcY, 480, 40, { stroke: ROLE.clean }),
      glowBar(rightX - 240, srcY, 480 * 0.05, 40, ROLE.clean, { glow: 10 }),
      txt('5% flagged inside clean', rightX, srcY + 58, 28, ROLE.clean, 'sans'),
    );

    if (rt > 0.05) {
      nodes.push(
        txt('95% of 100   vs   5% of 9,900', -60, srcY - 120, 34, ROLE.posterior, 'mono')
          .glow(6, ROLE.posterior)
          .opacity(rt),
      );
    }

    // Source-to-ribbon connectors (terminate cleanly above the ribbon title)
    if (ar > 0.05 || ab > 0.05) {
      nodes.push(
        arrow([leftX, srcY + 92], [-660, 86], { stroke: ROLE.abuse, width: 3 }).opacity(
          Math.max(ar, ab),
        ),
      );
    }
    if (cl > 0.05) {
      nodes.push(
        arrow([rightX, srcY + 92], [180, 86], { stroke: ROLE.clean, width: 3 }).opacity(cl),
      );
    }

    // Shared count-scale packet ribbon (total scale = 590)
    const ribbonX = -820;
    const ribbonY = 205;
    const ribbonW = 1640;
    const ribbonH = 92;
    nodes.push(
      txt(
        'SHARED COUNT-SCALE REVIEW QUEUE',
        ribbonX,
        ribbonY - 82,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      scaleTrack(ribbonX, ribbonY, ribbonW, ribbonH, {
        stroke: '#3a4e7c',
        fill: '#0b1224',
        radius: 12,
      }),
    );

    let cursorX = ribbonX;
    let arrivedAbuse = 0;
    let arrivedClean = 0;
    for (const pkt of queuePackets) {
      const w = (pkt.count / 590) * ribbonW;
      const frac = pkt.abusive ? ab : cl;
      const local = Math.max(0, Math.min(1, frac * 1.4 - (pkt.index % 6) * 0.08));
      if (local > 0.05) {
        const col = pkt.abusive ? ROLE.abuse : ROLE.clean;
        const px = cursorX;
        const dy = (1 - local) * -60;
        nodes.push(
          rect(Math.max(6, w - 4), ribbonH - 12, {
            fill: col,
            stroke: '#070910',
            width: 2,
            radius: 7,
          })
            .at(px + w / 2, ribbonY + dy)
            .opacity(local)
            .glow(local > 0.9 ? 6 : 2, col),
        );
        if (w >= 90 && local > 0.85) {
          nodes.push(txt(String(pkt.count), px + w / 2, ribbonY + dy, 28, '#070910', 'mono'));
        }
        if (local > 0.95) {
          if (pkt.abusive) arrivedAbuse += pkt.count;
          else arrivedClean += pkt.count;
        }
      }
      cursorX += w;
    }

    // Live arrived counters; total 590 withheld until queue-total (after)
    nodes.push(
      txt(
        `Abusive arrived: ${arrivedAbuse}`,
        ribbonX,
        ribbonY + 95,
        30,
        ROLE.abuse,
        'mono',
        'left',
      ),
      txt(
        `Clean arrived: ${arrivedClean}`,
        ribbonX + 430,
        ribbonY + 95,
        30,
        ROLE.clean,
        'mono',
        'left',
      ),
    );
    if (tot > 0.05) {
      nodes.push(
        txt(
          'Total queue: 590 reviews',
          ribbonX + 940,
          ribbonY + 95,
          36,
          ROLE.posterior,
          'mono',
          'left',
        )
          .glow(10, ROLE.posterior)
          .opacity(tot),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'filter-rates', ratesP, 1, { dur: 0.65 });
  cueTo(s, c, 'queue-arrivals', arrivalsP, 1, { dur: 0.6 });
  cueTo(s, c, 'queue-abuse-arrivals', abuseP, 1, { dur: 0.95 });
  cueTo(s, c, 'queue-clean-arrivals', cleanP, 1, { dur: 1.05 });
  cueTo(s, c, 'queue-total', totalP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 5. conditional: Keep the intersection, change the world
// Cues: select-flagged, conditional-result*, reverse-condition
// ---------------------------------------------------------------------------
export function conditional(s, c) {
  const selectP = s.value(0);
  const resultP = s.value(0);
  const reverseP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.posterior, seed: 5 }));
  s.add(decorAura(-220, 20, 520, '#ffd1661c', '#ff6b8b14'));

  const headline = heroTitle(['Conditioning', 'Swaps the World'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.posterior,
    eyebrow: 'KEEP THE INTERSECTION · CHANGE THE DENOMINATOR',
  });

  const live = dynamic(() => {
    const sel = selectP.value;
    const res = resultP.value;
    const rev = reverseP.value;
    const nodes = [];

    // 2x2 cohort tiles: [Abusive/Flagged=95, Clean/Flagged=495, Abusive/Passed=5, Clean/Passed=9405]
    const cxL = -520;
    const cxR = -120;
    const cyT = -110;
    const cyB = 150;
    const w = 340;
    const h = 190;

    // Opacity logic:
    // Initial: all 4 visible
    // select-flagged (sel->1, rev=0): bottom row (Passed) fades & slides down out of eligible tray
    // reverse-condition (rev->1): Clean/Flagged leaves, Abusive/Passed (5) returns!
    const afOp = 1;
    const cfOp = Math.max(0.14, 1 - rev * 0.86);
    const cfDx = rev * 90;
    const apOp = Math.max(0.14, 1 - sel * 0.86 + rev * 0.86);
    const apDy = (sel - rev) * 75;
    const cpOp = Math.max(0.12, 1 - sel * 0.88);
    const cpDy = sel * 75;

    // Column & row headers (floating, no box)
    nodes.push(
      txt('ABUSIVE (100)', cxL, cyT - 135, 26, ROLE.abuse, 'mono'),
      txt('CLEAN (9,900)', cxR, cyT - 135, 26, ROLE.clean, 'mono'),
      txt('FLAGGED', -840, cyT, 26, ROLE.posterior, 'mono', 'left'),
      txt('PASSED', -840, cyB, 26, COSMOS.dim, 'mono', 'left'),
    );

    // Tile 1: Abusive & Flagged = 95 (always active intersection!)
    nodes.push(
      rect(w, h, { fill: '#2a1222', stroke: ROLE.abuse, width: 3.4, radius: 16 })
        .at(cxL, cyT)
        .glow(10, ROLE.abuse),
      txt('95', cxL, cyT - 18, 64, ROLE.abuse, 'mono'),
      txt('Abusive & Flagged', cxL, cyT + 48, 26, COSMOS.ink, 'sans'),
    );

    // Tile 2: Clean & Flagged = 495
    nodes.push(
      group(
        rect(w, h, {
          fill: '#0e2438',
          stroke: ROLE.clean,
          width: rev > 0.5 ? 1.4 : 2.8,
          radius: 16,
        })
          .at(cxR + cfDx, cyT)
          .glow(rev > 0.5 ? 0 : 7, ROLE.clean),
        txt('495', cxR + cfDx, cyT - 18, 60, ROLE.clean, 'mono'),
        txt('Clean & Flagged', cxR + cfDx, cyT + 48, 26, COSMOS.muted, 'sans'),
      ).opacity(cfOp),
    );

    // Tile 3: Abusive & Passed = 5
    nodes.push(
      group(
        rect(w, h, {
          fill: '#231320',
          stroke: ROLE.abuse,
          width: rev > 0.5 ? 2.8 : 1.5,
          dash: rev > 0.5 ? undefined : [8, 6],
          radius: 16,
        })
          .at(cxL, cyB + apDy)
          .glow(rev > 0.5 ? 8 : 0, ROLE.abuse),
        txt('5', cxL, cyB + apDy - 18, 56, ROLE.abuse, 'mono'),
        txt('Missed Abuse', cxL, cyB + apDy + 48, 26, COSMOS.muted, 'sans'),
      ).opacity(apOp),
    );

    // Tile 4: Clean & Passed = 9,405
    nodes.push(
      group(
        rect(w, h, {
          fill: '#0d1527',
          stroke: '#334466',
          width: 1.5,
          dash: [8, 6],
          radius: 16,
        }).at(cxR, cyB + cpDy),
        txt('9,405', cxR, cyB + cpDy - 18, 52, COSMOS.dim, 'mono'),
        txt('Clean & Passed', cxR, cyB + cpDy + 48, 26, COSMOS.dim, 'sans'),
      ).opacity(cpOp),
    );

    // Right side live conditional fraction
    const eqX = 485;
    if (rev > 0.5) {
      nodes.push(
        group(
          txt('REVERSED CONDITION (RECALL)', eqX, -210, 26, ROLE.abuse, 'mono'),
          glowTex('P(\\text{Flagged} \\mid \\text{Abusive}) = \\frac{95}{100}', {
            x: eqX,
            y: -65,
            size: 44,
            color: ROLE.abuse,
          }),
          txt('= 95%', eqX, 75, 84, ROLE.abuse, 'mono').glow(12, ROLE.abuse),
          txt('Same 95 numerator · new denominator 100', eqX, 185, 28, COSMOS.ink, 'serif'),
        ).opacity(Math.min(1, (rev - 0.5) * 2)),
      );
    } else if (res > 0.05) {
      nodes.push(
        group(
          txt('POSTERIOR RISK GIVEN FLAG', eqX, -210, 26, ROLE.posterior, 'mono'),
          glowTex('P(\\text{Abusive} \\mid \\text{Flagged}) = \\frac{95}{590}', {
            x: eqX,
            y: -65,
            size: 44,
            color: ROLE.posterior,
          }),
          txt('≈ 16.1%', eqX, 75, 84, ROLE.posterior, 'mono').glow(12, ROLE.posterior),
          txt('Right of | selects the 590 flagged rows', eqX, 185, 28, COSMOS.ink, 'serif'),
        ).opacity(res * (1 - Math.min(1, rev * 2.2))),
      );
    } else if (sel > 0.3) {
      nodes.push(
        txt('Kept only flagged rows', eqX, -85, 34, ROLE.posterior, 'serif'),
        txt('What goes in the denominator?', eqX, -15, 32, COSMOS.ink, 'sans'),
        txt('95 / ?', eqX, 85, 72, ROLE.posterior, 'mono').glow(10, ROLE.posterior),
      );
    } else {
      nodes.push(
        txt('All 10,000 signups in view', eqX, -40, 32, COSMOS.muted, 'serif'),
        txt('Intersection = 95 rows', eqX, 35, 34, ROLE.abuse, 'mono'),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'select-flagged', selectP, 1, { dur: 0.85 });
  cueTo(s, c, 'conditional-result', resultP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'reverse-condition', reverseP, 1, { dur: 0.95 });
}

// ---------------------------------------------------------------------------
// 6. bayes: Give the counting a compact name
// Cues: joint-to-conditional, bayes-rule
// ---------------------------------------------------------------------------
export function bayes(s, c) {
  const cancelP = s.value(0);
  const bayesP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.posterior, seed: 6 }));
  s.add(decorAura(0, -10, 580, '#ffd1661c', '#a78bfa16'));

  const headline = heroTitle(["Bayes' Rule", 'From Counting'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.posterior,
    eyebrow: 'JOINT · MARGINAL · CONDITIONAL',
  });

  const live = dynamic(() => {
    const cn = cancelP.value;
    const by = bayesP.value;
    const nodes = [];

    // Top-right live count proportions
    nodes.push(
      txt('Joint:  P(A ∩ F) = 95 / 10,000 = 0.0095', 855, -395, 28, ROLE.abuse, 'mono', 'right'),
      txt('Marginal:  P(F) = 590 / 10,000 = 0.0590', 855, -345, 28, ROLE.clean, 'mono', 'right'),
    );

    // Stage 1: Joint / Marginal fraction -> 10,000 cancels
    const v1 = fadeOut(by);
    if (v1 > 0.02) {
      const preCn = fadeOut(cn);
      const postCn = fadeIn(cn);
      nodes.push(
        group(
          glowTex(
            'P(A \\mid F) = \\frac{P(A \\cap F)}{P(F)} = \\frac{95 / 10{,}000}{590 / 10{,}000}',
            { x: 0, y: -95, size: 52, color: COSMOS.ink },
          ),
          preCn > 0.02
            ? group(
                txt(
                  'PROPORTION OF ALL 10,000 SIGNUPS',
                  -660,
                  115,
                  26,
                  COSMOS.muted,
                  'mono',
                  'left',
                ),
                scaleTrack(-660, 175, 1320, 46, { stroke: '#3a4f7c', radius: 10 }),
                glowBar(-660, 175, 212, 46, ROLE.abuse, { glow: 10, radius: 8 }),
                glowBar(-442, 175, 1102, 46, ROLE.clean, { glow: 7, radius: 8 }),
                txt('95 abusive & flagged (0.95%)', -660, 248, 26, ROLE.abuse, 'mono', 'left'),
                txt('495 clean & flagged (4.95%)', 660, 248, 26, ROLE.clean, 'mono', 'right'),
              ).opacity(preCn)
            : group(),
          postCn > 0.02
            ? group(
                txt('10,000 cancels cleanly', 0, 75, 34, ROLE.posterior, 'serif').glow(
                  8,
                  ROLE.posterior,
                ),
                glowTex('= \\frac{95}{590} \\approx 16.1\\%', {
                  x: 0,
                  y: 195,
                  size: 56,
                  color: ROLE.posterior,
                }),
              ).opacity(postCn)
            : group(),
        ).opacity(v1),
      );
    }

    // Stage 2: Full Bayes' Rule
    const v2 = fadeIn(by);
    if (v2 > 0.02) {
      const glowAmt = 10;
      nodes.push(
        group(
          glowTex(
            'P(A \\mid F) = \\frac{P(F \\mid A)\\,P(A)}{P(F \\mid A)\\,P(A) + P(F \\mid \\neg A)\\,P(\\neg A)}',
            { x: 0, y: -55, size: 50, color: ROLE.posterior, glow: glowAmt },
          ),
          rule(-640, 88, 640, 88, '#334570', 2),
          txt('Prior × Recall', -430, 155, 30, ROLE.abuse, 'sans'),
          txt('0.01 × 0.95 = 0.0095', -430, 208, 30, ROLE.abuse, 'mono'),
          txt('False-alarm mass', 0, 155, 30, ROLE.clean, 'sans'),
          txt('0.99 × 0.05 = 0.0495', 0, 208, 30, ROLE.clean, 'mono'),
          txt('Posterior risk', 440, 155, 30, ROLE.posterior, 'sans'),
          txt('0.0095 / 0.059 = 16.1%', 440, 208, 30, ROLE.posterior, 'mono'),
        ).opacity(v2),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'joint-to-conditional', cancelP, 1, { dur: 0.8 });
  cueTo(s, c, 'bayes-rule', bayesP, 1, { dur: 0.95 });
}
