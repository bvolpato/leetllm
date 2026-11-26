// Scene 5: objective - "What does one competitor cost?"
// Pure Cinema: full 3-caption InfoNCE strip above dynamic counterfactual omissions (omit sky vs omit sleeper),
// transitioning cleanly into signed score-gradient force bars (P_j - y_j) / tau.
import { line } from 'vizmatic/stage';
import {
  COLORS,
  COSMOS,
  NAMES,
  ROLE,
  TAU,
  cinemaAtmosphere,
  comparisonRow,
  evaluate,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  txt,
  verifyInvariant,
} from '../parts.mjs';
import { poolGeometry } from '../pool.mjs';

export default function objective(s, c) {
  const rawScores = evaluate().scores;
  const full = comparisonRow(rawScores, TAU);
  const noSky = comparisonRow(rawScores, TAU, 0, [true, true, false]);
  const noDog = comparisonRow(rawScores, TAU, 0, [true, false, true]);
  verifyInvariant(
    noDog.loss < noSky.loss && noSky.loss < full.loss,
    'removing the close competitor lowers loss far more than removing the easy negative',
  );

  const pg = poolGeometry({
    query: 'Query: "A dog is running"',
    names: NAMES,
    colors: COLORS,
    scores: rawScores,
    all: full,
    tau: TAU,
    topY: -295,
    track1Y: 20,
    track2Y: 195,
    footY: 385,
  });

  const showFullLoss = s.value(0);
  const modeLower = s.value(0); // 0=none, 1=noSky, 2=noDog, 3=all+grad
  const showGradEq = s.value(0);
  const showForces = s.value(0);

  const title = heroTitle(['What does one competitor cost?'], {
    x: -850,
    y: -445,
    size: 50,
    accent: ROLE.focus,
  });

  const lossEq = glowTex(
    '\\mathcal{L} = -\\ln(P^+) \\qquad \\frac{\\partial \\mathcal{L}}{\\partial s_j} = \\frac{P_j - y_j}{\\tau}',
    {
      x: 340,
      y: -425,
      size: 32,
      color: ROLE.focus,
      glow: 5,
    },
  );

  const stageLayer = guardedDynamic(s.value(1), () => {
    const fl = showFullLoss.value;
    const ml = modeLower.value;
    const ge = showGradEq.value;
    const sf = showForces.value;
    const nodes = [
      pg.headerBar(1),
      pg.candidateRow({ showMass: true, opacity: 1 }),
      pg.stripView({
        y: pg.track1Y,
        caption: 'Full pool:  all three captions',
        row: full,
        masses: full.masses,
        showSegments: true,
        showResult: true,
        resultMode: fl > 0.3 ? 'loss' : 'share',
        opacity: 1,
      }),
    ];

    // Lower region: either counterfactual track (omit sky / omit sleeper) OR signed gradient force bars
    if (ml >= 0.5 && ml < 1.5) {
      nodes.push(
        pg.stripView({
          y: pg.track2Y,
          caption: 'Omit the sky  (loss barely moves)',
          row: noSky,
          masses: noSky.masses,
          showSegments: true,
          showResult: true,
          resultMode: 'loss',
          opacity: 1,
          captionColor: ROLE.unrelated,
        }),
        pg.footerLine(
          `L = −ln(target share) = ${noSky.loss.toFixed(4)} nats`,
          ROLE.focus,
          36,
          'mono',
          1,
        ),
      );
    } else if (ml >= 1.5 && ml < 2.5) {
      nodes.push(
        pg.stripView({
          y: pg.track2Y,
          caption: 'Restore sky · omit sleeping dog  (task becomes trivial)',
          row: noDog,
          masses: noDog.masses,
          showSegments: true,
          showResult: true,
          resultMode: 'loss',
          opacity: 1,
          captionColor: ROLE.positive,
        }),
        pg.footerLine(
          `L = −ln(target share) = ${noDog.loss.toFixed(4)} nats`,
          ROLE.positive,
          36,
          'mono',
          1,
        ),
      );
    } else if (sf > 0.05 || ge > 0.05) {
      // Visual signed raw-score derivative ruler for each candidate
      const zeroX = 0;
      const scale = 165; // px per unit gradient (~2.13 -> 351 px, clean gap before right-side labels)
      nodes.push(
        txt(
          'RAW-SCORE DERIVATIVES   ∂L / ∂s_j = (P_j − y_j) / τ   (descent moves opposite)',
          0,
          128,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(Math.max(ge, sf)),
        line([zeroX, 160], [zeroX, 336], { stroke: '#6c82b4', width: 2.2 }).opacity(
          Math.max(ge, sf),
        ),
      );
      if (sf > 0.05) {
        full.gradients.forEach((g, i) => {
          const gy = 185 + i * 62;
          const bw = Math.max(8, Math.abs(g) * scale);
          const bx = g < 0 ? zeroX - bw / 2 : zeroX + bw / 2;
          const col = COLORS[i];
          const signStr = `${g > 0 ? '+' : '−'}${Math.abs(g).toFixed(3)}`;
          const dirNote =
            g < 0 ? 'pull score UP' : Math.abs(g) > 0.1 ? 'push score DOWN' : 'negligible';
          nodes.push(
            lumBar(bx, gy, bw, 32, {
              color: col,
              fillAlpha: 0.44,
              strokeWidth: 2.2,
              glow: 8,
              radius: 6,
              opacity: sf,
            }),
            txt(NAMES[i], -835, gy, 28, col, 'sans', 'left').opacity(sf),
            txt(
              signStr,
              g < 0 ? zeroX - bw - 18 : zeroX + bw + 18,
              gy,
              28,
              col,
              'mono',
              g < 0 ? 'right' : 'left',
            ).opacity(sf),
            txt(dirNote, 835, gy, 26, COSMOS.muted, 'mono', 'right').opacity(sf),
          );
        });
      } else {
        nodes.push(
          pg.footerLine(
            'Target y = 1 for puppy, y = 0 for both competitors',
            ROLE.focus,
            32,
            'sans',
            ge,
          ),
        );
      }
    } else if (fl > 0.05) {
      nodes.push(
        pg.footerLine(
          `L = −ln(target share) = ${full.loss.toFixed(4)} nats`,
          ROLE.focus,
          38,
          'mono',
          fl,
        ),
      );
    } else {
      nodes.push(
        pg.footerLine(
          'Numerator = puppy mass   ·   Denominator = sum of all three masses',
          COSMOS.muted,
          30,
          'mono',
          1,
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.focus, ROLE.positive), title, lossEq, stageLayer);

  playAfter(s, c, 'objective-log', (d) => showFullLoss.to(1, { duration: d }), 0.45);
  playOn(s, c, 'objective-sky', (d) => modeLower.to(1, { duration: d }), 0.35);
  playOn(s, c, 'objective-sleeper', (d) => modeLower.to(2, { duration: d }), 0.35);
  playOn(s, c, 'objective-all', (d) => modeLower.to(3, { duration: d }), 0.35);
  playOn(s, c, 'objective-gradient', (d) => showGradEq.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'objective-directions', (d) => showForces.to(1, { duration: d }), 0.55);
}
