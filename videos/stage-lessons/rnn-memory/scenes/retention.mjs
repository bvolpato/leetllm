// Scene 14: retention: "How much can the direct cell path carry?"
// SIGNATURE 3D CINEMA SCENE:
// Left: Glowing 2D direct-path retention curves (0.98^t emerald vs 0.50^t rose) with animated probe.
// Right: Continuously orbiting 3D Forget-Gate Retention Landscape z(t, f) = f^t highlighting
//        the high emerald plateau near f = 1 vs the collapsing rose cliff at f = 0.50.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildRetentionSurface3d,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function retention(s, c) {
  const title = heroTitle(['How much can the', 'direct cell path carry?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.cell,
  });

  const probe = s.value(0); // 0 -> 10 -> 30
  const pulseHalf = s.value(0);
  const showDirectNote = s.value(0);

  // Left 2D chart bounds
  const lx = -740;
  const rx = 50;
  const by = 185;
  const ty = -175;
  const pt = (t, y) => [lx + ((rx - lx) * t) / 30, by - (by - ty) * y];

  const staticAxes = [
    txt(
      'Direct cell path fraction (0 to 30 steps)',
      (lx + rx) / 2,
      -268,
      28,
      COSMOS.muted,
      'sans',
      'center',
    ),
    line([lx, by], [rx + 14, by], { stroke: '#556894', width: 2.6 }),
    line([lx, by], [lx, ty - 14], { stroke: '#556894', width: 2.6 }),
    ...[0, 0.5, 1.0].flatMap((v) => {
      const y = pt(0, v)[1];
      return [
        line([lx, y], [rx, y], { stroke: '#263250', width: 1.5, dash: [6, 6] }),
        txt(v.toFixed(1), lx - 22, y, 26, COSMOS.muted, 'mono', 'right'),
      ];
    }),
    ...[0, 10, 20, 30].map((t) =>
      txt(String(t), pt(t, 0)[0], by + 48, 26, COSMOS.muted, 'mono', 'center'),
    ),
    txt('3D Retention Surface  fᵗ', 515, -245, 32, COSMOS.ink, 'serif', 'center'),
  ];

  const liveLayer = guardedDynamic(
    () => 1,
    () => {
      const cur = Math.max(0, Math.min(30, probe.value));
      const tInt = Math.round(cur);
      const nodes = [];

      // Vertical gold probe hairline
      const px = pt(cur, 0)[0];
      nodes.push(
        line([px, by], [px, ty], { stroke: ROLE.gold, width: 2.4, dash: [8, 6] }).opacity(0.75),
        txt(`t = ${tInt}`, px, ty - 42, 28, ROLE.gold, 'mono', 'center'),
      );

      // Draw both retention curves up to probe
      [
        { f: 0.98, col: ROLE.cell, readX: -545 },
        { f: 0.5, col: ROLE.grad, readX: -145 },
      ].forEach(({ f, col, readX }, idx) => {
        const samples = Math.max(2, Math.ceil(cur * 2) + 1);
        const pts = [];
        for (let i = 0; i < samples; i++) {
          const t = (cur * i) / (samples - 1);
          pts.push(pt(t, f ** t));
        }
        if (cur > 0.05) {
          nodes.push(glowingTrail(pts, { color: col, width: 5.2, glow: 11 }));
        }
        const head = pt(cur, f ** cur);
        nodes.push(glowDot(head[0], head[1], { radius: 8.5, color: col, glow: 12 }));

        const val = f ** tInt;
        const valText = val < 0.001 ? val.toExponential(2) : val.toFixed(3);
        const hi = idx === 1 && pulseHalf.value > 0.2;
        nodes.push(
          txt(`${f.toFixed(2)}^${tInt} = ${valText}`, readX, 282, 34, col, 'mono', 'center').glow(
            hi ? 12 : 5,
            col,
          ),
        );
        if (hi) {
          nodes.push(
            glowRing(head[0], head[1], 20, ROLE.grad, {
              width: 3.2,
              glow: 11,
              opacity: pulseHalf.value,
            }),
          );
        }
      });

      if (showDirectNote.value > 0.02) {
        nodes.push(
          glowTex('\\prod_{j=1}^{t} f_j', {
            x: -690,
            y: 375,
            size: 36,
            color: ROLE.cell,
            glow: 7,
          }).opacity(showDirectNote.value),
          txt(
            'Direct cell path only (full gradient also flows through gates & hₜ)',
            115,
            375,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(showDirectNote.value),
        );
      }

      return nodes;
    },
  );

  // Right: Continuously orbiting 3D Forget-Gate Retention Landscape
  const surface3d = buildRetentionSurface3d(probe, { x: 515, y: 40 });

  s.add(cinemaAtmosphere(ROLE.cell, ROLE.grad), title, ...staticAxes, surface3d, liveLayer);

  orbitScene(s, c, surface3d, { theta: 0.65, phi: 0.96 }, { startOffset: 0.08, endMargin: 0.55 });

  playCue(s, c, 'forget-gate-product-b1-1', (d) => s.play(probe.to(10, { duration: d })), {
    dur: 1.9,
  });
  playCue(s, c, 'protective-retention-b2-1', (d) => s.play(probe.to(30, { duration: d })), {
    dur: 1.9,
  });
  playCue(s, c, 'halving-retention-b2-2', (d) => s.play(pulseHalf.to(1, { duration: d })), {
    dur: 0.6,
  });
  playCue(s, c, 'forget-gate-product-b3-1', (d) => s.play(showDirectNote.to(1, { duration: d })), {
    dur: 0.5,
  });
}
