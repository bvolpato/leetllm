// Scene 13: cost: "Why long sequences get expensive"
// Signature 3D quadratic N^2 growth surface (cinematic3d + surface + orbitScene)
// paired with 4×4 -> 8×8 grid quadrupling (16 -> 64) and 34.4 GB temporary score stack breakdown.
import { gridPlane3d, surface } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, SCORE_BYTES, cinemaAtmosphere, fmt, lumBar, playCue } from '../parts.mjs';

export default function cost(s, c) {
  const scoreGB = SCORE_BYTES / 1e9; // 34.36

  const title = heroTitle(['Quadratic cost:', 'why long context hurts'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.mask,
  });

  // Right-side 3D quadratic surface: z(u, v) = (u/3)^2 * (v/3)^2 rising smoothly as T grows
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 15.6,
    unit: 100,
    focus: [0, 0, 0.85],
  }).at(395, 5);

  const floorGrid = gridPlane3d({
    x: [-3, 3],
    y: [-3, 3],
    z: 0,
    step: 1,
    color: '#2e3f6b',
    opacity: 0.45,
  });

  const quadSurf = surface(
    (u, v) => {
      const nu = (u + 3) / 6;
      const nv = (v + 3) / 6;
      return 3.1 * nu * nv;
    },
    {
      x: [-3, 3],
      y: [-3, 3],
      steps: 18,
      colors: [ROLE.birds, ROLE.sing, ROLE.query, ROLE.mask],
      opacity: 0.88,
      wireframe: true,
      wireColor: '#8fa9e0',
      wireOpacity: 0.28,
    },
  );

  view3d.add(floorGrid, quadSurf);

  // Left-side reactive progression: 4x4 (16) -> 8x8 (64, 4x) -> 34.4 GB stack -> training vs decode
  const gridN = s.value(4); // 4 -> 8
  const show4x = s.value(0);
  const showBill = s.value(0); // 0 -> 1 reveals B=8, H=32, T=8192, 2 B
  const showTotalGB = s.value(0); // reveals 34.4 GB
  const showPhaseNote = s.value(0); // training/prefill vs generation

  const stageVis = s.value(1);

  const leftLayer = guardedDynamic(stageVis, (alpha) => {
    const n = gridN.value > 6 ? 8 : 4;
    const nodes = [];

    // Dynamic 4×4 or 8×8 glowing score grid at upper-left
    const cx = -510;
    const cy = -70;
    const boxSize = 270;
    const gap = n === 4 ? 8 : 4;
    const cell = (boxSize - (n - 1) * gap) / n;
    const startX = cx - boxSize / 2 + cell / 2;
    const startY = cy - boxSize / 2 + cell / 2;
    const col = n === 8 ? ROLE.mask : ROLE.sing;

    for (let r = 0; r < n; r++) {
      for (let k = 0; k < n; k++) {
        nodes.push(
          lumBar(startX + k * (cell + gap), startY + r * (cell + gap), cell, cell, {
            color: col,
            fillOpacity: 0.3,
            strokeWidth: n === 4 ? 2 : 1.2,
            glow: n === 4 ? 6 : 3,
            radius: n === 4 ? 5 : 2,
            opacity: alpha,
          }),
        );
      }
    }

    nodes.push(
      txt(`${n} tokens → ${n * n} scores`, cx, -245, 32, col, 'mono', 'center')
        .glow(6, col)
        .opacity(alpha),
    );

    if (show4x.value > 0.05) {
      nodes.push(
        txt('2× length  →  4× score area', cx, 108, 30, ROLE.query, 'mono', 'center')
          .glow(6, ROLE.query)
          .opacity(show4x.value * alpha),
      );
    }

    // Real-scale bill readout at lower-left
    const bill = showBill.value;
    if (bill > 0.05) {
      nodes.push(
        txt(
          'B=8 · H=32 · T=8,192 · 2 B (FP16)',
          -850,
          195,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(bill * alpha),
        txt('8 × 32 × 8,192² × 2 bytes', -850, 245, 30, COSMOS.ink, 'mono', 'left').opacity(
          bill * alpha,
        ),
      );
    }
    if (showTotalGB.value > 0.05) {
      nodes.push(
        txt(
          `≈ ${fmt(scoreGB, 1)} GB  (temporary score stack!)`,
          -850,
          315,
          34,
          ROLE.mask,
          'mono',
          'left',
        )
          .glow(9, ROLE.mask)
          .opacity(showTotalGB.value * alpha),
      );
    }
    if (showPhaseNote.value > 0.05) {
      nodes.push(
        txt(
          'Training & prefill run all T tokens together  ·  decode is different',
          -850,
          395,
          26,
          ROLE.sing,
          'sans',
          'left',
        ).opacity(showPhaseNote.value * alpha),
      );
    }

    // Clean top-right 3D surface caption (well above 3D surface)
    nodes.push(
      txt('Score matrix memory  ∝  T²', 395, -365, 34, ROLE.query, 'mono', 'center')
        .glow(7, ROLE.query)
        .opacity(alpha),
    );

    return nodes;
  });

  const oEq = glowTex('\\mathcal{O}(B \\cdot H \\cdot T^2)', {
    x: 395,
    y: 445,
    size: 40,
    color: ROLE.mask,
  });

  s.add(cinemaAtmosphere(ROLE.mask, ROLE.query), title, view3d, leftLayer, oEq);

  // Continuous bounded 3D camera orbit across the scene (zero static hold, safe endMargin)
  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.18, phi: 0.94, distance: 14.5 },
    {
      startOffset: 0.2,
      endMargin: 0.65,
    },
  );

  // Beat 0: 4 tokens -> 16, double to 8 -> 64, 4× bigger
  playCue(s, c, 'four', (d) => s.play(gridN.to(4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'eight', (d) => s.play(gridN.to(8, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'four-times', (d) => s.play(show4x.to(1, { duration: d })), { dur: 0.5 });

  // Beat 1: Real scale -> 8 × 32 × 8192² × 2 B = 34.4 GB
  playCue(s, c, 'real-size', (d) => s.play(showBill.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'sizes', (d) => s.play(showBill.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'total', (d) => s.play(showTotalGB.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  // Beat 2: Training/prefill HBM storage vs decoding
  playCue(s, c, 'when', (d) => s.play(showPhaseNote.to(0.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'stores', (d) => s.play(showPhaseNote.to(0.75, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'different', (d) => s.play(showPhaseNote.to(1, { duration: d })), { dur: 0.4 });
}
