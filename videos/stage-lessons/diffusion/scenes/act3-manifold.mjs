// Act 3: Score Vector Field & Posterior Decomposition, 3D Morphing Probability Density
// Manifold (Showcase Scene), DDIM Tabletop Jump, and DDIM Stochasticity Fork (eta).
import {
  Node,
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  group,
  line,
  line3d,
  point3d,
  points3d,
  rect,
  scalarField,
  surface,
} from 'vizmatic/stage';
import { cinematic3d, orbitScene } from '../../cinematic-kit.mjs';
import {
  CENTERS,
  COSMOS,
  MAX_ADDED_VARIANCE,
  SCORE_PROBE,
  TOP_JUMP,
  TOP_PIXEL,
  aura,
  blend,
  brightnessRuler,
  cinemaGrid,
  cueTo,
  ddimTerms,
  decimal,
  densityContours,
  exposure,
  glassPlate,
  glowTex,
  guardedDynamic,
  imageNoise,
  livingDrift,
  manifoldZ,
  mixture,
  photonWire,
  pixelGrid,
  polyPath,
  pulseCue,
  trajectories,
  trajectoryPoint,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 10. score: A map of promising directions
// Cues: score-beat-1-focus-1, score-beat-1-focus-2, df-score-0,
//       score-beat-2-focus-1, score-beat-2-focus-2, df-score-1,
//       score-conversion, df-score-2
// ---------------------------------------------------------------------------
export function score(s, c) {
  const addedVar = s.value(0.08);
  const arrowsVis = s.value(0);
  const decompP = s.value(0);
  const convVis = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.42 }));
  s.add(aura(-220, -10, 560, '#2a588a28', '#151e3d12'));

  // World space [-4.2, 4.2] x [-2.6, 2.6] -> stage space centered at (-230, 8)
  const plotCx = -230;
  const plotCy = 8;
  const scaleX = 140;
  const scaleY = 132;
  const mapX = (wx) => plotCx + wx * scaleX;
  const mapY = (wy) => plotCy - wy * scaleY;

  // Luminous scalarField backdrop driven smoothly by addedVar
  const densityGlow = scalarField(
    (wx, wy) => mixture([wx, wy], Math.max(0.04, addedVar.value)).density,
    {
      x: [-4.2, 4.2],
      y: [-2.6, 2.6],
      domain: [0.002, 0.22],
      colors: ['#07091000', '#1d2d6b52', '#552f966a', '#1e88c878', '#5ce1e686', '#ffd16692'],
      width: 8.4 * scaleX,
      height: 5.2 * scaleY,
      resolution: [72, 48],
    },
  )
    .at(plotCx, plotCy)
    .set('blend', 'screen');

  const convEq = glowTex(
    String.raw`s_\theta(x_t, t) = -\frac{\epsilon_\theta(x_t, t)}{\sqrt{1 - \bar\alpha_t}}`,
    { x: 615, y: 278, size: 38, color: COSMOS.gold, glow: 8 },
  );

  const compColors = [COSMOS.cyan, COSMOS.violet, COSMOS.emerald];

  const liveField = dynamic(() => {
    const v = Math.max(0.02, addedVar.value);
    const aV = arrowsVis.value;
    const dP = decompP.value;
    const probeMix = mixture(SCORE_PROBE, v, { includeComponents: true });
    const contours = densityContours(v);

    const screenParts = [];
    for (const ct of contours) {
      const pts = ct.points.map(([wx, wy]) => [mapX(wx), mapY(wy)]);
      if (pts.length < 2) continue;
      const alpha = Math.min(0.68, 0.22 + ct.level * 1.1);
      screenParts.push(new Node(polyPath(pts)).stroke(COSMOS.cyan, 1.8, alpha));
    }

    // Score vector field quiver
    if (aV > 0.04) {
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 9; col++) {
          const q = [-3.4 + col * 0.85, -1.85 + row * 0.92];
          if (Math.hypot(q[0] - SCORE_PROBE[0], q[1] - SCORE_PROBE[1]) < 0.72) continue;
          const sc = mixture(q, v).score;
          const mag = Math.hypot(sc[0], sc[1]);
          if (mag < 1e-4) continue;
          const len = Math.min(54, 18 + mag * 26);
          const sx = mapX(q[0]);
          const sy = mapY(q[1]);
          const colHex = mag > 1.2 ? COSMOS.gold : mag > 0.6 ? COSMOS.cyan : COSMOS.violet;
          screenParts.push(
            arrow([sx, sy], [sx + (sc[0] / mag) * len, sy - (sc[1] / mag) * len], {
              stroke: colHex,
              width: 2.6,
              tip: 9,
            })
              .glow(4, colHex)
              .opacity(0.82 * aV),
          );
        }
      }
    }

    const nodes = [
      txt('EXACT 2D MIXTURE SCORE FIELD  ∇ log p_t(x)', plotCx, -396, 30, COSMOS.cyan, 'mono'),
      rect(8.4 * scaleX, 5.2 * scaleY, {
        fill: null,
        stroke: '#334670',
        width: 2,
        radius: 14,
      }).at(plotCx, plotCy),
      group(...screenParts).set('blend', 'screen'),
    ];

    // 3 exact mode centers
    CENTERS.forEach(([cx, cy], idx) => {
      const pulse = 1 + 0.14 * Math.sin(drift.value * Math.PI * 10 + idx * 2.1);
      nodes.push(
        circle(12 * pulse, { fill: null, stroke: compColors[idx], width: 2.6 })
          .at(mapX(cx), mapY(cy))
          .glow(8, compColors[idx]),
        dot(5.5, '#ffffff').at(mapX(cx), mapY(cy)),
      );
    });

    // Selected probe & head-to-tail posterior-weighted component decomposition
    const pSx = mapX(SCORE_PROBE[0]);
    const pSy = mapY(SCORE_PROBE[1]);
    const vecScale = 195;

    if (dP > 0.04) {
      let curX = pSx;
      let curY = pSy;
      probeMix.components.forEach((comp, idx) => {
        const segP = Math.max(0, Math.min(1, dP * 3 - idx * 0.65));
        if (segP <= 0.01) return;
        const dx = comp.contribution[0] * vecScale * segP;
        const dy = -comp.contribution[1] * vecScale * segP;
        const nx = curX + dx;
        const ny = curY + dy;
        nodes.push(
          arrow([curX, curY], [nx, ny], {
            stroke: compColors[idx],
            width: 5.2,
            tip: 13,
          }).glow(10, compColors[idx]),
        );
        curX = nx;
        curY = ny;
      });
    }

    // Aggregate score arrow at probe
    if (aV > 0.08) {
      const aggX = pSx + probeMix.score[0] * vecScale;
      const aggY = pSy - probeMix.score[1] * vecScale;
      nodes.push(
        arrow([pSx, pSy], [aggX, aggY], {
          stroke: COSMOS.gold,
          width: 6.2,
          tip: 16,
        })
          .glow(12, COSMOS.gold)
          .opacity(aV),
        dot(11, COSMOS.gold).at(pSx, pSy).glow(14, COSMOS.gold),
        dot(4.5, '#ffffff').at(pSx, pSy),
      );
    }

    // Right info column (cleanly separated from plot)
    const rx = 615;
    nodes.push(
      glassPlate(rx, -105, 490, 560, { stroke: '#3c5080', glow: 6 }),
      txt('NOISE LEVEL', rx, -335, 26, COSMOS.muted, 'mono'),
      txt(`added σ² = ${v.toFixed(2)}`, rx, -280, 38, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan),
      line([rx - 205, -234], [rx + 205, -234], { stroke: '#2c3d66', width: 1.6 }),
      txt('PROBE POSTERIOR WEIGHTS', rx, -190, 26, COSMOS.muted, 'mono'),
      ...probeMix.components.flatMap((comp, idx) => {
        const yy = -126 + idx * 82;
        const barW = 280;
        const fillW = Math.max(8, barW * comp.posteriorWeight);
        return [
          txt(`Mode ${idx + 1}`, rx - 205, yy, 26, compColors[idx], 'mono', 'left'),
          txt(
            `${(comp.posteriorWeight * 100).toFixed(1)}%`,
            rx + 205,
            yy,
            28,
            compColors[idx],
            'mono',
            'right',
          ),
          rect(barW, 10, { fill: '#17223c', stroke: null, radius: 5 }).at(rx - 40, yy + 32),
          rect(fillW, 10, { fill: compColors[idx], stroke: null, radius: 5 })
            .at(rx - 40 - barW / 2 + fillW / 2, yy + 32)
            .glow(6, compColors[idx]),
        ];
      }),
      line([rx - 205, 110], [rx + 205, 110], { stroke: '#2c3d66', width: 1.6 }),
      txt(
        `score = (${decimal(probeMix.score[0], 2)}, ${decimal(probeMix.score[1], 2)})`,
        rx,
        146,
        28,
        COSMOS.gold,
        'mono',
      ),
      txt(
        'Gaussian score connects noise prediction to density gradient',
        plotCx,
        420,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(densityGlow, liveField);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'score-beat-1-focus-1', addedVar, 0.14, { dur: 0.7 });
  cueTo(s, c, 'score-beat-1-focus-2', addedVar, 1.35, { dur: 2.2 });
  pulseCue(s, c, 'df-score-0', convVis, 0.01, { dur: 0.2 });

  cueTo(s, c, 'score-beat-2-focus-1', arrowsVis, 1, { dur: 0.85 });
  cueTo(s, c, 'score-beat-2-focus-2', decompP, 1, { dur: 1.6 });
  pulseCue(s, c, 'df-score-1', addedVar, 1.15, { dur: 1.2 });

  c.show('score-conversion', convEq);
  pulseCue(s, c, 'df-score-2', convVis, 1, { dur: 0.4 });
}

