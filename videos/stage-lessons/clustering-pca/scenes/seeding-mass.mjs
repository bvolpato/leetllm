// Scene 06 (seeding-mass): "Where does the next seed land?"
// k-means++ D^2-weighted probability strip from A -> draw u=0.80 lands in F -> recompute min dist to {A,F} -> 8(ln k + 2) bound.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  SEED_MASS_A,
  SEED_MASS_AF,
  aura,
  glowDot,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  makePlot,
  massRibbon,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  xy,
} from '../parts.mjs';

const COLORS_6 = [
  COSMOS.dim,
  COSMOS.cyan,
  COSMOS.blue,
  COSMOS.emerald,
  COSMOS.violet,
  COSMOS.amber,
];

export default function seedingMass(s, c) {
  const phase = s.value(0);
  const showFirst = s.value(0);
  const showSmall = s.value(0);
  const showLarge = s.value(0);
  const showWeights = s.value(0);
  const showNorm = s.value(0);
  const showDraw = s.value(0);
  const showPredict = s.value(0);
  const showSelected = s.value(0);
  const recomputeMix = s.value(0);
  const showZero = s.value(0);
  const showBound = s.value(0);
  const showGreedy = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a32', '#2a1c4f18');
  const title = heroTitle(['k-means++ Seeding:', 'Where Does Next Seed Land?'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: QUERY_COLOR,
    eyebrow: 'D²-WEIGHTED PROBABILITY STRIP',
  });

  const eqBound = glowTex('\\mathbb{E}[J_{\\text{init}}] \\le 8(\\ln k + 2)\\, J^*', {
    x: 470,
    y: 350,
    size: 38,
    color: QUERY_COLOR,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const rec = recomputeMix.value;
    const probs = SEED_MASS_A.probabilities.map(
      (p, i) => p + (SEED_MASS_AF.probabilities[i] - p) * rec,
    );
    const plot = makePlot(-835, -245, 720, 355, { x: [0, 10], y: [0, 5.2] });
    const aPt = plot.pt(xy[0]);
    const bPt = plot.pt(xy[1]);
    const fPt = plot.pt(xy[5]);

    const nodes = [
      ...plot.axesNodes(0.85),
      txt(
        rec > 0.5 ? 'ACTIVE SEEDS: {A, F}  (E SHRINKS!)' : 'FIRST SEED: A',
        -855,
        -275,
        26,
        QUERY_COLOR,
        'mono',
        'left',
      ),
    ];

    if (showSmall.value > 0.02) {
      nodes.push(line(aPt, bPt, { stroke: COSMOS.cyan, width: 3.5 }).opacity(showSmall.value));
    }
    if (showLarge.value > 0.02) {
      nodes.push(line(aPt, fPt, { stroke: COSMOS.amber, width: 3.8 }).opacity(showLarge.value));
    }

    xy.forEach((p, i) => {
      const [px, py] = plot.pt(p);
      const isSeed = i === 0 || (i === 5 && showSelected.value > 0.5);
      nodes.push(
        glowDot(px, py, { radius: 8, color: COLORS_6[i], glow: 9 }),
        txt(
          LETTERS[i],
          px + (i === 0 ? -28 : i === 4 ? -34 : i === 5 ? 30 : 0),
          py + (i === 0 ? 34 : i === 4 ? 12 : -34),
          26,
          COLORS_6[i],
          'mono',
        ),
      );
      if (isSeed) {
        nodes.push(
          glowRing(px, py, 20, QUERY_COLOR, {
            width: 3.2,
            glow: 10,
            opacity: i === 0 ? Math.max(0.4, showFirst.value) : showSelected.value,
          }),
        );
      }
    });

    // Right side: D^2 table for all 6 messages
    const rx = 20;
    const curWeights = rec > 0.5 ? SEED_MASS_AF.weights : SEED_MASS_A.weights;
    nodes.push(
      txt(
        rec > 0.5 ? 'SQUARED DISTANCES TO NEAREST OF {A, F}' : 'SQUARED DISTANCES D² FROM SEED A',
        rx,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    );
    LETTERS.forEach((L, i) => {
      const y = -188 + i * 48;
      const shareStr = showNorm.value > 0.3 ? `  (${(probs[i] * 100).toFixed(1)}%)` : '';
      nodes.push(
        txt(
          `${L}:  D² = ${curWeights[i].toFixed(2)}${shareStr}`,
          rx,
          y,
          26,
          COLORS_6[i],
          'mono',
          'left',
        ).opacity(0.4 + 0.6 * showWeights.value),
      );
    });

    // Bottom: full-width D^2 probability strip [0.00 .. 1.00] with draw marker at u = 0.80
    const sLeft = -835;
    const sW = 1670;
    const sY = 210;
    nodes.push(
      txt(
        rec > 0.5
          ? 'REBUILT PROBABILITY STRIP (F = 0%, E SHRINKS)'
          : 'PROBABILITY STRIP (TOTAL D² = 157.4)',
        sLeft,
        sY - 56,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      ...massRibbon(sLeft, sY, sW, 60, probs, COLORS_6),
      txt('0.0', sLeft, sY + 66, 26, COSMOS.muted, 'mono', 'left'),
      txt('1.0', sLeft + sW, sY + 66, 26, COSMOS.muted, 'mono', 'right'),
    );

    // Label large intervals cleanly below the strip (offset F safely away from both u=0.80 and 1.0!)
    let acc = 0;
    probs.forEach((pr, i) => {
      const mid = sLeft + (acc + pr / 2) * sW;
      if (pr > 0.08) {
        nodes.push(
          txt(
            LETTERS[i],
            i === 5 ? Math.min(sLeft + sW - 70, mid + 32) : mid,
            sY + 66,
            28,
            COLORS_6[i],
            'mono',
          ),
        );
      }
      acc += pr;
    });

    // Supplied draw at u = 0.80 (inside F's interval [0.589, 1.000]!)
    if (showDraw.value > 0.02 && rec < 0.3) {
      const dx = sLeft + 0.8 * sW;
      nodes.push(
        rule(dx, sY - 52, dx, sY + 42, QUERY_COLOR, 4).opacity(showDraw.value),
        glowDot(dx, sY - 52, { radius: 8, color: QUERY_COLOR, glow: 13, opacity: showDraw.value }),
        txt('u = 0.80', dx, sY - 82, 28, QUERY_COLOR, 'mono').opacity(showDraw.value),
      );
    }

    // Non-overlapping prediction -> answer -> theorem notes along bottom
    const pOp = showPredict.value * Math.max(0, 1 - showSelected.value * 2.6);
    if (pOp > 0.02) {
      nodes.push(
        txt(
          'Which message interval contains draw u = 0.80?',
          -835,
          345,
          32,
          QUERY_COLOR,
          'serif',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(pOp),
      );
    }
    const selOp =
      Math.max(0, (showSelected.value - 0.45) / 0.55) * Math.max(0, 1 - showBound.value * 2.6);
    if (selOp > 0.02) {
      nodes.push(
        txt(
          showZero.value > 0.5
            ? 'All distinct locations chosen → total D² = 0'
            : 'F gets the next seed! E is close to F, so E’s share collapses.',
          -835,
          345,
          28,
          COSMOS.amber,
          'mono',
          'left',
        )
          .glow(6, COSMOS.amber)
          .opacity(selOp),
      );
    }
    const bOp = Math.max(0, (showBound.value - 0.45) / 0.55);
    if (bOp > 0.02) {
      nodes.push(
        txt(
          showGreedy.value > 0.5
            ? 'Greedy k-means++ tests several candidates per draw; set n_init explicitly'
            : 'Expected-start theorem (average over random starts, not every single run)',
          -835,
          350,
          26,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(bOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'first', showFirst, 1, { duration: 0.4 });
  tweenCue(s, c, 'small', showSmall, 1, { duration: 0.45 });
  tweenCue(s, c, 'large', showLarge, 1, { duration: 0.45 });
  tweenCue(s, c, 'weights', showWeights, 1, { duration: 0.45 });
  tweenCue(s, c, 'normalize', showNorm, 1, { duration: 0.45 });
  tweenCue(s, c, 'draw', showDraw, 1, { duration: 0.45 });
  tweenCue(s, c, 'predict', showPredict, 1, { duration: 0.45 });
  tweenCue(s, c, 'selected', showSelected, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'recompute', recomputeMix, 1, { duration: 0.75 });
  tweenCue(s, c, 'zero', showZero, 1, { duration: 0.4 });
  tweenCue(s, c, 'bound', showBound, 1, { duration: 0.45 });
  c.show('bound', eqBound);
  tweenCue(s, c, 'greedy', showGreedy, 1, { duration: 0.45 });
}
