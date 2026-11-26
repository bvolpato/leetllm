// Scene 15: fitted-surface: "Can we recover a known loss surface?"
// SIGNATURE 3D SCENE: Orbiting 3D fitted power-law surface L(N,D) = 1.1 + 2.8/N^0.07 + 7.8/D^0.098
// with data beacons on the right, paired with a 2-act swapVis left stage:
//   Act 1 (Beat 0 & Beat 2): Log-log (N, D) proxy grid (8 fitting rows + held-out 1B/100B + 70B/1.4T target).
//   Act 2 (Beat 1): Glowing 2D (alpha, beta) SSE search grid recovering alpha=0.070, beta=0.098
//                   strictly AFTER fit-answer and checking holdout 2.408 AFTER fit-holdout.
import {
  COSMOS,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  EXPONENT_GRID,
  ROLE,
  buildLossSurface3d,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playBeat,
  playCue,
  plotPlane,
  surfaceLoss,
  swapVis,
} from '../parts.mjs';

export default function fittedSurface(s, c) {
  const title = heroTitle(['Can we recover a', 'known loss surface?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.tokens,
  });

  // Right-side orbiting 3D power-law surface with beacons for proxy cluster, holdout, and 70B target
  const { view3d } = buildLossSurface3d({
    xPos: 475,
    yPos: -20,
    unit: 96,
    distance: 15.6,
    theta: -0.82,
    phi: 1.04,
    A: 2.2,
    B: 2.6,
    alpha: 0.35,
    beta: 0.45,
    beacons: [
      { u: -1.6, v: -1.7, color: ROLE.tokens, radius: 6.5 },
      { u: -1.0, v: -1.1, color: ROLE.tokens, radius: 6.5 },
      { u: -0.4, v: -0.5, color: ROLE.tokens, radius: 6.5 },
      { u: 0.2, v: 0.6, color: ROLE.compute, radius: 8 },
      { u: 1.9, v: 1.8, color: ROLE.cap, radius: 9 },
    ],
  });

  const mapVis = s.value(1);
  const gridVis = s.value(0);

  const dotsProg = s.value(0); // sl-fitted-surface-0
  const searchProg = s.value(0); // sl-fitted-surface-1
  const ansReveal = s.value(0); // AFTER fit-answer
  const holdReveal = s.value(0); // AFTER fit-holdout
  const extMode = s.value(0); // sl-fitted-surface-2 (Beat 2)
  const targetReveal = s.value(0); // AFTER fit-target

  // Act 1 (Beats 0 & 2): Log-log (log10 N, log10 D) map
  const mapLayer = guardedDynamic(mapVis, (alpha) => {
    const nodes = [];
    const dp = dotsProg.value;
    const em = extMode.value;
    const tr = targetReveal.value;

    const plane = plotPlane({
      left: -790,
      right: -80,
      top: -215,
      bottom: 245,
      xDomain: [7.8, 11.2],
      yDomain: [8.8, 12.6],
      xTicks: [8, 9, 10, 11].map((e) => ({ v: e, label: `10^${e}` })),
      yTicks: [9, 10, 11, 12].map((e) => ({ v: e, label: `10^${e}` })),
      xLabel: 'Parameters N',
      yLabel: 'Tokens D',
      opacity: alpha,
    });
    nodes.push(plane.node);

    const rows = EXPONENT_GRID.rows;
    const visibleCount = em > 0.2 ? rows.length : Math.max(1, Math.round(dp * rows.length));
    for (let i = 0; i < visibleCount; i++) {
      const r = rows[i];
      const [sx, sy] = plane.toScreen(Math.log10(r.n), Math.log10(r.d));
      nodes.push(glowDot(sx, sy, { radius: 8, color: ROLE.tokens, glow: 11, opacity: alpha }));
    }

    // Held-out 9th row: 1B / 100B
    const [hx, hy] = plane.toScreen(9, 11);
    const hCol = em > 0.2 ? ROLE.optimal : ROLE.compute;
    nodes.push(
      glowDot(hx, hy, { radius: 10, color: hCol, glow: 15, opacity: alpha }),
      txt(
        em > 0.2 ? 'Holdout 2.408' : 'Held-out 1B/100B',
        hx + 22,
        hy - 34,
        26,
        hCol,
        'mono',
        'left',
      )
        .glow(6, hCol)
        .opacity(alpha),
    );

    // Beat 2: Extrapolated 70B / 1.4T target far outside proxy cluster
    if (em > 0.05) {
      const [tx, ty] = plane.toScreen(Math.log10(70e9), Math.log10(1.4e12));
      nodes.push(
        glowDot(tx, ty, { radius: 11, color: ROLE.cap, glow: 16, opacity: em * alpha }),
        txt(
          tr > 0.5 ? `70B/1.4T -> ${fmt(surfaceLoss(70e9, 1.4e12), 3)}` : '70B / 1.4T target',
          tx - 24,
          ty - 28,
          28,
          ROLE.cap,
          'mono',
          'right',
        )
          .glow(7, ROLE.cap)
          .opacity(em * alpha),
      );
    }

    nodes.push(
      txt(
        em > 0.2
          ? 'Far extrapolation from 0.1B-1B proxies -> verify with held-out & mid-scale runs'
          : '8 fitting runs (0.1B to 1B)  ·  9th row (1B / 100B) held out',
        -435,
        365,
        26,
        em > 0.2 ? ROLE.cap : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // Act 2 (Beat 1): 2D (alpha, beta) SSE search grid
  const gridLayer = guardedDynamic(gridVis, (alpha) => {
    const nodes = [];
    const sp = searchProg.value;
    const ar = ansReveal.value;
    const hr = holdReveal.value;
    const cells = EXPONENT_GRID.cells;
    const best = EXPONENT_GRID.best;
    const admitted = Math.round(sp * cells.length);

    const gridLeft = -790;
    const gridTop = -175;
    const stepX = 33;
    const stepY = 16;

    nodes.push(
      txt(
        'Known E = 1.10  ·  A = 2.80  ·  B = 7.80',
        -470,
        -245,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    for (let idx = 0; idx < cells.length; idx++) {
      const cell = cells[idx];
      const cx = gridLeft + cell.i * stepX + 14;
      const cy = gridTop + cell.j * stepY + 6;
      const lit = idx < admitted;
      const intensity = lit ? 0.12 + 0.72 / (1 + cell.sse * 300) : 0.04;
      nodes.push(
        lumBar(cx, cy, 27, 12, {
          color: ROLE.tokens,
          fillOpacity: intensity,
          strokeWidth: 0.8,
          glow: lit && intensity > 0.5 ? 6 : 0,
          radius: 2,
          opacity: alpha,
        }),
      );
    }

    // Highlight recovered optimum strictly AFTER fit-answer
    if (ar > 0.5) {
      const bx = gridLeft + best.i * stepX + 14;
      const by = gridTop + best.j * stepY + 6;
      nodes.push(
        lumBar(bx, by, 32, 16, {
          color: ROLE.compute,
          fillOpacity: 0.9,
          strokeWidth: 2.8,
          glow: 14,
          radius: 3,
          opacity: ar * alpha,
        }),
        txt(
          `Best: α = ${fmt(best.alpha, 3)},  β = ${fmt(best.beta, 3)}`,
          -470,
          310,
          32,
          ROLE.optimal,
          'mono',
          'center',
        )
          .glow(8, ROLE.optimal)
          .opacity(ar * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Searching (α, β) grid for lowest squared error...',
          -470,
          310,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    if (hr > 0.5) {
      nodes.push(
        txt(
          `Holdout 1B/100B: ${fmt(surfaceLoss(1e9, 1e11), 3)}  (tabulated 2.408, +0.0002)`,
          -470,
          375,
          26,
          ROLE.compute,
          'mono',
          'center',
        )
          .glow(6, ROLE.compute)
          .opacity(hr * alpha),
      );
    }

    nodes.push(txt('α across ->', -470, 258, 26, COSMOS.dim, 'mono', 'center').opacity(alpha));

    return nodes;
  });

  const rightCaption = guardedDynamic(s.value(1), (alpha) => [
    txt('3D Fitted Loss Surface', 475, -355, 30, ROLE.compute, 'mono', 'center')
      .glow(6, ROLE.compute)
      .opacity(alpha),
    txt(
      'Cyan: 8 proxies  ·  Gold: holdout  ·  Rose: 70B',
      475,
      325,
      26,
      COSMOS.muted,
      'mono',
      'center',
    ).opacity(alpha),
  ]);

  const eq = glowTex('L = 1.10 + 2.80 N^{-0.070} + 7.80 D^{-0.098}', {
    x: 475,
    y: 405,
    size: 30,
    color: ROLE.tokens,
  });

  s.add(
    cinemaAtmosphere(ROLE.tokens, ROLE.cap),
    title,
    view3d,
    rightCaption,
    eq,
    mapLayer,
    gridLayer,
  );

  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.18, phi: 0.94, distance: 14.5 },
    { startOffset: 0.15, endMargin: 0.55 },
  );

  playCue(s, c, 'sl-fitted-surface-0', (d) => s.play(dotsProg.to(1, { duration: d })), {
    dur: 1.4,
  });
  playCue(
    s,
    c,
    'sl-fitted-surface-1',
    (d) => s.play(swapVis(mapVis, gridVis, Math.min(0.6, d)), searchProg.to(1, { duration: d })),
    { dur: 1.8 },
  );
  playCue(s, c, 'fit-answer', (d) => s.play(ansReveal.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'fit-holdout', (d) => s.play(holdReveal.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playBeat(
    s,
    c,
    2,
    (d) => s.play(swapVis(gridVis, mapVis, Math.min(0.6, d)), extMode.to(1, { duration: d })),
    { dur: 0.85 },
  );
  playCue(
    s,
    c,
    'sl-fitted-surface-2',
    (d) => s.play(extMode.to(1, { duration: Math.min(0.4, d) })),
    {
      dur: 0.4,
    },
  );
  playCue(s, c, 'fit-target', (d) => s.play(targetReveal.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