// ---------------------------------------------------------------------------
// 11. transport: Watch the distribution take shape (SIGNATURE 3D SHOWCASE!)
// Cues: transport-beat-1-focus-1, df-transport-0,
//       transport-beat-2-focus-1, transport-beat-2-focus-2, df-transport-1,
//       transport-beat-3-focus-1, transport-beat-3-focus-2, df-transport-2
// ---------------------------------------------------------------------------
// Select 18 hero/ambient trajectories evenly from exact RK4 paths that stay strictly inside [-3.0, 3.0]
const INTERIOR_TRAJS = trajectories
  .map((path, idx) => ({
    idx,
    ok: path.every(([x, y]) => Math.abs(x) <= 3.05 && Math.abs(y) <= 3.05),
  }))
  .filter((entry) => entry.ok)
  .map((entry) => entry.idx);
const HERO_TRAJ_INDICES = Array.from(
  { length: Math.min(18, INTERIOR_TRAJS.length) },
  (_, i) =>
    INTERIOR_TRAJS[Math.floor((i * INTERIOR_TRAJS.length) / Math.min(18, INTERIOR_TRAJS.length))],
);
const TRAJ_COLORS = [COSMOS.gold, COSMOS.cyan, COSMOS.violet];

export function transport(s, c) {
  const flowP = s.value(0.06); // 0 = broad noisy Gaussian (var=3.0), 1 = sharp 3 modes (var=0.0)
  const cuePulse = s.value(0);

  s.add(aura(230, 15, 580, '#552f962e', '#1e7fc418'));
  s.add(aura(-560, 150, 380, '#2a588a20', '#11162600'));

  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 14.8,
    unit: 136,
    ambient: 0.38,
    shine: 0.4,
    brightness: 1.14,
    fog: 0.08,
    focus: [0, 0, 0.85],
  }).at(245, 22);

  // Live morphing high-resolution 3D probability density manifold from exact mixture()!
  const HALF = 3.2;
  const densitySurface = surface(
    (wx, wy) => {
      const addedVar = MAX_ADDED_VARIANCE * (1 - flowP.value);
      return manifoldZ(wx, wy, addedVar);
    },
    {
      x: [-HALF, HALF],
      y: [-HALF, HALF],
      resolution: [52, 52],
      animate: true,
      colors: ['#060a18', '#191f57', '#552f96', '#1e7fc4', '#5ce1e6', '#ffd166', '#fff7d6'],
      mesh: '#80ecff',
      meshOpacity: 0.15,
      meshWidth: 0.55,
      opacity: 0.9,
    },
  );

  // Subtle 3D floor crosshairs
  const floorLines = [
    line3d([-HALF, 0, 0.03], [HALF, 0, 0.03], { color: '#3b4e7d', width: 1.4, opacity: 0.48 }),
    line3d([0, -HALF, 0.03], [0, HALF, 0.03], { color: '#3b4e7d', width: 1.4, opacity: 0.48 }),
  ];

  // 18 draped glowing curve3d exact probability-flow ODE trajectories climbing the manifold!
  const drapedCurves = HERO_TRAJ_INDICES.map((trajIdx, k) => {
    const isHero = k % 3 === 0;
    const col = TRAJ_COLORS[k % 3];
    return curve3d(
      (u) => {
        const pt = trajectoryPoint(trajIdx, u);
        const clampedX = Math.max(-HALF, Math.min(HALF, pt[0]));
        const clampedY = Math.max(-HALF, Math.min(HALF, pt[1]));
        const varU = MAX_ADDED_VARIANCE * (1 - u);
        const z = manifoldZ(clampedX, clampedY, varU) + 0.14;
        return [clampedX, clampedY, z];
      },
      0,
      1,
      {
        samples: 44,
        color: col,
        width: isHero ? 3.4 : 2.1,
        glow: 9,
        blend: 'screen',
        opacity: isHero ? 0.92 : 0.54,
        onTop: true,
      },
    );
  });

  // 3 luminous summit beacons perched cleanly on the exact 3 CENTERS
  const summitBeacons = CENTERS.map(([mx, my]) =>
    point3d(
      () => {
        const addedVar = MAX_ADDED_VARIANCE * (1 - flowP.value);
        return [mx, my, manifoldZ(mx, my, addedVar) + 0.14];
      },
      {
        color: '#fff7d6',
        radius: 8.5,
        glow: 15,
        blend: 'screen',
        onTop: true,
      },
    ),
  );

  // All 72 exact RK4 probability-flow ODE particles riding smoothly along the morphing manifold!
  const riders = points3d(
    () => {
      const p = flowP.value;
      const addedVar = MAX_ADDED_VARIANCE * (1 - p);
      return trajectories.map((_, idx) => {
        const pt = trajectoryPoint(idx, p);
        const cx = Math.max(-HALF, Math.min(HALF, pt[0]));
        const cy = Math.max(-HALF, Math.min(HALF, pt[1]));
        return [cx, cy, manifoldZ(cx, cy, addedVar) + 0.17];
      });
    },
    {
      colorAt: (idx) => (idx % 4 === 0 ? '#ffffff' : idx % 2 === 0 ? COSMOS.gold : COSMOS.cyan),
      radius: 5.4,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view3d.add(densitySurface, ...floorLines, ...drapedCurves, ...summitBeacons, riders);

  const odeEq = glowTex(
    String.raw`\frac{dx}{d\sigma^2} = -\frac{1}{2}\,\nabla_x \log p_{\sigma^2}(x)`,
    {
      x: -600,
      y: -115,
      size: 36,
      color: COSMOS.gold,
      glow: 7,
    },
  );

  // Clean floating left cinema typography + live variance gauge + tabletop emergence analogy
  const leftHud = dynamic(() => {
    const p = Math.max(0, Math.min(1, flowP.value));
    const addedVar = MAX_ADDED_VARIANCE * (1 - p);
    const col = p < 0.3 ? COSMOS.violet : p < 0.78 ? COSMOS.cyan : COSMOS.gold;
    const phaseLabel =
      p < 0.3 ? 'Broad noisy cloud' : p < 0.78 ? 'Splitting into modes' : 'Three data peaks';
    const barW = 450;
    const fillW = Math.max(12, barW * p);
    const tileAlpha = 0.08 + 0.92 * p;

    return group(
      txt('Probability', -845, -405, 62, COSMOS.ink, 'serif', 'left'),
      txt('Flow ODE', -845, -334, 62, COSMOS.cyan, 'serif', 'left').glow(7, COSMOS.cyan),
      txt(`σ² = ${addedVar.toFixed(2)}`, -845, -248, 44, col, 'mono', 'left').glow(8, col),
      txt(phaseLabel, -845, -192, 28, COSMOS.muted, 'sans', 'left'),
      // Progress bar
      rect(barW, 10, { fill: '#18223d', stroke: '#32426e', width: 1.3, radius: 5 }).at(
        -845 + barW / 2,
        -42,
      ),
      rect(fillW, 10, { fill: col, stroke: null, radius: 5 })
        .at(-845 + fillW / 2, -42)
        .glow(8, col),
      txt('σ² = 3.00', -845, -6, 26, COSMOS.violet, 'mono', 'left'),
      txt('σ² = 0.00', -845 + barW, -6, 26, COSMOS.gold, 'mono', 'right'),
      // Separate tabletop analogy emerging at the same noise reduction
      txt('TABLETOP ANALOGY', -845, 58, 26, COSMOS.muted, 'mono', 'left'),
      pixelGrid(exposure(tileAlpha), {
        cx: -715,
        cy: 220,
        size: 255,
        selected: TOP_PIXEL,
        frameColor: col,
      }),
      txt('72 exact ODE', -550, 178, 28, COSMOS.ink, 'sans', 'left'),
      txt('particles', -550, 218, 28, COSMOS.cyan, 'sans', 'left'),
      txt('3 exact modes', -550, 268, 26, COSMOS.gold, 'mono', 'left'),
      txt('Deterministic flow · analytic score', -845, 400, 26, COSMOS.muted, 'sans', 'left'),
    );
  });

  s.add(view3d, leftHud, odeEq);

  // Continuous 3D cinematic orbit cleanly bounded inside the scene window
  orbitScene(s, c, view3d, { theta: -0.05, phi: 0.88 });

  cueTo(s, c, 'transport-beat-1-focus-1', flowP, 0.45, { dur: 3.2 });
  pulseCue(s, c, 'df-transport-0', cuePulse, 0.3, { dur: 0.3 });

  cueTo(s, c, 'transport-beat-2-focus-1', flowP, 0.78, { dur: 2.8 });
  cueTo(s, c, 'transport-beat-2-focus-2', flowP, 0.96, { dur: 2.2 });
  pulseCue(s, c, 'df-transport-1', cuePulse, 0.65, { dur: 0.3 });

  cueTo(s, c, 'transport-beat-3-focus-1', flowP, 1.0, { dur: 1.5 });
  pulseCue(s, c, 'transport-beat-3-focus-2', cuePulse, 0.85, { dur: 0.3 });
  pulseCue(s, c, 'df-transport-2', cuePulse, 1.0, { dur: 0.3 });
}

// ---------------------------------------------------------------------------
// 12. samplers: Can the sampler reproduce the saved exposure?
// Cues: jump-input, jump-subtract, jump-divide, jump-scale,
//       jump-question, jump-direction, jump-match*
// ---------------------------------------------------------------------------
export function samplers(s, c) {
  const inputP = s.value(0);
  const subP = s.value(0);
  const divP = s.value(0);
  const scaleP = s.value(0);
  const askP = s.value(0);
  const dirP = s.value(0);
  const matchRev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45 }));
  s.add(aura(-480, -30, 440, '#2a588a24', '#151e3d12'));
  s.add(aura(480, -30, 440, '#ffd1661f', '#18244a12'));

  const liveJump = dynamic(() => {
    const sub = subP.value;
    const div = divP.value;
    const sc = scaleP.value;
    const ask = askP.value > 0.5;
    const dir = dirP.value;
    const matched = matchRev.value > 0.5;

    let pixels = TOP_JUMP.input;
    let rightTitle = 'Noisy input  (ᾱ = 0.50)';
    let notes = [
      txt('DDIM JUMP  η = 0', 0, -135, 26, COSMOS.cyan, 'mono'),
      txt('0.50 → 0.90', 0, -72, 40, COSMOS.gold, 'mono'),
      txt('Known ε = −0.400', 0, -6, 28, COSMOS.muted, 'mono'),
      txt('Deterministic path', 0, 52, 26, COSMOS.cyan, 'sans'),
    ];

    if (dir > 0.01) {
      pixels = blend(TOP_JUMP.scaled, TOP_JUMP.destination, dir);
      rightTitle = matched ? 'Sampler output  (0.90)' : 'Restoring noise direction';
      notes = [
        txt('CARRIED DIRECTION', 0, -140, 26, COSMOS.gold, 'mono'),
        txt('+ √0.10 × (−0.4)', 0, -76, 34, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
        txt('Fresh draw × 0', 0, -12, 28, COSMOS.muted, 'mono'),
        txt(
          matched ? '0.822 · Grain matches!' : 'Moving back to ring',
          0,
          56,
          30,
          matched ? COSMOS.emerald : COSMOS.cyan,
          'sans',
        ).glow(matched ? 8 : 0, COSMOS.emerald),
      ];
    } else if (sc > 0.01) {
      pixels = blend(TOP_JUMP.recovered, TOP_JUMP.scaled, sc);
      rightTitle = sc >= 0.98 ? 'Clean signal only' : 'Scaling clean estimate';
      notes = [
        txt('SIGNAL TERM ONLY', 0, -140, 26, COSMOS.cyan, 'mono'),
        txt('√0.90 × 1.000 = 0.949', 0, -76, 32, COSMOS.gold, 'mono'),
        txt('Tabletop looks flat!', 0, -12, 28, COSMOS.rose, 'sans'),
        txt(
          ask ? 'Which term pulls it back?' : 'Overshoots cyan ring',
          0,
          56,
          30,
          COSMOS.gold,
          'serif',
        ).glow(ask ? 10 : 0, COSMOS.gold),
      ];
    } else if (sub > 0.01 || div > 0.01) {
      pixels = blend(blend(TOP_JUMP.input, TOP_JUMP.signal, sub), TOP_JUMP.recovered, div);
      rightTitle = div >= 0.98 ? 'Recovered clean estimate' : 'Undoing forward mix';
      notes = [
        txt('RECOVER CLEAN x̂₀', 0, -140, 26, COSMOS.cyan, 'mono'),
        txt('0.424 − (−0.283) = 0.707', 0, -76, 30, COSMOS.ink, 'mono'),
        txt('÷ √0.50  →  1.000', 0, -12, 34, COSMOS.gold, 'mono').glow(
          div > 0.5 ? 8 : 0,
          COSMOS.gold,
        ),
        txt('Clean tabletop restored', 0, 54, 26, COSMOS.muted, 'sans'),
      ];
    }

    return group(
      // Left saved reference
      txt('Saved exposure  (0.90)', -545, -356, 36, COSMOS.cyan, 'serif'),
      pixelGrid(TOP_JUMP.reference, {
        cx: -545,
        cy: -66,
        size: 420,
        selected: TOP_PIXEL,
        frameColor: COSMOS.cyan,
      }),
      txt(
        `Marked pixel   ${decimal(TOP_JUMP.reference[TOP_PIXEL])}`,
        -545,
        190,
        32,
        COSMOS.cyan,
        'mono',
      ),

      // Right working exposure
      txt(rightTitle, 545, -356, 36, matched ? COSMOS.emerald : COSMOS.gold, 'serif'),
      pixelGrid(pixels, {
        cx: 545,
        cy: -66,
        size: 420,
        selected: TOP_PIXEL,
        frameColor: matched ? COSMOS.emerald : COSMOS.gold,
      }),
      txt(`Marked pixel   ${decimal(pixels[TOP_PIXEL])}`, 545, 190, 32, COSMOS.gold, 'mono'),

      // Center steps & animated wires (placed cleanly below center notes)
      ...notes,
      photonWire(
        [
          [-315, 130],
          [-215, 130],
        ],
        drift.value * 2.8,
        { color: COSMOS.cyan, width: 2.5 },
      ),
      photonWire(
        [
          [215, 130],
          [315, 130],
        ],
        drift.value * 2.8 + 0.5,
        { color: COSMOS.gold, width: 2.5 },
      ),

      // Magnified brightness ruler [0.35 .. 1.05]
      brightnessRuler({
        cx: 0,
        cy: 342,
        width: 1460,
        left: 0.35,
        right: 1.05,
        ticks: [0.4, 0.6, 0.8, 1.0],
        reference: TOP_JUMP.reference[TOP_PIXEL],
        current: pixels[TOP_PIXEL],
      }),
    );
  });

  s.add(liveJump);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'jump-input', inputP, 1, { dur: 0.5 });
  cueTo(s, c, 'jump-subtract', subP, 1, { dur: 1.0 });
  cueTo(s, c, 'jump-divide', divP, 1, { dur: 1.0 });
  cueTo(s, c, 'jump-scale', scaleP, 1, { dur: 1.3 });
  pulseCue(s, c, 'jump-question', askP, 1, { dur: 0.35 });
  cueTo(s, c, 'jump-direction', dirP, 0.55, { dur: 1.0 });
  // Final landing at 0.822 & match confirmation strictly AFTER spoken phrase!
  cueTo(s, c, 'jump-match', dirP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'jump-match', matchRev, 1, { after: true, dur: 0.25 });
}

