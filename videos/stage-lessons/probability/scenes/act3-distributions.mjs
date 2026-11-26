// Act 3 (Scenes 12-16): Calibration Check, Distribution Support (Binomial/Poisson/Normal),
// Softmax & Categorical Sampling, Token Chain & Float64 Underflow Cascade, and Log-Loss Cliff.
import { arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  CALIBRATION_SIX,
  COSMOS,
  LOG_LOSS_MODELS,
  ROLE,
  TOKEN_CHAIN,
  TOKEN_LABELS,
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
  livingDrift,
  mix,
  neonCurve,
  nextLogits,
  nextProbabilities,
  probSoftmax,
  rule,
  scaleTrack,
  tokenDraws,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 12. calibration-check: Would you quote this score as a risk?
// Cues: bucket-labels, bucket-count*, bucket-gap*
// ---------------------------------------------------------------------------
export function calibrationCheck(s, c) {
  const labelsP = s.value(0);
  const countP = s.value(0);
  const gapP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.posterior, seed: 12 }));
  s.add(decorAura(120, 40, 520, '#ffd1661c', '#ff6b8b14'));

  const headline = heroTitle(['Scores vs', 'Calibrated Risk'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.posterior,
    eyebrow: 'SCORE BUCKET NEAR 0.80',
  });

  const live = dynamic(() => {
    const lb = labelsP.value;
    const cn = countP.value;
    const gp = gapP.value;
    const ph = drift.value;
    const nodes = [];

    // Six glowing score orbs near 0.80
    nodes.push(txt('SIX SIGNUPS SCORED NEAR 0.80', -855, -210, 26, COSMOS.muted, 'mono', 'left'));
    CALIBRATION_SIX.forEach((item, i) => {
      const cx = -740 + i * 285;
      const cy = -95;
      const reveal = Math.max(0, Math.min(1, lb * 1.4 - i * 0.08));
      const col = reveal > 0.5 ? (item.abusive ? ROLE.abuse : ROLE.clean) : ROLE.posterior;
      const pulse = 1 + 0.08 * Math.sin(ph * Math.PI * 8 + i);
      nodes.push(
        circle(54 * pulse, { fill: '#121a30', stroke: col, width: 3.2 })
          .at(cx, cy)
          .glow(9, col),
        txt(item.score.toFixed(2), cx, cy, 28, col, 'mono'),
        txt(
          reveal > 0.5 ? (item.abusive ? 'Abuse' : 'Clean') : '?',
          cx,
          cy + 86,
          28,
          reveal > 0.5 ? col : COSMOS.dim,
          'sans',
        ),
      );
    });

    // Shared probability ruler [0.0 -> 1.0]
    const rx0 = -760;
    const rx1 = 760;
    const ry = 135;
    const xOf = (p) => mix(rx0, rx1, p);
    nodes.push(
      line([rx0, ry], [rx1, ry], { stroke: '#465a8a', width: 3.5 }),
      txt('0.0', rx0, ry + 48, 28, COSMOS.muted, 'mono'),
      txt('0.5', xOf(0.5), ry + 48, 28, COSMOS.muted, 'mono'),
      txt('0.8', xOf(0.8), ry + 48, 28, ROLE.posterior, 'mono'),
      txt('1.0', rx1, ry + 48, 28, COSMOS.muted, 'mono'),
      // Average predicted score marker at 0.80
      glowDot(xOf(0.8), ry, { radius: 13, color: ROLE.posterior, glow: 14 }),
      txt('Avg score: 0.80', xOf(0.8), ry - 52, 28, ROLE.posterior, 'mono'),
    );

    if (cn > 0.05) {
      nodes.push(
        group(
          glowDot(xOf(0.5), ry, { radius: 13, color: ROLE.abuse, glow: 14 }),
          txt('Observed: 3 / 6 = 0.50', xOf(0.5), ry - 52, 30, ROLE.abuse, 'mono'),
        ).opacity(cn),
      );
    }

    if (gp > 0.05) {
      const midX = (xOf(0.5) + xOf(0.8)) / 2;
      nodes.push(
        group(
          line([xOf(0.5), ry + 115], [mix(xOf(0.5), xOf(0.8), gp), ry + 115], {
            stroke: ROLE.warning,
            width: 5,
          }).glow(10, ROLE.warning),
          txt(
            'Calibration gap: 30 percentage points',
            midX,
            ry + 175,
            34,
            ROLE.warning,
            'serif',
          ).glow(8, ROLE.warning),
        ).opacity(gp),
      );
    } else if (lb > 0.5 && cn < 0.05) {
      nodes.push(
        txt(
          'What fraction of these six is actually abusive?',
          0,
          ry + 150,
          34,
          ROLE.posterior,
          'serif',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'bucket-labels', labelsP, 1, { dur: 0.9 });
  cueTo(s, c, 'bucket-count', countP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'bucket-gap', gapP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 13. distribution-choice: What values can we observe?
// Cues: binomial-observation, binomial-pieces, binomial-expectation,
//       binomial-variance, poisson-model, continuous-error
// ---------------------------------------------------------------------------
export function distributionChoice(s, c) {
  const obsP = s.value(0);
  const piecesP = s.value(0);
  const expP = s.value(0);
  const varP = s.value(0);
  const poisP = s.value(0);
  const normP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clean, seed: 13 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61c', '#a78bfa16'));

  const headline = heroTitle(['Match the Support', 'to the Measurement'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.clean,
    eyebrow: 'BINOMIAL · POISSON · NORMAL',
  });

  // View 1: 10 Bernoulli orbs -> Binomial count -> sliding 10 x 0.01 = 0.10 expectation + variance
  const view1 = guardedDynamic(
    () => fadeOut(poisP.value),
    (vis) => {
      const ob = obsP.value;
      const pc = piecesP.value;
      const ex = expP.value;
      const vr = varP.value;
      const ph = drift.value;
      const nodes = [];

      nodes.push(
        txt('10 INDEPENDENT SIGNUPS  (p = 0.01 EACH)', -855, -205, 26, ROLE.clean, 'mono', 'left'),
      );

      for (let i = 0; i < 10; i++) {
        const cx = -760 + i * 165;
        const cy = -105;
        const isOne = i === 3;
        const col = isOne ? ROLE.abuse : ROLE.clean;
        const pulse = 1 + 0.09 * Math.sin(ph * Math.PI * 8 + i * 0.5);
        nodes.push(
          circle(30 * pulse, { fill: '#11192e', stroke: col, width: 2.6 })
            .at(cx, cy)
            .glow(7, col),
          txt(isOne ? '1' : '0', cx, cy, 30, col, 'mono'),
        );
      }

      if (ob > 0.05) {
        nodes.push(
          txt(
            'Observed batch sum:  1 abusive signup',
            -855,
            -10,
            32,
            ROLE.abuse,
            'sans',
            'left',
          ).opacity(ob),
        );
      }

      // Before binomial-pieces rises, show Binomial(10, 0.01) count-probability bar preview below
      const prePc = fadeOut(pc);
      if (prePc > 0.02) {
        const bx = -760;
        nodes.push(
          group(
            txt(
              'BINOMIAL(n = 10, p = 0.01)  COUNT PROBABILITIES',
              bx,
              85,
              26,
              COSMOS.muted,
              'mono',
              'left',
            ),
            txt('k = 0  (90.4%)', bx, 155, 28, ROLE.clean, 'mono', 'left'),
            glowBar(bx + 260, 155, 1080 * 0.904, 34, ROLE.clean, { glow: 8 }),
            txt('k = 1  (9.1%)', bx, 218, 28, ROLE.abuse, 'mono', 'left'),
            glowBar(bx + 260, 218, 1080 * 0.091, 34, ROLE.abuse, { glow: 10 }),
            txt('k ≥ 2  (0.4%)', bx, 280, 28, COSMOS.dim, 'mono', 'left'),
            glowBar(bx + 260, 280, 14, 34, COSMOS.dim, { glow: 0 }),
          ).opacity(prePc),
        );
      }

      // 10 expected pieces of 0.01 sliding together into a single 0.10 bar
      const pcVis = fadeIn(pc);
      if (pcVis > 0.02) {
        const rulerX = -760;
        const rulerY = 125;
        const segW = 72;
        nodes.push(
          group(
            txt(
              'EXPECTED CONTRIBUTION PER SIGNUP:  0.01',
              rulerX,
              rulerY - 62,
              26,
              ROLE.posterior,
              'mono',
              'left',
            ),
            line([rulerX, rulerY + 46], [rulerX + 1440, rulerY + 46], {
              stroke: '#3c4f7a',
              width: 2.5,
            }),
            ...Array.from({ length: 10 }, (_, i) => {
              const spreadX = rulerX + i * 150;
              const packedX = rulerX + i * (segW + 4);
              const x = mix(spreadX, packedX, ex);
              return glowBar(x, rulerY, segW, 40, ROLE.posterior, { glow: 8, radius: 6 });
            }),
            ex > 0.5
              ? glowTex('E[X] = n p = 10 \\times 0.01 = 0.10', {
                  x: -360,
                  y: 255,
                  size: 42,
                  color: ROLE.posterior,
                }).opacity(ex)
              : group(),
            vr > 0.05
              ? glowTex('\\mathrm{Var}[X] = n p (1-p) = 0.099', {
                  x: 420,
                  y: 255,
                  size: 42,
                  color: ROLE.clean,
                }).opacity(vr)
              : group(),
          ).opacity(pcVis),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2: Poisson(lambda=2) discrete count bars + Continuous Normal bell curve
  const view2 = guardedDynamic(
    () => fadeIn(poisP.value),
    (vis) => {
      const nm = normP.value;
      const ph = drift.value;
      const nodes = [];

      // Left: Poisson(lambda = 2) PMF bars k = 0..7
      const px0 = -800;
      const py0 = 230;
      const lam = 2;
      let fact = 1;
      nodes.push(
        txt('POISSON COUNTS  (λ = 2 / MIN)', px0, -205, 28, ROLE.posterior, 'mono', 'left'),
        txt('Mean = 2   ·   Variance = 2', px0, -162, 26, COSMOS.muted, 'mono', 'left'),
        line([px0 - 20, py0], [px0 + 700, py0], { stroke: '#425582', width: 2.6 }),
      );
      for (let k = 0; k <= 7; k++) {
        if (k > 1) fact *= k;
        const pmf = (Math.exp(-lam) * lam ** k) / fact;
        const barH = pmf * 920;
        const bx = px0 + k * 84;
        const isZero = k === 0;
        const col = isZero ? ROLE.posterior : ROLE.clean;
        nodes.push(
          rect(56, barH, { fill: col, stroke: null, radius: 8 })
            .at(bx + 28, py0 - barH / 2)
            .glow(isZero ? 12 : 6, col),
          txt(String(k), bx + 28, py0 + 36, 26, COSMOS.muted, 'mono'),
        );
      }
      nodes.push(
        txt('P(0) = e⁻² ≈ 0.135', px0, py0 - 305, 28, ROLE.posterior, 'mono', 'left').glow(
          6,
          ROLE.posterior,
        ),
        txt('Support: {0, 1, 2, ...}', px0, py0 + 96, 26, COSMOS.muted, 'sans', 'left'),
      );

      nodes.push(rule(20, -210, 20, 320, '#2a3759', 2));

      // Right: Continuous Normal bell curve (visible as quiet preview before continuous-error illuminates it)
      const nx0 = 100;
      const nx1 = 830;
      const ny0 = 230;
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const z = -3.2 + (i / 80) * 6.4;
        const pdf = Math.exp(-0.5 * z * z);
        pts.push([mix(nx0, nx1, i / 80), ny0 - pdf * 310]);
      }
      const beadT = 0.5 + 0.35 * Math.sin(ph * Math.PI * 6);
      const beadZ = -3.2 + beadT * 6.4;
      const beadX = mix(nx0, nx1, beadT);
      const beadY = ny0 - Math.exp(-0.5 * beadZ * beadZ) * 310;
      nodes.push(
        group(
          txt('CONTINUOUS NORMAL  (TIMING ERROR)', nx0, -205, 28, ROLE.likelihood, 'mono', 'left'),
          txt('Continuous support  (−∞, +∞)', nx0, -162, 26, COSMOS.muted, 'mono', 'left'),
          line([nx0, ny0], [nx1, ny0], { stroke: '#425582', width: 2.6 }),
          neonCurve(pts, [ROLE.clean, ROLE.likelihood, ROLE.clean], { width: 4.5, glow: 11 }),
          glowDot(beadX, beadY, { radius: 9, color: ROLE.posterior, glow: 12 }),
          txt('μ = 0 ms', (nx0 + nx1) / 2, ny0 + 38, 28, ROLE.likelihood, 'mono'),
          txt('Area over interval = probability', nx0, ny0 + 96, 26, COSMOS.muted, 'sans', 'left'),
        ).opacity(mix(0.45, 1, nm)),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'binomial-observation', obsP, 1, { dur: 0.7 });
  cueTo(s, c, 'binomial-pieces', piecesP, 1, { dur: 0.7 });
  cueTo(s, c, 'binomial-expectation', expP, 1, { dur: 0.95 });
  cueTo(s, c, 'binomial-variance', varP, 1, { dur: 0.65 });
  cueTo(s, c, 'poisson-model', poisP, 1, { dur: 0.95 });
  cueTo(s, c, 'continuous-error', normP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 14. softmax-sampling: Which token comes next?
// Cues: softmax-mass, softmax-shift, first-draw, second-draw, sampling-draws
// ---------------------------------------------------------------------------
export function softmaxSampling(s, c) {
  const massP = s.value(0);
  const shiftP = s.value(0);
  const draw1P = s.value(0);
  const draw2P = s.value(0);
  const drawsP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.token, seed: 14 }));
  s.add(decorAura(0, 40, 560, '#60a5fa20', '#ffd16614'));

  const headline = heroTitle(['Logits, Softmax', '& Sampling'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.token,
    eyebrow: 'PREFIX:  "function returns the ___"',
  });

  const colors = [ROLE.clean, ROLE.token, ROLE.likelihood, ROLE.warning];

  const live = dynamic(() => {
    const ms = massP.value;
    const sh = shiftP.value;
    const d1 = draw1P.value;
    const d2 = draw2P.value;
    const dr = drawsP.value;
    const ph = drift.value;
    const nodes = [];

    // Top row: 4 raw logits (shift down by max = 2.0 on softmax-shift)
    const maxLogit = Math.max(...nextLogits);
    nodes.push(
      txt(
        sh > 0.3 ? 'SHIFTED LOGITS  (z − max(z))' : 'RAW LOGITS  z',
        -855,
        -215,
        26,
        sh > 0.3 ? ROLE.improved : COSMOS.muted,
        'mono',
        'left',
      ),
    );
    if (sh > 0.3) {
      nodes.push(
        txt(
          'Gap 0.8  →  e⁰·⁸ ≈ 2.23× ratio (unchanged)',
          855,
          -215,
          26,
          ROLE.improved,
          'mono',
          'right',
        ),
      );
    }

    nextLogits.forEach((z, i) => {
      const zShown = z - sh * maxLogit;
      const cx = -640 + i * 425;
      const cy = -130;
      nodes.push(
        txt(TOKEN_LABELS[i], cx, cy - 34, 30, colors[i], 'mono'),
        txt(zShown.toFixed(1), cx, cy + 16, 40, COSMOS.ink, 'mono').glow(5, colors[i]),
      );
    });

    // Middle: Conserved [0, 1] Categorical sampling strip
    const sx = -810;
    const sy = 45;
    const sw = 1620;
    const shH = 82;
    nodes.push(
      txt(
        'CATEGORICAL PROBABILITY STRIP  (SUM = 1.000)',
        sx,
        sy - 76,
        26,
        ROLE.posterior,
        'mono',
        'left',
      ),
      scaleTrack(sx, sy, sw, shH, { stroke: '#3c4e7c', radius: 14 }),
    );

    let cursor = sx;
    const bounds = [];
    nextProbabilities.forEach((p, i) => {
      const w = p * sw * Math.max(0.05, ms);
      bounds.push([cursor, cursor + w]);
      if (ms > 0.05) {
        nodes.push(
          glowBar(cursor, sy, Math.max(8, w - 4), shH - 8, colors[i], {
            glow: 9,
            radius: 10,
            opacity: ms,
          }),
        );
        if (w > 220 && ms > 0.7) {
          nodes.push(
            txt(
              `${TOKEN_LABELS[i]} ${(p * 100).toFixed(1)}%`,
              cursor + w / 2,
              sy,
              28,
              '#070910',
              'mono',
            ),
          );
        }
      }
      cursor += w;
    });

    // Uniform sampling darts (strict P5 non-overlapping crossfade before 1,000 draws appear!)
    const dartVis = fadeOut(dr);
    if (d1 > 0.05 && dartVis > 0.02) {
      const u1 = 0.31;
      const dx1 = sx + u1 * sw;
      nodes.push(
        group(
          arrow([dx1, sy + 115], [dx1, sy + 48], { stroke: ROLE.posterior, width: 4 }),
          txt('Draw 1 → result', dx1, sy + 148, 30, ROLE.clean, 'mono').glow(6, ROLE.clean),
        ).opacity(d1 * dartVis),
      );
    }
    if (d2 > 0.05 && dartVis > 0.02) {
      const u2 = 0.935;
      const dx2 = sx + u2 * sw;
      nodes.push(
        group(
          arrow([dx2, sy + 115], [dx2, sy + 48], { stroke: ROLE.likelihood, width: 4 }),
          txt('Draw 2 → None', dx2 - 40, sy + 148, 30, ROLE.likelihood, 'mono').glow(
            6,
            ROLE.likelihood,
          ),
        ).opacity(d2 * dartVis),
      );
    }

    // 1,000 repeated draws live empirical count bars
    const histVis = fadeIn(dr);
    if (histVis > 0.02) {
      const nDraws = Math.max(10, Math.round(histVis * 1000));
      const counts = [0, 0, 0, 0];
      for (let i = 0; i < nDraws; i++) counts[tokenDraws[i]]++;
      nodes.push(
        group(
          txt(
            `1,000 REPEATED DRAWS (n = ${nDraws})  ·  E[result] ≈ 618`,
            sx,
            165,
            28,
            ROLE.posterior,
            'mono',
            'left',
          ),
          ...counts.flatMap((cnt, i) => {
            const bx = sx + i * 410;
            const by = 240;
            const bw = (cnt / 700) * 340;
            return [
              txt(`${TOKEN_LABELS[i]}: ${cnt}`, bx, by - 30, 28, colors[i], 'mono', 'left'),
              scaleTrack(bx, by + 12, 340, 26, { radius: 8 }),
              glowBar(bx, by + 12, Math.max(6, bw), 26, colors[i], { glow: 8, radius: 8 }),
            ];
          }),
        ).opacity(histVis),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'softmax-mass', massP, 1, { dur: 0.85 });
  cueTo(s, c, 'softmax-shift', shiftP, 1, { dur: 0.85 });
  cueTo(s, c, 'first-draw', draw1P, 1, { dur: 0.6 });
  cueTo(s, c, 'second-draw', draw2P, 1, { dur: 0.6 });
  cueTo(s, c, 'sampling-draws', drawsP, 1, { dur: 1.3 });
}

// ---------------------------------------------------------------------------
// 15. token-chain: What chance did the model give this line?
// Cues: chain-factors, chain-answer*, underflow-chain, token-loss, perplexity
// ---------------------------------------------------------------------------
export function tokenChain(s, c) {
  const factP = s.value(0);
  const ansP = s.value(0);
  const underP = s.value(0);
  const lossP = s.value(0);
  const pplP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.likelihood, seed: 15 }));
  s.add(decorAura(0, 30, 560, '#a78bfa22', '#ff6b8b14'));

  const headline = heroTitle(['Chain Rule,', 'Log Space & Perplexity'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.likelihood,
    eyebrow: 'SEQUENCE PROBABILITY  &  FLOAT64 UNDERFLOW',
  });

  // View 1: 3-token chain rule ("rain fell here": 0.5 * 0.2 * 0.1 = 0.01) + NLL/perplexity
  const view1 = guardedDynamic(
    () => Math.max(fadeOut(underP.value), fadeIn(lossP.value)),
    (vis) => {
      const fc = factP.value;
      const an = ansP.value;
      const ls = lossP.value;
      const pp = pplP.value;
      const nodes = [];

      const condLabels = ['P("rain")', 'P("fell" | rain)', 'P("here" | rain fell)'];
      TOKEN_CHAIN.words.forEach((word, i) => {
        const cx = -540 + i * 540;
        const cy = -100;
        const p = TOKEN_CHAIN.probs[i];
        const nll = TOKEN_CHAIN.nlls[i];
        nodes.push(
          rect(360, 128, { fill: '#11182c', stroke: ROLE.clean, width: 2.6, radius: 16 })
            .at(cx, cy)
            .glow(7, ROLE.clean),
          txt(word, cx, cy - 26, 40, COSMOS.ink, 'serif'),
          txt(condLabels[i], cx, cy - 92, 26, COSMOS.muted, 'mono'),
          txt(
            ls > 0.2 ? `−ln(${p}) = ${nll.toFixed(3)} nats` : `p = ${p.toFixed(1)}`,
            cx,
            cy + 28,
            ls > 0.2 ? 26 : 34,
            ls > 0.2 ? ROLE.warning : ROLE.posterior,
            'mono',
          ).opacity(Math.max(0.2, fc)),
        );
        if (i < 2) {
          nodes.push(txt(ls > 0.2 ? '+' : '×', cx + 270, cy, 44, ROLE.likelihood, 'mono'));
        }
      });

      if (ls > 0.15) {
        nodes.push(
          group(
            glowTex(
              '\\text{Mean NLL} = \\frac{0.693 + 1.609 + 2.303}{3} \\approx 1.535\\text{ nats/token}',
              { x: -160, y: 120, size: 40, color: ROLE.warning },
            ),
          ).opacity(ls),
        );
        if (pp > 0.05) {
          nodes.push(
            group(
              glowTex('\\text{Perplexity} = e^{1.535} \\approx 4.64', {
                x: -160,
                y: 255,
                size: 50,
                color: ROLE.improved,
              }),
            ).opacity(pp),
          );
        }
      } else if (an > 0.05) {
        nodes.push(
          group(
            glowTex('0.5 \\times 0.2 \\times 0.1 = 0.01', {
              x: 0,
              y: 145,
              size: 56,
              color: ROLE.posterior,
            }),
            txt(
              'Chain rule works even with strong prefix dependence',
              0,
              250,
              30,
              COSMOS.muted,
              'serif',
            ),
          ).opacity(an),
        );
      } else {
        nodes.push(
          txt(
            'What probability did the model give the whole line?',
            0,
            155,
            36,
            ROLE.posterior,
            'serif',
          ),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2: 200-token log-underflow cascade (float64 hits 0 at step 162, log-sum stays at -921.0)
  const view2 = guardedDynamic(
    () => fadeIn(underP.value) * fadeOut(lossP.value),
    (vis) => {
      const ph = drift.value;
      const prog = Math.min(1, underP.value * 1.1);
      const gx0 = -760;
      const gx1 = 760;
      const gyTop = -170;
      const gyBot = 250;
      const xOfStep = (k) => mix(gx0, gx1, k / 200);
      const yOfLog10 = (lg) => mix(gyTop, gyBot, Math.min(1, -lg / 430));

      const floorY = yOfLog10(-324); // float64 subnormal floor 10^-324
      const pts = [];
      const maxK = Math.max(2, Math.round(200 * prog));
      for (let k = 0; k <= maxK; k += 4) {
        pts.push([xOfStep(k), yOfLog10(-2 * k)]);
      }

      const nodes = [
        txt(
          '200 TOKENS AT p = 0.01 EACH  →  EXACT PRODUCT = 10⁻⁴⁰⁰',
          gx0,
          -235,
          28,
          ROLE.likelihood,
          'mono',
          'left',
        ),
        line([gx0, gyTop], [gx1, gyTop], { stroke: '#3c4e78', width: 2.2 }),
        line([gx0, gyTop], [gx0, gyBot], { stroke: '#3c4e78', width: 2.2 }),
        // Float64 underflow floor at -324 (step 162)
        line([gx0, floorY], [gx1, floorY], { stroke: ROLE.abuse, width: 3, dash: [12, 8] }).glow(
          8,
          ROLE.abuse,
        ),
        txt(
          'float64 underflow floor (≈ 10⁻³²⁴ at token 162)  →  0.0',
          gx0 + 24,
          floorY - 34,
          28,
          ROLE.abuse,
          'mono',
          'left',
        ),
        neonCurve(pts, [ROLE.clean, ROLE.likelihood, ROLE.improved], { width: 5, glow: 12 }),
        glowDot(xOfStep(maxK), yOfLog10(-2 * maxK), { radius: 11, color: ROLE.improved, glow: 14 }),
        txt(
          'Sum of natural logs = −921.0 nats (finite!)',
          gx1,
          gyBot + 62,
          34,
          ROLE.improved,
          'mono',
          'right',
        ).glow(8, ROLE.improved),
        txt('Token 0', gx0, gyTop - 28, 26, COSMOS.muted, 'mono', 'left'),
        txt('Token 200', gx1, gyTop - 28, 26, COSMOS.muted, 'mono', 'right'),
      ];

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'chain-factors', factP, 1, { dur: 0.7 });
  cueTo(s, c, 'chain-answer', ansP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'underflow-chain', underP, 1, { dur: 1.25 });
  cueTo(s, c, 'token-loss', lossP, 1, { dur: 0.85 });
  cueTo(s, c, 'perplexity', pplP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 16. log-loss: How much does the fourth token cost?
// Cues: surprise-curve, moderate-loss, unsure-loss, three-hits, loss-models, loss-mean*, loss-library
// ---------------------------------------------------------------------------
export function logLoss(s, c) {
  const curveP = s.value(0);
  const modP = s.value(0);
  const unsP = s.value(0);
  const hitsP = s.value(0);
  const missP = s.value(0);
  const meanP = s.value(0);
  const libP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.abuse, seed: 16 }));
  s.add(decorAura(-380, 30, 480, '#ff6b8b1e', '#ffd16610'));

  const headline = heroTitle(['Negative Log-Loss', 'Punishes Hubris'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.abuse,
    eyebrow: 'CROSS-ENTROPY SURPRISE  −ln(p)',
  });

  const live = dynamic(() => {
    const cv = curveP.value;
    const md = modP.value;
    const un = unsP.value;
    const ht = hitsP.value;
    const ms = missP.value;
    const mn = meanP.value;
    const lb = libP.value;
    const nodes = [];

    // Left: Glowing -ln(p) surprise cliff
    const gx0 = -810;
    const gx1 = -120;
    const gy0 = 260;
    const gy1 = -190;
    const xOf = (p) => mix(gx0, gx1, p);
    const yOf = (loss) => gy0 - (Math.min(7.2, loss) / 7.2) * (gy0 - gy1);

    const pts = [];
    for (let i = 1; i <= 90; i++) {
      const p = 0.0008 + (i / 90) * 0.9992;
      pts.push([xOf(p), yOf(-Math.log(p))]);
    }
    nodes.push(
      txt('SURPRISE CLIFF  −ln(p)', gx0, -225, 26, ROLE.abuse, 'mono', 'left'),
      line([gx0, gy0], [gx1, gy0], { stroke: '#425582', width: 2.6 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#425582', width: 2.6 }),
      neonCurve(pts, [ROLE.abuse, ROLE.warning, ROLE.clean], { width: 4.5, glow: 10 }),
      txt('p = 0.01 → 4.605', xOf(0.14), yOf(4.95), 26, ROLE.abuse, 'mono', 'left'),
      glowDot(xOf(0.01), yOf(4.605), { radius: 9, color: ROLE.abuse, glow: 12 }),
      txt('p = 0.90 → 0.105', xOf(0.48), yOf(1.65), 26, ROLE.clean, 'mono', 'left'),
      glowDot(xOf(0.9), yOf(0.105), { radius: 9, color: ROLE.clean, glow: 12 }),
      txt('Assigned probability p', (gx0 + gx1) / 2, gy0 + 52, 26, COSMOS.muted, 'sans'),
    );

    // Right: Three models compared on 4 targets (or PyTorch CrossEntropyLoss warning)
    const rx = 20;
    if (lb > 0.1) {
      const rawP = [0.7, 0.2, 0.1];
      const doubleSoft = probSoftmax(rawP);
      nodes.push(
        group(
          txt(
            'PYTORCH CROSSENTROPYLOSS EXPECTS LOGITS',
            rx,
            -225,
            26,
            ROLE.warning,
            'mono',
            'left',
          ),
          txt(
            'Passing probabilities applies softmax TWICE:',
            rx,
            -155,
            30,
            COSMOS.ink,
            'serif',
            'left',
          ),
          txt(
            `True prob:    p = ${rawP[0].toFixed(2)}  →  −ln = ${(-Math.log(rawP[0])).toFixed(3)}`,
            rx,
            -65,
            30,
            ROLE.improved,
            'mono',
            'left',
          ),
          scaleTrack(rx, -5, 760, 44, { stroke: ROLE.improved }),
          glowBar(rx, -5, 760 * rawP[0], 44, ROLE.improved, { glow: 9 }),
          txt(
            `Double-norm:  p' = ${doubleSoft[0].toFixed(2)}  →  −ln = ${(-Math.log(doubleSoft[0])).toFixed(3)}`,
            rx,
            90,
            30,
            ROLE.abuse,
            'mono',
            'left',
          ),
          scaleTrack(rx, 150, 760, 44, { stroke: ROLE.abuse }),
          glowBar(rx, 150, 760 * doubleSoft[0], 44, ROLE.abuse, { glow: 9 }),
          txt(
            'Always pass raw logits directly to CrossEntropyLoss',
            rx,
            260,
            28,
            ROLE.posterior,
            'serif',
            'left',
          ),
        ).opacity(lb),
      );
    } else {
      nodes.push(
        txt('4-TOKEN MEAN LOSS RACE (NATS)', rx, -225, 26, ROLE.posterior, 'mono', 'left'),
      );
      const modelShow = [md, un, Math.max(ht, ms)];
      LOG_LOSS_MODELS.forEach((m, idx) => {
        const show = modelShow[idx];
        if (show < 0.05) return;
        const rowY = -125 + idx * 165;
        const isOver = idx === 2;
        const barScale = 360; // pixels per 2.0 nats
        const dispMean = isOver ? (ms > 0.2 ? m.mean : 0.01) : m.mean;
        const meanLabel = isOver
          ? mn > 0.2
            ? `${m.mean.toFixed(3)} nats`
            : ms > 0.2
              ? '4th token: 6.908 nats!'
              : 'First 3 hits: 0.010 each'
          : `${m.mean.toFixed(3)} nats`;

        nodes.push(
          group(
            txt(m.name, rx, rowY - 36, 30, m.color, 'sans', 'left'),
            txt(
              meanLabel,
              rx + 790,
              rowY - 36,
              30,
              isOver && mn > 0.2 ? ROLE.abuse : COSMOS.ink,
              'mono',
              'right',
            ),
            scaleTrack(rx, rowY + 18, 790, 44, { stroke: '#324268', radius: 10 }),
            glowBar(rx, rowY + 18, Math.min(790, dispMean * barScale), 44, m.color, {
              glow: 10,
              radius: 10,
            }),
          ).opacity(show),
        );
      });
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'surprise-curve', curveP, 1, { dur: 0.7 });
  cueTo(s, c, 'moderate-loss', modP, 1, { dur: 0.65 });
  cueTo(s, c, 'unsure-loss', unsP, 1, { dur: 0.65 });
  cueTo(s, c, 'three-hits', hitsP, 1, { dur: 0.65 });
  cueTo(s, c, 'loss-models', missP, 1, { dur: 0.75 });
  cueTo(s, c, 'loss-mean', meanP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'loss-library', libP, 1, { dur: 0.8 });
}
