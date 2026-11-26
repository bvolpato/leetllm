// Scene 02: How far can one sum reach? Orbiting 3D binary reduction pyramid + 2D live numeric tree.
import {
  COSMOS,
  REDUCTION,
  aura,
  bezier3d,
  box3d,
  cinematic3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  number,
  orbitScene,
  points3d,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

function buildReductionPyramid3d(phaseVal, levelStateVal) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.05,
    distance: 15.8,
    unit: 112,
    focus: [0, 0, 0.75],
  }).at(430, 15);

  const zLevels = [2.4, 1.5, 0.55, -0.4];
  const levelColors = [COSMOS.blue, COSMOS.cyan, COSMOS.gold, COSMOS.emerald];
  const nodeCoords = [];

  REDUCTION.forEach((vals, lvl) => {
    const coords = [];
    const span = 5.0;
    const step = vals.length > 1 ? span / (vals.length - 1) : 0;
    vals.forEach((_, i) => {
      const x = vals.length > 1 ? -span * 0.5 + i * step : 0;
      const y = (lvl - 1.5) * 0.45;
      const z = zLevels[lvl];
      coords.push([x, y, z]);
      const col = levelColors[lvl];
      const half = lvl === 3 ? 0.34 : 0.24;
      view.add(
        ...box3d(
          x - half,
          y - half,
          z - 0.14,
          half * 2,
          half * 2,
          0.28,
          lvl === 3 ? '#13423c' : '#132444',
          col,
          0.74,
        ),
      );
    });
    nodeCoords.push(coords);
  });

  const arcs = [];
  for (let lvl = 0; lvl < 3; lvl++) {
    nodeCoords[lvl + 1].forEach((parent, idx) => {
      const cL = nodeCoords[lvl][idx * 2];
      const cR = nodeCoords[lvl][idx * 2 + 1];
      const col = levelColors[lvl + 1];
      const aL = bezier3d(cL, parent, 0.22, col, 2.8);
      const aR = bezier3d(cR, parent, 0.22, col, 2.8);
      arcs.push({ lvl: lvl + 1, arc: aL, col }, { lvl: lvl + 1, arc: aR, col });
      view.add(aL.node, aR.node);
    });
  }

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const st = levelStateVal.value;
      const pts = [];
      for (let i = 0; i < arcs.length; i++) {
        const entry = arcs[i];
        if (st >= entry.lvl - 0.1) {
          const t = (p * 0.55 + i * 0.13) % 1;
          pts.push(entry.arc.evalAt(t));
        }
      }
      return pts.length ? pts : [[0, 0, zLevels[0]]];
    },
    {
      colorAt: (idx) => (idx % 2 === 0 ? COSMOS.gold : COSMOS.cyan),
      radius: 5.5,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );
  view.add(photons);
  return view;
}

