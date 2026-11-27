// Act 2 (Scenes 7-11): 3D Bayes Posterior Manifold (Prior Shift), Independence vs Mutual Exclusion,
// Copied vs Independent Evidence, Posterior Contract & Log-Sum-Exp Rescue, and Likelihood Curve.
import {
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  group,
  line,
  point3d,
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
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  mix,
  neonCurve,
  orbitScene,
  posterior,
  rule,
  scaleTrack,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 7. prior-shift: Same detector, different traffic (SIGNATURE 3D MANIFOLD)
// Cues: prior-prediction, prior-change, prior-result*
// ---------------------------------------------------------------------------
export function priorShift(s, c) {
  const predP = s.value(0);
  const shiftP = s.value(0);
  const resultP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.posterior, seed: 7 }));
  s.add(decorAura(340, 20, 540, '#ffd16622', '#5ce1e614'));

  // 3D Bayes Posterior surface: z = P(Abuse | Flag) over (prior in [0.01, 0.25], fpr in [0.01, 0.12])
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.2,
    unit: 112,
    focus: [0, 0, 1.0],
  }).at(340, 25);

  const surf = surface(
    (u, v) => {
      const pr = 0.01 + ((u + 2.5) / 5) * 0.24;
      const fpr = 0.01 + ((v + 2.5) / 5) * 0.11;
      const post = posterior(pr, 0.95, fpr);
      return post * 2.75;
    },
    {
      x: [-2.5, 2.5],
      y: [-2.5, 2.5],
      resolution: [30, 30],
      colors: ['#070b1a', '#1b275c', '#4c2f8a', '#1f7ec2', '#5ce1e6', '#ffd166'],
      mesh: '#7ce8ff',
      meshOpacity: 0.18,
      meshWidth: 0.55,
      opacity: 0.9,
    },
  );

  // Constant FPR = 0.05 slice ridge across the surface
  const fprSliceV = -2.5 + ((0.05 - 0.01) / 0.11) * 5;
  const ridgeCurve = curve3d(
    (t) => {
      const pr = 0.01 + t * 0.24;
      const u = -2.5 + ((pr - 0.01) / 0.24) * 5;
      const z = posterior(pr, 0.95, 0.05) * 2.75 + 0.07;
      return [u, fprSliceV, z];
    },
    0,
    1,
    { samples: 48, color: ROLE.posterior, width: 4.5, glow: 10, blend: 'screen' },
  );

  // Live glowing marker gliding from prior = 0.01 to prior = 0.10
  const liveMarker = point3d(
    () => {
      const pr = mix(0.01, 0.1, shiftP.value);
      const u = -2.5 + ((pr - 0.01) / 0.24) * 5;
      const z = posterior(pr, 0.95, 0.05) * 2.75 + 0.12;
      return [u, fprSliceV, z];
    },
    { color: ROLE.abuse, radius: 10, glow: 14 },
  );

  view3d.add(surf, ridgeCurve, liveMarker);

  const headline = heroTitle(['Same Detector,', 'Different Traffic'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.posterior,
    eyebrow: '3D BAYES POSTERIOR MANIFOLD  (TPR = 95%, FPR = 5%)',
  });

  const leftPanel = dynamic(() => {
    const sh = shiftP.value;
    const res = resultP.value;
    const pred = predP.value;
    const pr = mix(0.01, 0.1, sh);
    const abusive = Math.round(10000 * pr);
    const clean = 10000 - abusive;
    const tp = Math.round(0.95 * abusive);
    const fp = Math.round(0.05 * clean);
    const maxScale = 1400;
    const barW = 640;
    const redW = (tp / maxScale) * barW;
    const blueW = (fp / maxScale) * barW;
    const nodes = [];

    nodes.push(
      txt(
        `BASE RATE (PRIOR):  ${(pr * 100).toFixed(1)}%`,
        -855,
        -200,
        30,
        ROLE.posterior,
        'mono',
        'left',
      ),
      txt(
        `Abusive: ${abusive.toLocaleString()}   ·   Clean: ${clean.toLocaleString()}`,
        -855,
        -148,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ),
      txt('QUEUE FLAGS (FIXED COUNT SCALE)', -855, -62, 26, COSMOS.muted, 'mono', 'left'),
      scaleTrack(-855, 10, barW, 68, { stroke: '#364a78', radius: 12 }),
      glowBar(-855, 10, redW, 62, ROLE.abuse, { glow: 10, radius: 10 }),
      glowBar(-855 + redW + 3, 10, blueW, 62, ROLE.clean, { glow: 9, radius: 10 }),
      txt(`Red flags: ${tp}`, -855, 84, 30, ROLE.abuse, 'mono', 'left'),
      txt(`Blue flags: ${fp}`, -510, 84, 30, ROLE.clean, 'mono', 'left'),
    );

    if (res > 0.05) {
      nodes.push(
        group(
          txt('NEW POSTERIOR RISK', -855, 185, 26, ROLE.posterior, 'mono', 'left'),
          txt('950 / 1,400  ≈  67.9%', -855, 265, 58, ROLE.posterior, 'mono', 'left').glow(
            12,
            ROLE.posterior,
          ),
          txt(
            '10× higher prior lifts risk from 16% to 68%',
            -855,
            340,
            28,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(res),
      );
    } else if (sh > 0.4) {
      nodes.push(
        txt('Red grows to 950 · Blue shrinks to 450', -855, 210, 30, COSMOS.ink, 'sans', 'left'),
        txt('What share of 1,400 is red?', -855, 268, 34, ROLE.posterior, 'serif', 'left'),
      );
    } else if (pred > 0.2) {
      nodes.push(
        txt('Raise prior from 1% → 10% (rates fixed)', -855, 200, 30, COSMOS.ink, 'sans', 'left'),
        txt('Will queue risk rise or fall?', -855, 260, 36, ROLE.posterior, 'serif', 'left'),
      );
    }

    nodes.push(
      txt('3D SURFACE: P(Abuse | Flag) vs Prior & FPR', 340, 395, 26, COSMOS.muted, 'mono'),
    );
    return group(...nodes);
  });

  s.add(view3d, headline, leftPanel);
  orbitScene(s, c, view3d, { theta: -0.32, phi: 0.94 });
  cueTo(s, c, 'prior-prediction', predP, 1, { dur: 0.65 });
  cueTo(s, c, 'prior-change', shiftP, 1, { dur: 1.25 });
  cueTo(s, c, 'prior-result', resultP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 8. independence: What would equal selection rates do?
// Cues: independent-prediction, independent-select, exclude-update
// ---------------------------------------------------------------------------
export function independence(s, c) {
  const predP = s.value(0);
  const selP = s.value(0);
  const exclP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clean, seed: 8 }));
  s.add(decorAura(0, 10, 560, '#5ce1e61a', '#a78bfa16'));

  const headline = heroTitle(['Independence vs', 'Mutual Exclusion'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.clean,
    eyebrow: 'UNCHANGED BELIEF VS ZERO OVERLAP',
  });

  const view1 = guardedDynamic(
    () => fadeOut(exclP.value),
    (vis) => {
      const sl = selP.value;
      const pr = predP.value;
      const nodes = [];

      // Equal 20% slicing of both populations
      nodes.push(
        txt('EQUAL 20% SELECTION IN BOTH CLASSES', -855, -215, 26, ROLE.clean, 'mono', 'left'),
        txt('Abusive (100)', -520, -135, 30, ROLE.abuse, 'sans'),
        scaleTrack(-760, -70, 480, 48, { stroke: ROLE.abuse }),
        glowBar(-760, -70, 480 * 0.2 * Math.max(0.2, sl), 48, ROLE.abuse, { glow: 9 }),
        txt('20% → 20 rows', -520, 4, 30, ROLE.abuse, 'mono'),

        txt('Clean (9,900)', 340, -135, 30, ROLE.clean, 'sans'),
        scaleTrack(100, -70, 480, 48, { stroke: ROLE.clean }),
        glowBar(100, -70, 480 * 0.2 * Math.max(0.2, sl), 48, ROLE.clean, { glow: 9 }),
        txt('20% → 1,980 rows', 340, 4, 30, ROLE.clean, 'mono'),
      );

      const combOp = mix(0.45, 1, sl);
      nodes.push(
        group(
          txt('COMBINED QUEUE (2,000 FLAGS)', -760, 120, 26, ROLE.posterior, 'mono', 'left'),
          scaleTrack(-760, 190, 1340, 62, { stroke: '#3b4e7a', radius: 12 }),
          glowBar(-760, 190, Math.max(18, 1340 * 0.01), 62, ROLE.abuse, { glow: 10, radius: 10 }),
          glowBar(-760 + 22, 190, 1318 * Math.max(0.2, sl), 62, ROLE.clean, {
            glow: 7,
            radius: 10,
          }),
          sl > 0.2
            ? glowTex('P(A \\mid F) = \\frac{20}{2{,}000} = 1\\% = P(A)', {
                x: -90,
                y: 315,
                size: 46,
                color: ROLE.posterior,
              })
            : txt(
                pr > 0.1
                  ? 'Both classes pass 1/5 · Does this flag change the 1% risk?'
                  : '20% of 100 abusive + 20% of 9,900 clean',
                -90,
                310,
                34,
                ROLE.posterior,
                'serif',
              ),
        ).opacity(combOp),
      );

      return group(...nodes).opacity(vis);
    },
  );

  const view2 = guardedDynamic(
    () => fadeIn(exclP.value),
    (vis) => {
      return group(
        txt('MUTUALLY EXCLUSIVE EVENTS CANNOT CO-OCCUR', 0, -210, 28, ROLE.warning, 'mono'),
        circle(145, { fill: '#2a1220', stroke: ROLE.abuse, width: 3.5 })
          .at(-300, 10)
          .glow(12, ROLE.abuse),
        txt('ABUSIVE', -300, -12, 34, ROLE.abuse, 'mono'),
        txt('Observed!', -300, 38, 28, COSMOS.ink, 'sans'),
        circle(155, { fill: '#0b1424', stroke: ROLE.clean, width: 2.5, dash: [10, 8] })
          .at(300, 10)
          .opacity(0.42),
        txt('CLEAN', 300, -14, 34, COSMOS.dim, 'mono'),
        txt('P = 0%', 300, 38, 32, ROLE.warning, 'mono'),
        txt(
          '99% → 0%: maximally dependent, NOT independent',
          0,
          260,
          34,
          ROLE.posterior,
          'serif',
        ).glow(6, ROLE.posterior),
      ).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'independent-prediction', predP, 1, { dur: 0.6 });
  cueTo(s, c, 'independent-select', selP, 1, { dur: 0.95 });
  cueTo(s, c, 'exclude-update', exclP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 9. copied-evidence: Does a copied flag narrow the queue?
// Cues: copied-pass, copied-result*, independent-counterfactual, independent-risk
// ---------------------------------------------------------------------------
export function copiedEvidence(s, c) {
  const passP = s.value(0);
  const resP = s.value(0);
  const indepP = s.value(0);
  const riskP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.likelihood, seed: 9 }));
  s.add(decorAura(-320, 40, 440, '#5ce1e61c', '#07091000'));
  s.add(decorAura(400, 40, 460, '#a78bfa22', '#07091000'));

  const headline = heroTitle(['Copied Flag vs', 'Independent Evidence'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.likelihood,
    eyebrow: 'CONDITIONAL INDEPENDENCE CHECK',
  });

  const live = dynamic(() => {
    const ps = passP.value;
    const rs = resP.value;
    const ind = indepP.value;
    const rk = riskP.value;
    const nodes = [];

    // Left lane: Copied detector (same 590 IDs pass Gate 1 and Gate 2)
    const lx = -820;
    const gate1X = -590;
    const gate2X = -270;
    nodes.push(
      txt('COPIED FLAG SERVICE', lx, -225, 28, ROLE.clean, 'mono', 'left'),
      line([gate1X, -148], [gate1X, 110], { stroke: ROLE.clean, width: 3 }),
      txt('Gate 1', gate1X, -184, 26, COSMOS.muted, 'mono'),
      line([gate2X, -148], [gate2X, 110], { stroke: ROLE.warning, width: 3, dash: [8, 6] }),
      txt('Copied Gate 2', gate2X, -184, 26, ROLE.warning, 'mono'),
    );

    // Moving packets retaining exact IDs through both gates
    const pktX = mix(-730, -140, ps);
    const pktRows = [
      { id: 'A1–95', y: -85, col: ROLE.abuse, w: 120 },
      { id: 'C1–250', y: -5, col: ROLE.clean, w: 170 },
      { id: 'C251–495', y: 75, col: ROLE.clean, w: 170 },
    ];
    for (const row of pktRows) {
      nodes.push(
        rect(row.w, 50, { fill: '#121b31', stroke: row.col, width: 2.5, radius: 10 })
          .at(pktX, row.y)
          .glow(6, row.col),
        txt(row.id, pktX, row.y, 26, row.col, 'mono'),
      );
    }

    if (rs > 0.05) {
      nodes.push(
        group(
          txt('ALL 590 SIGNUPS SURVIVE', lx, 175, 26, ROLE.warning, 'mono', 'left'),
          txt('95 / 590  =  16.1%', lx, 248, 52, ROLE.posterior, 'mono', 'left').glow(
            10,
            ROLE.posterior,
          ),
          txt('Zero clean rows dropped', lx, 316, 28, COSMOS.muted, 'sans', 'left'),
        ).opacity(rs),
      );
    } else {
      nodes.push(txt('Which signups drop out?', lx, 225, 34, ROLE.posterior, 'serif', 'left'));
    }

    // Vertical divider line (subtle cosmic hair rule, not a top bar)
    nodes.push(rule(20, -210, 20, 340, '#2a3759', 2));

    // Right lane: Independent second test counterfactual (shows unsplit 590 baseline before splitting!)
    const rx = 95;
    const cleanAfter2 = mix(495, 24.75, ind);
    const abuseAfter2 = mix(95, 90.25, ind);
    const barW = 720;
    const redW = (abuseAfter2 / 590) * barW;
    const blueW = (cleanAfter2 / 590) * barW;
    const rightOp = mix(0.45, 1, ind);

    nodes.push(
      group(
        txt('TRULY INDEPENDENT SECOND TEST', rx, -225, 28, ROLE.likelihood, 'mono', 'left'),
        txt(
          ind > 0.2 ? 'Abuse:  0.95 × 0.95 = 90.25 rows' : 'Abuse:  95 rows entering Gate 2',
          rx,
          -135,
          28,
          ROLE.abuse,
          'mono',
          'left',
        ),
        txt(
          ind > 0.2 ? 'Clean:  0.05 × 0.05 = 24.75 rows' : 'Clean:  495 rows entering Gate 2',
          rx,
          -82,
          28,
          ROLE.clean,
          'mono',
          'left',
        ),
        scaleTrack(rx, 15, barW, 74, { stroke: '#3e4d78', radius: 12 }),
        glowBar(rx, 15, Math.max(10, redW), 68, ROLE.abuse, { glow: 10, radius: 10 }),
        glowBar(rx + redW + 4, 15, Math.max(10, blueW), 68, ROLE.clean, { glow: 8, radius: 10 }),
        txt(`${abuseAfter2.toFixed(1)} red`, rx, 95, 28, ROLE.abuse, 'mono', 'left'),
        txt(`${cleanAfter2.toFixed(1)} blue`, rx + 260, 95, 28, ROLE.clean, 'mono', 'left'),
      ).opacity(rightOp),
    );

    if (rk > 0.05) {
      nodes.push(
        group(
          txt('BOTH INDEPENDENT FLAGS', rx, 175, 26, ROLE.improved, 'mono', 'left'),
          txt('90.25 / 115  ≈  78.5%', rx, 248, 52, ROLE.improved, 'mono', 'left').glow(
            12,
            ROLE.improved,
          ),
          txt(
            'Nearly 4 in 5 flagged signups are abusive',
            rx,
            316,
            28,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(rk),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'copied-pass', passP, 1, { dur: 0.95 });
  cueTo(s, c, 'copied-result', resP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'independent-counterfactual', indepP, 1, { dur: 1.0 });
  cueTo(s, c, 'independent-risk', riskP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 10. posterior-contract: When can the function return a risk?
// Cues: invalid-prior, true-source, source-masses, empty-rates, empty-result*,
//       tiny-inputs, half-unit, round-half, clean-unit, raw-result*, log-normalize, stable-result*
// ---------------------------------------------------------------------------
export function posteriorContract(s, c) {
  const invP = s.value(0);
  const trueP = s.value(0);
  const massesP = s.value(0);
  const emptyP = s.value(0);
  const emptyResP = s.value(0);
  const tinyP = s.value(0);
  const halfP = s.value(0);
  const roundP = s.value(0);
  const cleanP = s.value(0);
  const rawResP = s.value(0);
  const logP = s.value(0);
  const stableP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.likelihood, seed: 10 }));
  s.add(decorAura(0, 30, 560, '#a78bfa1e', '#5ce1e612'));

  const headline = heroTitle(['Posterior Numerics', '& Log-Space Rescue'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.likelihood,
    eyebrow: 'DOMAIN CHECKS · EMPTY EVENTS · FLOAT64 SUBNORMALS',
  });

  // View 1: Domain validation, normal masses, and 0/0 empty queue
  const view1 = guardedDynamic(
    () => fadeOut(tinyP.value),
    (vis) => {
      const iv = invP.value;
      const tr = trueP.value;
      const ms = massesP.value;
      const em = emptyP.value;
      const er = emptyResP.value;
      const nodes = [];

      const barX = -760;
      const barY = 30;
      const barW = 1480;
      const scale = 1 - em;

      nodes.push(
        txt('INPUT DOMAIN:  prior, tpr, fpr ∈ [0, 1]', barX, -200, 28, COSMOS.cyan, 'mono', 'left'),
      );
      if (iv > 0.05 && em < 0.3) {
        nodes.push(
          txt('prior = 1.4  →  RangeError', 830, -200, 30, ROLE.abuse, 'mono', 'right')
            .glow(8, ROLE.abuse)
            .opacity(iv * (1 - em)),
        );
      }

      nodes.push(
        txt(
          em > 0.4 ? 'FLAG RATES TURNED TO 0.0' : 'DENOMINATOR STRIP  P(F) = P(A)TPR + P(¬A)FPR',
          barX,
          -65,
          26,
          em > 0.4 ? ROLE.warning : COSMOS.muted,
          'mono',
          'left',
        ),
        scaleTrack(barX, barY, barW, 74, { stroke: '#3c4f7a', radius: 12 }),
      );

      if (scale > 0.04) {
        const redW = barW * (95 / 590) * Math.max(0.02, tr) * scale;
        const blueW = barW * (495 / 590) * ms * scale;
        if (tr > 0.04) {
          nodes.push(glowBar(barX, barY, redW, 68, ROLE.abuse, { glow: 10, radius: 10 }));
        }
        if (ms > 0.04) {
          nodes.push(
            glowBar(barX + redW + 4, barY, blueW, 68, ROLE.clean, { glow: 8, radius: 10 }),
          );
        }
        nodes.push(
          txt('True mass: 0.01 × 0.95 = 0.0095', barX, 125, 28, ROLE.abuse, 'mono', 'left').opacity(
            tr,
          ),
          txt(
            'False mass: 0.99 × 0.05 = 0.0495',
            barX + 610,
            125,
            28,
            ROLE.clean,
            'mono',
            'left',
          ).opacity(ms),
        );
      }

      if (scale <= 0.04) {
        nodes.push(
          txt(
            '0 abusive flags  +  0 clean flags  =  empty queue',
            0,
            barY,
            30,
            ROLE.warning,
            'mono',
          ),
          txt('True mass: 0.01 × 0.00 = 0.0000', barX, 125, 28, COSMOS.dim, 'mono', 'left'),
          txt('False mass: 0.99 × 0.00 = 0.0000', barX + 610, 125, 28, COSMOS.dim, 'mono', 'left'),
        );
      }
      const preEmpty = fadeOut(er);
      if (preEmpty > 0.02) {
        nodes.push(
          glowTex(
            'P(A \\mid F) = \\frac{p \\cdot \\mathrm{tpr}}{p \\cdot \\mathrm{tpr} + (1 - p)\\cdot \\mathrm{fpr}}',
            {
              x: 0,
              y: 245,
              size: 42,
              color: COSMOS.muted,
            },
          ).opacity(preEmpty),
        );
      }

      const postEmpty = fadeIn(er);
      if (postEmpty > 0.02) {
        nodes.push(
          group(
            glowTex('\\frac{0}{0 + 0} \\quad \\Rightarrow \\quad \\text{Undefined (Empty Event)}', {
              x: 0,
              y: 245,
              size: 46,
              color: ROLE.warning,
            }),
          ).opacity(postEmpty),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2: Subnormal float64 rounding to 0 vs log-sum-exp rescue -> 1/3
  const view2 = guardedDynamic(
    () => fadeIn(tinyP.value),
    (vis) => {
      const hf = halfP.value;
      const rd = roundP.value;
      const cl = cleanP.value;
      const rr = rawResP.value;
      const lg = logP.value;
      const st = stableP.value;
      const nodes = [];

      // Left: Linear float64 subnormal axis (0 to 1 unit = MIN_VALUE ≈ 5e-324)
      const lx0 = -810;
      const lx1 = -90;
      const axisY = -30;
      const redPos = mix(mix(lx0, lx1, 0.5), lx0, rd);
      nodes.push(
        txt(
          'LINEAR FLOAT64  (1 unit = MIN_VALUE ≈ 5×10⁻³²⁴)',
          lx0,
          -210,
          26,
          ROLE.warning,
          'mono',
          'left',
        ),
        line([lx0, axisY], [lx1, axisY], { stroke: '#4a5d8a', width: 3.5 }),
        line([lx0, axisY - 18], [lx0, axisY + 18], { stroke: COSMOS.ink, width: 3 }),
        line([(lx0 + lx1) / 2, axisY - 12], [(lx0 + lx1) / 2, axisY + 12], {
          stroke: COSMOS.dim,
          width: 2,
        }),
        line([lx1, axisY - 18], [lx1, axisY + 18], { stroke: COSMOS.ink, width: 3 }),
        txt('0', lx0, axisY + 46, 28, COSMOS.ink, 'mono'),
        txt('0.5 unit', (lx0 + lx1) / 2, axisY + 46, 26, COSMOS.muted, 'mono'),
        txt('1 unit', lx1, axisY + 46, 28, COSMOS.ink, 'mono'),
      );
      if (hf > 0.05) {
        nodes.push(
          glowDot(redPos, axisY - 56, { radius: 14, color: ROLE.abuse, glow: 12 }),
          txt(
            rd > 0.6 ? 'Rounds to 0!' : '0.5 × 1 unit',
            redPos,
            axisY - 105,
            28,
            ROLE.abuse,
            'mono',
          ),
        );
      }
      if (cl > 0.05) {
        nodes.push(
          glowDot(lx1, axisY - 56, { radius: 14, color: ROLE.clean, glow: 12 }).opacity(cl),
          txt('Clean ≈ 1 unit', lx1 - 40, axisY - 105, 28, ROLE.clean, 'mono').opacity(cl),
        );
      }
      if (rr > 0.05) {
        nodes.push(
          group(
            txt('DIRECT DIVISION', lx0, 155, 26, ROLE.abuse, 'mono', 'left'),
            txt('0 / (0 + 1) = 0%  (WRONG!)', lx0, 222, 42, ROLE.abuse, 'mono', 'left').glow(
              10,
              ROLE.abuse,
            ),
          ).opacity(rr),
        );
      }

      nodes.push(rule(20, -210, 20, 320, '#2a3759', 2));

      // Right: Log-sum-exp elevation -> 0.5 / (0.5 + 1) = 1/3 (visible as quiet preview before log-normalize arrives)
      const rx = 95;
      nodes.push(
        group(
          txt('LOG-SUM-EXP NORMALIZATION', rx, -210, 26, ROLE.improved, 'mono', 'left'),
          glowTex('a = \\ln(p) + \\ln(\\text{tpr}),\\quad c = \\ln(1-p) + \\ln(\\text{fpr})', {
            x: rx + 365,
            y: -120,
            size: 32,
            color: COSMOS.ink,
          }),
          txt('Subtract max(a, c), then exponentiate:', rx, -30, 28, COSMOS.muted, 'sans', 'left'),
          scaleTrack(rx, 45, 700, 62, { stroke: ROLE.improved, radius: 12 }),
          glowBar(rx, 45, 700 * (1 / 3) * Math.max(0.15, lg), 56, ROLE.abuse, {
            glow: 10,
            radius: 10,
          }),
          glowBar(
            rx + 700 * (1 / 3) + 4,
            45,
            700 * (2 / 3) * Math.max(0.15, lg) - 4,
            56,
            ROLE.clean,
            {
              glow: 8,
              radius: 10,
            },
          ),
          txt('exp(a−m) = 0.5', rx, 115, 28, ROLE.abuse, 'mono', 'left'),
          txt('exp(c−m) = 1.0', rx + 340, 115, 28, ROLE.clean, 'mono', 'left'),
        ).opacity(mix(0.42, 1, lg)),
      );
      if (st > 0.05) {
        nodes.push(
          group(
            txt('RESCUED POSTERIOR', rx, 195, 26, ROLE.improved, 'mono', 'left'),
            txt('0.5 / 1.5  =  1/3  (33.3%)', rx, 265, 44, ROLE.improved, 'mono', 'left').glow(
              12,
              ROLE.improved,
            ),
          ).opacity(st),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'invalid-prior', invP, 1, { dur: 0.55 });
  cueTo(s, c, 'true-source', trueP, 1, { dur: 0.65 });
  cueTo(s, c, 'source-masses', massesP, 1, { dur: 0.65 });
  cueTo(s, c, 'empty-rates', emptyP, 1, { dur: 0.7 });
  cueTo(s, c, 'empty-result', emptyResP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'tiny-inputs', tinyP, 1, { dur: 0.85 });
  cueTo(s, c, 'half-unit', halfP, 1, { dur: 0.6 });
  cueTo(s, c, 'round-half', roundP, 1, { dur: 0.6 });
  cueTo(s, c, 'clean-unit', cleanP, 1, { dur: 0.55 });
  cueTo(s, c, 'raw-result', rawResP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'log-normalize', logP, 1, { dur: 0.85 });
  cueTo(s, c, 'stable-result', stableP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 11. likelihood: Freeze the labels, move the candidate rate
// Cues: likelihood-factors, likelihood-candidate, likelihood-maximum, count-sequences, count-answer*
// ---------------------------------------------------------------------------
export function likelihood(s, c) {
  const factP = s.value(0);
  const candP = s.value(0);
  const maxP = s.value(0);
  const seqP = s.value(0);
  const ansP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.posterior, seed: 11 }));
  s.add(decorAura(240, 40, 520, '#ffd1661e', '#a78bfa14'));

  const headline = heroTitle(['Freeze the Data,', 'Move the Parameter'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.posterior,
    eyebrow: 'LIKELIHOOD  L(p) = p²(1 − p)',
  });

  const live = dynamic(() => {
    const fc = factP.value;
    const cn = candP.value;
    const mx = maxP.value;
    const sq = seqP.value;
    const an = ansP.value;
    const nodes = [];

    // Live candidate p: 0.20 -> 0.80 -> 2/3
    const p = mx > 0.01 ? mix(0.8, 2 / 3, mx) : mix(0.2, 0.8, cn);
    const L = p * p * (1 - p);

    // Left: Fixed observed labels [Abuse, Clean, Abuse] + live assigned factors
    const lx = -840;
    const labels = [
      { tag: 'Abuse', factor: p, col: ROLE.abuse },
      { tag: 'Clean', factor: 1 - p, col: ROLE.clean },
      { tag: 'Abuse', factor: p, col: ROLE.abuse },
    ];
    nodes.push(txt('FIXED OBSERVED LABELS', lx, -210, 26, COSMOS.muted, 'mono', 'left'));
    labels.forEach((item, idx) => {
      const bx = lx + 95 + idx * 225;
      const by = -110;
      nodes.push(
        rect(190, 74, { fill: '#12192e', stroke: item.col, width: 2.6, radius: 14 })
          .at(bx, by)
          .glow(6, item.col),
        txt(item.tag, bx, by, 30, item.col, 'serif'),
      );
      if (fc > 0.1) {
        nodes.push(txt(item.factor.toFixed(2), bx, by + 76, 34, COSMOS.ink, 'mono').opacity(fc));
      }
    });

    nodes.push(
      txt(`Candidate p = ${p.toFixed(3)}`, lx, 55, 36, ROLE.posterior, 'mono', 'left'),
      txt(`Ordered L(p) = ${L.toFixed(4)}`, lx, 118, 42, COSMOS.ink, 'mono', 'left').glow(
        6,
        ROLE.posterior,
      ),
    );

    if (sq > 0.05) {
      nodes.push(
        group(
          txt('3 UNORDERED SEQUENCES (2 OF 3):', lx, 205, 26, ROLE.likelihood, 'mono', 'left'),
          txt('ACA   ·   AAC   ·   CAA', lx, 256, 32, ROLE.likelihood, 'mono', 'left'),
        ).opacity(sq),
      );
    }
    if (an > 0.05) {
      nodes.push(
        txt(
          'Count prob = 3 × L(p) = 0.444  (peak stays 2/3)',
          lx,
          325,
          28,
          ROLE.improved,
          'mono',
          'left',
        )
          .glow(6, ROLE.improved)
          .opacity(an),
      );
    }

    // Right: Glowing likelihood curve L(p) and 3*L(p)
    const gx0 = 20;
    const gx1 = 830;
    const gy0 = 260;
    const gy1 = -240;
    const xOf = (v) => gx0 + v * (gx1 - gx0);
    const yOf = (val) => gy0 - (val / 0.48) * (gy0 - gy1);

    nodes.push(
      line([gx0, gy0], [gx1, gy0], { stroke: '#425582', width: 2.8 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#425582', width: 2.8 }),
      txt('0', gx0, gy0 + 40, 26, COSMOS.muted, 'mono'),
      txt('2/3', xOf(2 / 3), gy0 + 40, 28, ROLE.posterior, 'mono'),
      txt('1', gx1, gy0 + 40, 26, COSMOS.muted, 'mono'),
      txt('Candidate rate p', (gx0 + gx1) / 2, gy0 + 88, 26, COSMOS.muted, 'sans'),
    );

    const ptsOrdered = [];
    const ptsBinom = [];
    for (let k = 0; k <= 80; k++) {
      const v = k / 80;
      const lv = v * v * (1 - v);
      ptsOrdered.push([xOf(v), yOf(lv)]);
      ptsBinom.push([xOf(v), yOf(3 * lv)]);
    }

    nodes.push(
      neonCurve(ptsOrdered, [ROLE.clean, ROLE.posterior], { width: 4.5, glow: 10 }),
      txt('Ordered: L(p) = p²(1−p)', gx1, gy1 - 54, 26, ROLE.posterior, 'mono', 'right'),
    );

    if (an > 0.05) {
      nodes.push(
        neonCurve(ptsBinom, [ROLE.likelihood, ROLE.improved], {
          width: 4.2,
          glow: 10,
          opacity: an,
        }),
        txt('Count: 3 p²(1−p)', gx1, gy1 - 14, 26, ROLE.improved, 'mono', 'right').opacity(an),
      );
    }

    // Vertical peak dashed line at 2/3
    if (mx > 0.2) {
      nodes.push(
        line([xOf(2 / 3), gy0], [xOf(2 / 3), yOf(an > 0.2 ? 4 / 9 : 4 / 27)], {
          stroke: ROLE.posterior,
          width: 2.4,
          dash: [8, 6],
        }).opacity(mx),
      );
    }

    // Active glowing bead on curve
    nodes.push(glowDot(xOf(p), yOf(L), { radius: 11, color: ROLE.posterior, glow: 14 }));

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'likelihood-factors', factP, 1, { dur: 0.7 });
  cueTo(s, c, 'likelihood-candidate', candP, 1, { dur: 1.0 });
  cueTo(s, c, 'likelihood-maximum', maxP, 1, { dur: 0.9 });
  cueTo(s, c, 'count-sequences', seqP, 1, { dur: 0.7 });
  cueTo(s, c, 'count-answer', ansP, 1, { after: true, dur: 0.7 });
}
