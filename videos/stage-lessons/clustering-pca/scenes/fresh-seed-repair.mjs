// Scene 10 (fresh-seed-repair): "What changes when we stretch the square?"
// 8x2 rectangle: left-edge seeds settle at J = 64 (4 links of 4); bottom-corner restart settles at J = 4 (4 links of 1)!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  GROUP_COLOR,
  QUERY_COLOR,
  aura,
  distance,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  makePlot,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const RECT_PTS = [
  [0, 0],
  [0, 2],
  [8, 0],
  [8, 2],
];

export default function freshSeedRepair(s, c) {
  const phase = s.value(0);
  const stretch = s.value(0); // 0 = 2x2 square, 1 = 8x2 rectangle
  const showSeeds = s.value(0);
  const showAssign = s.value(0);
  const showPredict = s.value(0);
  const moveBadMean = s.value(0);
  const showBadVal = s.value(0);
  const showSettled = s.value(0);
  const restartRun = s.value(0); // 0 = bad left-edge run, 1 = bottom-corner run
  const showNewPairs = s.value(0);
  const moveGoodMean = s.value(0);
  const showGoodVal = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a183b2e', '#133a4a18');
  const title = heroTitle(['Stretch the Square:', 'Comparing Local Minima'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: QUERY_COLOR,
    eyebrow: 'RESTARTS & OBJECTIVE COMPARISON',
  });

  const live = guardedDynamic(s.value(1), () => {
    const st = stretch.value;
    const isRestart = restartRun.value > 0.5;
    const plot = makePlot(-760, -210, 1180, 340, { x: [-0.8, 8.8], y: [-1.15, 2.9] });

    const pts = RECT_PTS.map(([x, y]) => [x === 8 ? 2 + 6 * st : x, y]);
    const c0 = !isRestart ? [4 * moveBadMean.value, 0] : [0, 1 * moveGoodMean.value];
    const c1 = !isRestart ? [4 * moveBadMean.value, 2] : [8, 1 * moveGoodMean.value];
    const centers = [c0, c1];
    const assign = isRestart ? [0, 0, 1, 1] : [0, 1, 0, 1];

    const nodes = [
      ...plot.axesNodes(0.8),
      txt(
        `WIDTH = ${(2 + 6 * st).toFixed(1)}   ·   HEIGHT = 2.0`,
        -760,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    // Links from each corner to its assigned center
    if (showAssign.value > 0.02) {
      pts.forEach((p, i) => {
        const k = assign[i];
        const col = isRestart
          ? GROUP_COLOR[k]
          : showBadVal.value > 0.5
            ? DANGER_COLOR
            : GROUP_COLOR[k];
        nodes.push(
          line(plot.pt(p), plot.pt(centers[k]), { stroke: col, width: 3.5 }).opacity(
            isRestart ? Math.max(0.4, showNewPairs.value) : showAssign.value,
          ),
        );
      });
    }

    // 4 rectangle points
    pts.forEach((p, i) => {
      const [px, py] = plot.pt(p);
      const col = showAssign.value > 0.2 ? GROUP_COLOR[assign[i]] : COSMOS.cyan;
      nodes.push(
        glowDot(px, py, { radius: 9.5, color: col, glow: 12 }),
        txt(
          `(${p[0].toFixed(0)}, ${p[1].toFixed(0)})`,
          px,
          py + (p[1] === 0 ? 48 : -48),
          26,
          col,
          'mono',
        ),
      );
    });

    // 2 centers
    if (showSeeds.value > 0.02) {
      centers.forEach((ct, k) => {
        const [cx, cy] = plot.pt(ct);
        nodes.push(
          glowRing(cx, cy, 18, QUERY_COLOR, { width: 3.5, glow: 12, opacity: showSeeds.value }),
          glowDot(cx, cy, { radius: 5.5, color: QUERY_COLOR, glow: 11, opacity: showSeeds.value }),
        );
      });
    }

    // Right ledger: retain BOTH runs' totals for direct comparison!
    const rx = 490;
    nodes.push(
      txt('CONVERGED RUNS', rx, -210, 26, COSMOS.muted, 'mono', 'left'),
      txt('Run 1 (left seeds):', rx, -135, 28, DANGER_COLOR, 'mono', 'left').opacity(
        0.35 + 0.65 * showBadVal.value,
      ),
      txt(
        showBadVal.value > 0.5 ? 'J₁ = 4 × 4² = 64' : 'J₁ = ?',
        rx,
        -82,
        36,
        DANGER_COLOR,
        'mono',
        'left',
      )
        .glow(showBadVal.value > 0.5 ? 7 : 0, DANGER_COLOR)
        .opacity(0.4 + 0.6 * showBadVal.value),
      rule(rx, -20, 840, -20, COSMOS.rule, 2).opacity(0.6),
      txt('Run 2 (bottom seeds):', rx, 35, 28, COSMOS.emerald, 'mono', 'left').opacity(
        0.3 + 0.7 * restartRun.value,
      ),
      txt(
        showGoodVal.value > 0.5 ? 'J₂ = 4 × 1² = 4' : 'J₂ = ?',
        rx,
        92,
        36,
        COSMOS.emerald,
        'mono',
        'left',
      )
        .glow(showGoodVal.value > 0.5 ? 8 : 0, COSMOS.emerald)
        .opacity(0.3 + 0.7 * restartRun.value),
    );

    // Bottom prediction -> answer handoff (strict withholding!)
    const pOp = showPredict.value * Math.max(0, 1 - moveBadMean.value * 2.6);
    if (pOp > 0.02) {
      nodes.push(
        txt(
          'Where will both means land, and what squared error will remain?',
          -760,
          245,
          32,
          QUERY_COLOR,
          'serif',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(pOp),
      );
    }

    const badOp = showSettled.value * Math.max(0, 1 - restartRun.value * 2.6);
    if (badOp > 0.02) {
      nodes.push(
        txt(
          'Trapped at x = 4 (link = 4, J = 64): assignments stay fixed.',
          -760,
          245,
          28,
          DANGER_COLOR,
          'sans',
          'left',
        ).opacity(badOp),
      );
    }

    if (showGoodVal.value > 0.02) {
      const errNow = pts.reduce((acc, p, i) => acc + distance(p, centers[assign[i]]) ** 2, 0);
      nodes.push(
        txt(
          `16× lower inertia (J = ${errNow.toFixed(0)} vs 64): compare restarts under the same objective!`,
          -760,
          245,
          30,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(7, COSMOS.emerald)
          .opacity(showGoodVal.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'stretch', stretch, 1, { duration: 0.85 });
  tweenCue(s, c, 'seeds', showSeeds, 1, { duration: 0.45 });
  tweenCue(s, c, 'assign', showAssign, 1, { duration: 0.45 });
  tweenCue(s, c, 'predict', showPredict, 1, { duration: 0.45 });
  tweenCue(s, c, 'mean', moveBadMean, 1, { duration: 0.75, after: true });
  tweenCue(s, c, 'bad', showBadVal, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'settled', showSettled, 1, { duration: 0.45 });
  tweenCue(s, c, 'restart', restartRun, 1, { duration: 0.55 });
  tweenCue(s, c, 'newpairs', showNewPairs, 1, { duration: 0.45 });
  tweenCue(s, c, 'bettermean', moveGoodMean, 1, { duration: 0.75 });
  tweenCue(s, c, 'good', showGoodVal, 1, { duration: 0.45, after: true });
}