export default function pairwiseReduction(s, c) {
  const phase = s.value(0);
  const level1 = s.value(0);
  const parallelGlow = s.value(0);
  const level2 = s.value(0);
  const level3 = s.value(0);
  const showDepth = s.value(0);
  const showWork = s.value(0);

  const bgAura = aura(430, 15, 520, '#5ce1e624', '#6ee7b716');
  const pyramid3d = buildReductionPyramid3d(phase, level3);

  const title = heroTitle(['Pairwise', 'Reduction Tree'], {
    x: -855,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'PARALLEL REDUCTION · BINARY TREE',
  });

  const tree2d = guardedDynamic(1, () => {
    const p = phase.value;
    const l1 = level1.value;
    const pg = parallelGlow.value;
    const l2 = level2.value;
    const l3 = level3.value;
    const dep = showDepth.value;
    const wrk = showWork.value;

    const xLeft = -845;
    const width = 940;
    const rowYs = [-170, -25, 120, 265];
    const rowColors = [COSMOS.blue, COSMOS.cyan, COSMOS.gold, COSMOS.emerald];
    const alphas = [1, l1, l2, l3];
    const nodes = [
      txt('3D HARDWARE TREE PYRAMID', 430, -395, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
    ];

    const pos = REDUCTION.map((vals, lvl) => {
      const step = width / vals.length;
      return vals.map((_, i) => [xLeft + (i + 0.5) * step, rowYs[lvl]]);
    });

    // Draw glowing edges between levels
    for (let lvl = 0; lvl < 3; lvl++) {
      const a = alphas[lvl + 1];
      if (a < 0.02) continue;
      pos[lvl + 1].forEach((parPt, idx) => {
        const cL = pos[lvl][idx * 2];
        const cR = pos[lvl][idx * 2 + 1];
        const col = rowColors[lvl + 1];
        nodes.push(
          glowingArc([cL[0], cL[1] + 34], [parPt[0], parPt[1] - 34], 10, {
            color: col,
            width: 3.0,
            opacity: 0.85 * a,
            core: false,
          }),
          glowingArc([cR[0], cR[1] + 34], [parPt[0], parPt[1] - 34], 10, {
            color: col,
            width: 3.0,
            opacity: 0.85 * a,
            core: false,
          }),
        );
      });
    }

    // Draw tree value cells
    REDUCTION.forEach((vals, lvl) => {
      const a = alphas[lvl];
      if (a < 0.02) return;
      const cellW = lvl === 0 ? 96 : lvl === 3 ? 160 : 124;
      const col = rowColors[lvl];
      const highlightPath = dep > 0.5 && lvl >= 0;
      vals.forEach((v, i) => {
        const [cx, cy] = pos[lvl][i];
        const isFirstPath = highlightPath && i === 0;
        const stroke = isFirstPath ? COSMOS.gold : col;
        const fill = lvl === 3 ? '#0e2824' : pg > 0.5 && lvl === 1 ? '#12283d' : '#10182b';
        nodes.push(
          glassCell(cx, cy, cellW, 66, stroke, {
            fill,
            glow: isFirstPath || (pg > 0.5 && lvl === 1) ? 10 : 6,
            opacity: a,
          }),
          txt(number(v), cx, cy, lvl === 3 ? 40 : 32, stroke, 'mono')
            .glow(lvl === 3 ? 8 : 0, stroke)
            .opacity(a),
        );
      });
    });

    // Traveling pulse dot on active level
    if (l1 > 0.5 && l3 < 0.5) {
      const u = (p * 0.7) % 1;
      const targetRow = l2 > 0.5 ? 2 : 1;
      const pts = pos[targetRow];
      const px = pts[0][0] + u * (pts.at(-1)[0] - pts[0][0]);
      nodes.push(glowDot(px, rowYs[targetRow] - 46, { radius: 5, color: COSMOS.gold }));
    }

    // Bottom metrics readout
    if (dep > 0.02 || wrk > 0.02) {
      const ma = Math.max(dep, wrk);
      nodes.push(
        glassCell(0, 392, 1460, 82, COSMOS.gold, {
          fill: '#181611',
          glow: 9,
          opacity: ma,
        }),
        txt(
          dep > 0.02
            ? '3 dependency stages  ·  4 + 2 + 1 = 7 additions  ·  root = 11'
            : '4 + 2 + 1 = 7 additions',
          0,
          392,
          28,
          COSMOS.gold,
          'mono',
        ).opacity(ma),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, pyramid3d, title, tree2d);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pyramid3d, { theta: 0.25, phi: 0.92 });

  c.on('reduction-neighbor-pairs', () => s.play(level1.to(1, { duration: 0.5 })));
  c.on('reduction-parallel-partials', () => s.play(parallelGlow.to(1, { duration: 0.45 })));
  c.on('reduction-partial-pairs', () => s.play(level2.to(1, { duration: 0.55 })));
  c.after('reduction-final-add', () => s.play(level3.to(1, { duration: 0.45 })));
  c.on('reduction-tree-depth', () => s.play(showDepth.to(1, { duration: 0.4 })));
  c.on('reduction-work', () =>
    s.play(showWork.to(1, { duration: remainDuration(c, 'reduction-work', 0.45) })),
  );
}
