// Scene 05 (initialization): "An empty center cannot take a mean"
// Bad seeds A, B, (100,100) -> counts [1, 5, 0] -> empty group NaN guard -> reseed at farthest point F -> identity reset.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  EMPTY_REPAIR,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  aura,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  runAmbientPhase,
  tweenCue,
  txt,
  xy,
} from '../parts.mjs';

export default function initialization(s, c) {
  const phase = s.value(0);
  const showBad = s.value(0);
  const showCounts = s.value(0);
  const showEmpty = s.value(0);
  const repairAmt = s.value(0);
  const showAgain = s.value(0);
  const showCap = s.value(0);
  const showLocal = s.value(0);
  const stripColors = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a183b2c', '#133a4a18');
  const title = heroTitle(['Empty Centers', '& Reseeding Policy'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: DANGER_COLOR,
    eyebrow: 'DEGENERATE INITIALIZATION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const rep = repairAmt.value;
    const isRep = rep > 0.5;
    const noColor = stripColors.value > 0.5;
    const plot = makePlot(-820, -205, 810, 450, { x: [0, 10.5], y: [0, 5.4] });
    const assign = isRep ? EMPTY_REPAIR.after : EMPTY_REPAIR.before;

    // Seed 2 interpolates from off-screen corner (10.2, 5.0) to farthest point F (xy[5])
    const s2Pos = [
      10.1 + (xy[EMPTY_REPAIR.farthest][0] - 10.1) * rep,
      4.9 + (xy[EMPTY_REPAIR.farthest][1] - 4.9) * rep,
    ];
    const curCenters = [xy[0], xy[1], s2Pos];

    const nodes = [
      ...plot.axesNodes(0.85),
      txt(
        isRep ? 'REPAIRED: SEED 3 MOVED TO FARTHEST POINT F' : 'BAD SEEDS: A, B, AND (100, 100)',
        -855,
        -238,
        26,
        isRep ? COSMOS.emerald : DANGER_COLOR,
        'mono',
        'left',
      ),
    ];

    // Links to assigned seed
    if (showBad.value > 0.05) {
      xy.forEach((p, i) => {
        const k = assign[i];
        const col = noColor ? COSMOS.muted : GROUP_COLOR[k];
        nodes.push(
          line(plot.pt(p), plot.pt(curCenters[k]), { stroke: col, width: 2.6 }).opacity(
            showBad.value * 0.75,
          ),
        );
      });
    }

    // 6 message points
    xy.forEach((p, i) => {
      const [px, py] = plot.pt(p);
      const col = noColor ? COSMOS.ink : showBad.value > 0.3 ? GROUP_COLOR[assign[i]] : COSMOS.cyan;
      nodes.push(
        glowDot(px, py, { radius: 8.5, color: col, glow: 10 }),
        txt(
          LETTERS[i],
          px + (i === 0 ? -24 : i === 5 ? -34 : 0),
          py + (i === 0 ? 44 : -46),
          28,
          col,
          'mono',
        ),
      );
    });

    // 3 seed markers
    curCenters.forEach((ct, k) => {
      const [cx, cy] = plot.pt(ct);
      const isGhost = k === 2 && !isRep;
      nodes.push(
        glowRing(cx, cy, 20, isGhost ? DANGER_COLOR : GROUP_COLOR[k], {
          width: 3.2,
          dash: isGhost ? [7, 5] : undefined,
          glow: 10,
          opacity: 0.4 + 0.6 * showBad.value,
        }),
      );
      if (isGhost) {
        nodes.push(txt('(100, 100)', cx - 18, cy + 36, 26, DANGER_COLOR, 'mono', 'right'));
      }
    });

    // Right side: cluster count bars & repair policy
    const rx = 105;
    const counts = isRep ? [1, 3, 2] : EMPTY_REPAIR.counts;
    nodes.push(txt('ASSIGNMENT COUNTS', rx, -235, 26, COSMOS.cyan, 'mono', 'left'));
    counts.forEach((cnt, k) => {
      const y = -155 + k * 82;
      const bw = Math.max(8, cnt * 85);
      const col = cnt === 0 ? DANGER_COLOR : GROUP_COLOR[k];
      nodes.push(
        txt(`Center ${k + 1}:`, rx, y, 28, col, 'mono', 'left').opacity(
          0.45 + 0.55 * showCounts.value,
        ),
        lumBar(rx + 180 + bw / 2, y, bw, 40, {
          color: col,
          fillOpacity: cnt === 0 ? 0.16 : 0.72,
          glow: 8,
          opacity: 0.45 + 0.55 * showCounts.value,
        }),
        txt(
          cnt === 0 ? '0 points (EMPTY!)' : `${cnt} pts`,
          rx + 200 + bw,
          y,
          28,
          col,
          'mono',
          'left',
        ).opacity(0.45 + 0.55 * showCounts.value),
      );
    });

    if (showEmpty.value > 0.02 && !isRep) {
      nodes.push(
        txt(
          '0 / 0 = NaN  →  raise rather than poison centers',
          rx,
          102,
          26,
          DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(7, DANGER_COLOR)
          .opacity(showEmpty.value),
      );
    }

    if (showAgain.value > 0.02) {
      nodes.push(
        txt(
          'Reseed at farthest point F → all 3 groups nonempty',
          rx,
          102,
          26,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(showAgain.value),
      );
    }

    if (showCap.value > 0.02) {
      nodes.push(
        txt(
          'Deterministic ties: first center  ·  20-step cap',
          rx,
          178,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(showCap.value),
      );
    }

    if (showLocal.value > 0.02) {
      nodes.push(
        txt(
          'Settled! Compare total inertia across restarts',
          rx,
          250,
          28,
          QUERY_COLOR,
          'sans',
          'left',
        ).opacity(showLocal.value),
      );
    }

    if (noColor) {
      nodes.push(
        txt(
          'Colors come off: letters A–F stay fixed; cluster IDs are run-local',
          -855,
          335,
          28,
          COSMOS.ink,
          'sans',
          'left',
        )
          .glow(6, COSMOS.cyan)
          .opacity(stripColors.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.0);

  tweenCue(s, c, 'bad', showBad, 1, { duration: 0.5 });
  tweenCue(s, c, 'counts', showCounts, 1, { duration: 0.45 });
  tweenCue(s, c, 'empty', showEmpty, 1, { duration: 0.45 });
  tweenCue(s, c, 'repair', repairAmt, 1, { duration: 0.85 });
  tweenCue(s, c, 'again', showAgain, 1, { duration: 0.45 });
  tweenCue(s, c, 'cap', showCap, 1, { duration: 0.45 });
  tweenCue(s, c, 'local', showLocal, 1, { duration: 0.45 });
  tweenCue(s, c, 'identity-reset', stripColors, 1, { duration: 0.55 });
}