// ---------------------------------------------------------------------------
// 13. ddim-contract: What changes when the sampler draws again?
// Cues: eta-zero, eta-change, eta-direction, eta-question, eta-fork*, eta-landings*
// ---------------------------------------------------------------------------
export function ddimContract(s, c) {
  const etaVal = s.value(0);
  const dirHighlight = s.value(0);
  const askP = s.value(0);
  const forkP = s.value(0);
  const landRev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.violet, opacity: 0.45 }));
  s.add(aura(0, 60, 560, '#a78bfa22', '#17203d12'));

  const clean = TOP_JUMP.recovered[TOP_PIXEL];
  const eps = imageNoise[TOP_PIXEL];

  const sigmaEq = glowTex(
    String.raw`\sigma = \eta \sqrt{\frac{1-\bar\alpha_s}{1-\bar\alpha_t}} \sqrt{1 - \frac{\bar\alpha_t}{\bar\alpha_s}}`,
    { x: 515, y: -275, size: 34, color: COSMOS.muted, glow: 0 },
  );
  const ddimEq = glowTex(
    String.raw`x_s = \sqrt{\bar\alpha_s}\,\hat{x}_0 + \sqrt{1-\bar\alpha_s-\sigma^2}\,\hat\epsilon + \sigma z`,
    { x: 0, y: 392, size: 42, color: COSMOS.ink, glow: 6 },
  );

  const liveFork = dynamic(() => {
    const eta = etaVal.value;
    const isStoch = eta > 0.5;
    const terms = ddimTerms(clean, eps, 0.5, 0.9, isStoch ? 1 : 0);
    const coeff = Math.sqrt(Math.max(0, 0.1 - terms.sigma ** 2));
    const fp = forkP.value;
    const rev = landRev.value > 0.5;

    const xLeft = -540;
    const xRight = 720;
    const mapX = (v) => xLeft + ((v - 0.5) / 0.8) * (xRight - xLeft);
    const centerPx = mapX(terms.center);
    const pulse = 1 + 0.12 * Math.sin(drift.value * Math.PI * 10);

    const nodes = [
      txt('SAME INPUT  &  PREDICTED NOISE', -820, -365, 26, COSMOS.muted, 'mono', 'left'),
      txt('Jump   0.50 → 0.90', -820, -304, 42, COSMOS.ink, 'serif', 'left'),
      txt(`η = ${isStoch ? '1' : '0'}`, 220, -358, 48, COSMOS.gold, 'mono', 'left').glow(
        8,
        COSMOS.gold,
      ),
      txt(`σ = ${decimal(terms.sigma)}`, 445, -358, 44, COSMOS.rose, 'mono', 'left').glow(
        6,
        COSMOS.rose,
      ),

      // Shared center bar
      glassPlate(0, -145, 1640, 96, {
        stroke: dirHighlight.value > 0.3 ? COSMOS.cyan : '#3a4e7c',
        glow: dirHighlight.value > 0.3 ? 10 : 4,
      }),
      txt('SHARED CENTER', -780, -145, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        `√0.90 × 1  +  ${decimal(coeff)} × (−0.4)  ≈  ${decimal(terms.center)}`,
        -490,
        -145,
        36,
        COSMOS.cyan,
        'mono',
        'left',
      ).glow(6, COSMOS.cyan),
    ];

    // Two parallel rulers: z = -1 and z = +1
    [-1, 1].forEach((z, idx) => {
      const y = 32 + idx * 188;
      const zLabel = z < 0 ? 'z = −1' : 'z = +1';
      nodes.push(
        txt(zLabel, -785, y, 40, COSMOS.ink, 'mono', 'left'),
        line([xLeft, y], [xRight, y], { stroke: '#60749f', width: 3.2 }),
      );
      for (const tk of [0.5, 0.7, 0.9, 1.1, 1.3]) {
        const tx = mapX(tk);
        nodes.push(line([tx, y - 9], [tx, y + 11], { stroke: '#7b8eb8', width: 2.2 }));
        if (idx === 1) {
          nodes.push(txt(tk.toFixed(1), tx, y + 48, 26, COSMOS.muted, 'mono'));
        }
      }
      // Shared center cyan ring
      nodes.push(
        circle(16 * (askP.value > 0.5 && fp < 0.05 ? pulse : 1), {
          fill: COSMOS.bg,
          stroke: COSMOS.cyan,
          width: 4.5,
        })
          .at(centerPx, y)
          .glow(10, COSMOS.cyan),
      );

      if (!isStoch) {
        // eta = 0: both dots coincide at 0.822
        nodes.push(
          dot(9.5, COSMOS.gold).at(centerPx, y).glow(12, COSMOS.gold),
          txt(decimal(terms.center), centerPx, y - 42, 32, COSMOS.gold, 'mono'),
        );
      } else if (fp > 0.01) {
        // eta = 1: strictly revealed AFTER eta-fork / eta-landings!
        const nextVal = terms.center + z * terms.sigma;
        const tipX = mapX(terms.center + z * terms.sigma * fp);
        if (Math.abs(tipX - centerPx) > 4) {
          nodes.push(
            arrow([centerPx, y], [tipX, y], {
              stroke: COSMOS.rose,
              width: 6,
              tip: 15,
            }).glow(10, COSMOS.rose),
          );
        }
        nodes.push(dot(10, COSMOS.gold).at(tipX, y).glow(14, COSMOS.gold));
        if (rev) {
          nodes.push(
            txt(decimal(nextVal), tipX, y - 42, 34, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
          );
        }
      } else if (askP.value > 0.5) {
        nodes.push(
          txt('?', centerPx + z * 115, y - 40, 38, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
        );
      }
    });

    nodes.push(
      txt('Normalized brightness at destination ᾱ = 0.90', 90, 306, 26, COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  s.add(liveFork, sigmaEq, ddimEq);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'eta-zero', dirHighlight, 0.2, { dur: 0.4 });
  cueTo(s, c, 'eta-change', etaVal, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'eta-direction', dirHighlight, 1, { dur: 0.65 });
  pulseCue(s, c, 'eta-question', askP, 1, { dur: 0.35 });

  // Strict prediction withholding: arrows and numerical landings ONLY appear after spoken clauses!
  cueTo(s, c, 'eta-fork', forkP, 1, { after: true, dur: 0.85 });
  cueTo(s, c, 'eta-landings', landRev, 1, { after: true, dur: 0.25 });
}
