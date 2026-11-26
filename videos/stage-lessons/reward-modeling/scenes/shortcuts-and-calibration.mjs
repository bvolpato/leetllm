// Scene 18: Two forecasts pick the same winner: fixed-order 4 votes, per-ballot squared errors, Brier score 0.1875 vs 0.2451.
import {
  BRIER_75,
  BRIER_75_ERRS,
  BRIER_99,
  BRIER_99_ERRS,
  BRIER_VOTES,
  COSMOS,
  afterDuration,
  aura,
  circle,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  radialDial,
  rect,
  runPhase,
  txt,
} from '../parts.mjs';

export default function shortcutsAndCalibration(s, c) {
  const phase = s.value(0);
  const showVotes = s.value(0.45);
  const showMiss = s.value(0);
  const showAllErrs = s.value(0);
  const revealBrier = s.value(0);

  const bgAura = aura(120, 15, 580, '#5ce1e61e', '#ff6b8b16');
  const title = heroTitle(['Calibration &', 'Brier Score'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'FIXED A/B ORDER · SAME 75% ACCURACY, DIFFERENT FIT',
  });

  const eq = glowTex(String.raw`\text{BS} = \frac{1}{4}\sum_{i=1}^{4}(p - z_i)^2`, {
    x: 470,
    y: -365,
    size: 40,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const sv = showVotes.value;
    const sm = showMiss.value;
    const sa = showAllErrs.value;
    const rb = revealBrier.value;

    const voteX = [-440, -250, -60, 130];
    const voteY = -175;
    const baseY75 = 130;
    const baseY99 = 355;
    const maxBarH = 140;

    const nodes = [
      // Top row: Fixed 4 reviewer ballots (A, A, A, B -> z = 1, 1, 1, 0)
      txt('4 FIXED BALLOTS', -855, voteY - 12, 26, COSMOS.muted, 'mono', 'left'),
      txt('Both get 3/4 right', -855, voteY + 26, 26, COSMOS.gold, 'mono', 'left'),
    ];

    BRIER_VOTES.forEach((z, i) => {
      const col = z === 1 ? COSMOS.emerald : COSMOS.rose;
      const isMiss = z === 0;
      nodes.push(
        circle(38, { fill: '#101a2d', stroke: col, width: isMiss && sm > 0.4 ? 4.2 : 2.8 })
          .at(voteX[i], voteY)
          .glow(isMiss && sm > 0.4 ? 12 : 6, col)
          .opacity(Math.max(0.5, sv)),
        txt(z === 1 ? 'A' : 'B', voteX[i], voteY - 4, 30, col, 'mono').opacity(Math.max(0.5, sv)),
        txt(`z=${z}`, voteX[i], voteY + 62, 26, COSMOS.muted, 'mono').opacity(Math.max(0.5, sv)),
      );
    });

    // Forecast 1 row: p(A) = 0.75
    nodes.push(
      txt('FORECAST 1', -855, baseY75 - 88, 26, COSMOS.muted, 'mono', 'left'),
      txt('p(A) = 0.75', -855, baseY75 - 38, 38, COSMOS.cyan, 'mono', 'left').glow(6, COSMOS.cyan),
      line([-520, baseY75], [225, baseY75], { stroke: '#3c4d78', width: 2.5 }),
    );

    // Forecast 2 row: p(A) = 0.99
    nodes.push(
      txt('FORECAST 2', -855, baseY99 - 88, 26, COSMOS.muted, 'mono', 'left'),
      txt('p(A) = 0.99', -855, baseY99 - 38, 38, COSMOS.amber, 'mono', 'left').glow(
        6,
        COSMOS.amber,
      ),
      line([-520, baseY99], [225, baseY99], { stroke: '#3c4d78', width: 2.5 }),
    );

    // Squared error towers per ballot (strictly hidden during Beat 0 hold!)
    BRIER_VOTES.forEach((z, i) => {
      const showThis = z === 0 ? sm : sa;
      if (showThis > 0.05) {
        const e75 = BRIER_75_ERRS[i];
        const e99 = BRIER_99_ERRS[i];
        const h75 = Math.max(8, e75 * maxBarH) * showThis;
        const h99 = Math.max(8, e99 * maxBarH) * showThis;
        nodes.push(
          rect(88, h75, { fill: COSMOS.cyan, stroke: '#ffffff', width: 1.2, radius: 5 })
            .at(voteX[i], baseY75 - h75 * 0.5)
            .glow(7, COSMOS.cyan)
            .opacity(0.9 * showThis),
          txt(e75.toFixed(4), voteX[i], baseY75 - h75 - 24, 26, COSMOS.cyan, 'mono').opacity(
            showThis,
          ),

          rect(88, h99, {
            fill: z === 0 ? COSMOS.rose : COSMOS.amber,
            stroke: '#ffffff',
            width: 1.2,
            radius: 5,
          })
            .at(voteX[i], baseY99 - h99 * 0.5)
            .glow(z === 0 ? 12 : 6, z === 0 ? COSMOS.rose : COSMOS.amber)
            .opacity(0.92 * showThis),
          txt(
            e99.toFixed(4),
            voteX[i],
            baseY99 - h99 - 24,
            26,
            z === 0 ? COSMOS.rose : COSMOS.amber,
            'mono',
          ).opacity(showThis),
        );
      } else {
        // Pre-reveal dim placeholder ticks so quadrants stay balanced while withholding errors
        nodes.push(
          txt('?', voteX[i], baseY75 - 32, 28, COSMOS.dim, 'mono'),
          txt('?', voteX[i], baseY99 - 32, 28, COSMOS.dim, 'mono'),
        );
      }
    });

    // Right side: Brier Score Radial Dials (strictly withheld until revealBrier > 0.5!)
    const dialX = 560;
    nodes.push(
      txt('BRIER SCORE (LOWER WINS)', dialX, -238, 26, COSMOS.gold, 'mono'),
      radialDial(dialX, baseY75 - 102, 78, rb > 0.5 ? BRIER_75 * 2.5 : 0.08, {
        color: rb > 0.5 ? COSMOS.emerald : COSMOS.cyan,
        width: 10,
        glow: rb > 0.5 ? 12 : 4,
      }),
      txt(
        rb > 0.5 ? BRIER_75.toFixed(4) : '?',
        dialX,
        baseY75 - 98,
        34,
        rb > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(7, rb > 0.5 ? COSMOS.emerald : COSMOS.gold),
      txt(
        rb > 0.5 ? '0.75 WINS ✓' : 'p = 0.75',
        dialX,
        baseY75 + 10,
        26,
        rb > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),

      radialDial(dialX, baseY99 - 52, 78, rb > 0.5 ? BRIER_99 * 2.5 : 0.08, {
        color: rb > 0.5 ? COSMOS.rose : COSMOS.amber,
        width: 10,
        glow: rb > 0.5 ? 10 : 4,
      }),
      txt(
        rb > 0.5 ? BRIER_99.toFixed(4) : '?',
        dialX,
        baseY99 - 48,
        34,
        rb > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ).glow(7, rb > 0.5 ? COSMOS.rose : COSMOS.gold),
      txt(
        rb > 0.5 ? 'overconfident miss' : 'p = 0.99',
        dialX,
        baseY99 + 60,
        26,
        rb > 0.5 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('calibration-votes', () => s.play(showVotes.to(1, { duration: 0.45 })));
  c.on('calibration-miss', () => s.play(showMiss.to(1, { duration: 0.55 })));
  c.on('calibration-build', () => s.play(showAllErrs.to(1, { duration: 0.55 })));
  c.after('calibration-average', () =>
    s.play(revealBrier.to(1, { duration: afterDuration(c, 'calibration-average', 0.5) })),
  );
}
