// Scene 24: architecture-aware: "Which weights does this token use?"
// SIGNATURE 3D SCENE: Right-side orbiting 3D sparse Mixture-of-Experts weight lattice
// (cinematic3d + wireframeSlab3d + orbitScene) distinguishing all 80B stored weights (160 GB)
// from the 10B active subset per token, paired with a 2-act swapVis left stage:
//   Act 1 (Beats 0-1): 40 weight tiles (2B each) lighting 2 shared + 3 selected -> 6e21 FLOPs.
//   Act 2 (Beat 2): Growing cached attention KV history + O(T^2) triangle vs fixed SSM state.
import { gridPlane3d } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  wireframeSlab3d,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, lumBar, playCue, swapVis } from '../parts.mjs';

export default function architectureAware(s, c) {
  const title = heroTitle(['Which weights does', 'this token use?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.surface,
  });

  // Right-side orbiting 3D sparse MoE weight bank (stored bank vs bright active expert slabs)
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.06,
    distance: 15.0,
    unit: 96,
    focus: [0, 0, 0.5],
  }).at(485, -15);

  const floor = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2.2, 2.2],
    z: -0.9,
    step: 1,
    color: '#26365e',
    opacity: 0.45,
  });

  const slabs = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const idx = row * 4 + col;
      const cx = -1.8 + col * 1.2;
      const cy = -1.5 + row * 1.0;
      const isShared = idx < 2;
      const isSelected = idx === 5 || idx === 10 || idx === 14;
      const active = isShared || isSelected;
      slabs.push(
        ...wireframeSlab3d([cx, cy, active ? 0.55 : -0.15], 0.42, 0.34, active ? 0.45 : 0.25, {
          color: isShared ? ROLE.params : isSelected ? ROLE.tokens : '#3b4e7a',
          width: active ? 2.8 : 1.3,
          glow: active ? 10 : 0,
          onTop: active,
        }),
      );
    }
  }
  view3d.add(floor, ...slabs);

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  const activeProg = s.value(0); // sl-architecture-aware-0: lights 5 active tiles
  const countVis = s.value(0); // sl-architecture-aware-1: reveals 160 GB & 6e21 FLOPs
  const ctxGrow = s.value(0); // sl-architecture-aware-2: attention history grows vs fixed SSM

  // Act 1 (Beats 0-1): 40 MoE tiles (2B each) -> 80B stored (160 GB) vs 10B active (6e21 FLOPs)
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const activeCount = Math.max(1, Math.min(5, Math.round(activeProg.value * 5)));
    const cv = countVis.value;

    const leftX = -805;
    const topY = -165;
    const tileW = 68;
    const tileH = 54;
    const gapX = 11;
    const gapY = 14;

    nodes.push(
      txt(
        '40 tiles × 2B = 80B stored in memory',
        -420,
        -240,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    for (let i = 0; i < 40; i++) {
      const colIdx = i % 10;
      const rowIdx = Math.floor(i / 10);
      const cx = leftX + colIdx * (tileW + gapX) + tileW / 2;
      const cy = topY + rowIdx * (tileH + gapY) + tileH / 2;
      const isShared = i < 2;
      const isSel = i >= 2 && i < 5;
      const lit = i < activeCount;
      const col = isShared ? ROLE.params : isSel ? ROLE.tokens : COSMOS.dim;

      nodes.push(
        lumBar(cx, cy, tileW, tileH, {
          color: col,
          fillOpacity: lit ? 0.54 : isShared || isSel ? 0.16 : 0.08,
          strokeWidth: lit ? 2.6 : 1.3,
          glow: lit ? 10 : 0,
          radius: 5,
          opacity: (lit || isShared || isSel ? 1 : 0.55) * alpha,
        }),
      );
    }

    // Active token indicator above row 0
    const tokX = leftX + Math.min(4, activeCount - 1) * (tileW + gapX) + tileW / 2;
    nodes.push(
      glowDot(tokX, topY - 24, { radius: 8, color: ROLE.compute, glow: 12, opacity: alpha }),
      txt(
        'Blue: 2 shared (4B)  ·  Cyan: 3 selected (6B)  =  10B active',
        -420,
        155,
        26,
        ROLE.tokens,
        'mono',
        'center',
      )
        .glow(5, ROLE.tokens)
        .opacity(alpha),
    );

    if (cv > 0.05) {
      const ca = cv * alpha;
      nodes.push(
        txt('Storage: 80B × 2 B = 160 GB', -820, 240, 30, ROLE.params, 'mono', 'left')
          .glow(6, ROLE.params)
          .opacity(ca),
        txt('Active 6ND (100B tok): 6 × 10²¹ FLOPs', -820, 305, 30, ROLE.optimal, 'mono', 'left')
          .glow(7, ROLE.optimal)
          .opacity(ca),
        txt(
          'Routing & all-to-all comms add overhead',
          -820,
          368,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(ca),
      );
    }

    return nodes;
  });

  // Act 2 (Beat 2): Attention KV cache growth vs fixed SSM state
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const bars = Math.max(4, Math.round(4 + 7 * ctxGrow.value));

    nodes.push(
      txt('Cached attention history (grows with T)', -820, -225, 30, ROLE.tokens, 'sans', 'left')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
    );

    for (let i = 0; i < bars; i++) {
      nodes.push(
        lumBar(-795 + i * 64, -100, 48, 128, {
          color: ROLE.tokens,
          fillOpacity: 0.42,
          strokeWidth: 2.2,
          glow: 8,
          opacity: alpha,
        }),
      );
    }

    nodes.push(
      txt('State-space model (fixed recurrent state)', -820, 60, 30, ROLE.params, 'sans', 'left')
        .glow(6, ROLE.params)
        .opacity(alpha),
    );
    for (let i = 0; i < 4; i++) {
      nodes.push(
        lumBar(-775 + i * 110, 175, 82, 112, {
          color: ROLE.params,
          fillOpacity: 0.42,
          strokeWidth: 2.5,
          glow: 9,
          opacity: alpha,
        }),
      );
    }

    nodes.push(
      txt(
        'Fit scaling curves on the actual architecture & phase',
        -820,
        335,
        28,
        ROLE.optimal,
        'sans',
        'left',
      )
        .glow(6, ROLE.optimal)
        .opacity(alpha),
    );

    return nodes;
  });

  const rightCaption = guardedDynamic(s.value(1), (alpha) => [
    txt('3D Sparse MoE Expert Lattice', 485, -355, 30, ROLE.surface, 'mono', 'center')
      .glow(6, ROLE.surface)
      .opacity(alpha),
    txt(
      'Stored = VRAM  ·  Active = 6ND FLOPs',
      485,
      325,
      26,
      COSMOS.muted,
      'mono',
      'center',
    ).opacity(alpha),
  ]);

  const eq = glowTex('C_{\\text{MoE}} \\approx 6 N_{\\text{active}} D', {
    x: 485,
    y: 405,
    size: 36,
    color: ROLE.tokens,
  });

  s.add(
    cinemaAtmosphere(ROLE.surface, ROLE.tokens),
    title,
    view3d,
    rightCaption,
    eq,
    act1Layer,
    act2Layer,
  );

  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.14, phi: 0.94, distance: 14.2 },
    { startOffset: 0.15, endMargin: 0.55 },
  );

  playCue(s, c, 'sl-architecture-aware-0', (d) => s.play(activeProg.to(1, { duration: d })), {
    dur: 1.4,
  });
  playCue(s, c, 'sl-architecture-aware-1', (d) => s.play(countVis.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(
    s,
    c,
    'sl-architecture-aware-2',
    (d) => s.play(swapVis(act1Vis, act2Vis, Math.min(0.65, d)), ctxGrow.to(1, { duration: d })),
    { dur: 1.5 },
  );
}
