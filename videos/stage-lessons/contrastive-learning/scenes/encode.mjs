// Scene 2: encode - "Use the same encoder contract for every item"
// Pure Cinema: Orbiting 3D unit hypersphere holding the 4 unit vectors beside a flowing
// neural dual-encoder conduit, transitioning to format prefixes and re-encoding verification.
import { arrow, line3d, linear, point3d } from 'vizmatic/stage';
import {
  ANGLES,
  COLORS,
  COSMOS,
  NAMES,
  ROLE,
  START,
  buildHypersphere3d,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playOn,
  rule,
  sphereGeodesic,
  swapVis,
  txt,
} from '../parts.mjs';

export default function encode(s, c) {
  const title = heroTitle(['One shared space:', 'encode, pool, normalize'], {
    x: -860,
    y: -445,
    size: 46,
    lineHeight: 54,
    accent: ROLE.anchor,
  });

  const vSphere = s.value(1);
  const vRecheck = s.value(0);
  const pulseT = s.value(0);
  const hiSpace = s.value(0);
  const hiPos = s.value(0);
  const hiNorm = s.value(0);
  const showPrefix = s.value(0);

  // Left: Orbiting 3D unit hypersphere with anchor + 3 candidate unit vectors
  const sphere = buildHypersphere3d({
    x: -380,
    y: 10,
    radius: 2.05,
    theta: -0.78,
    phi: 1.06,
    distance: 14.8,
    unit: 104,
    accent: ROLE.anchor,
  });
  const qPt = sphere.ptOnSphere(START, 0.14);
  const cPts = ANGLES.map((a, i) => sphere.ptOnSphere(a, i === 0 ? 0.18 : i === 1 ? -0.15 : 0.25));

  sphere.view.add(
    line3d([0, 0, 0], qPt, {
      color: ROLE.anchor,
      width: 4.5,
      glow: 10,
      blend: 'screen',
      onTop: true,
    }),
    point3d(qPt, { color: '#ffffff', radius: 8, glow: 14, blend: 'screen', onTop: true }),
    sphereGeodesic(qPt, cPts[0], sphere.radius, { color: ROLE.positive, width: 3.4, glow: 9 }),
    ...cPts.flatMap((pt, i) => [
      line3d([0, 0, 0], pt, {
        color: COLORS[i],
        width: 3.6,
        glow: 8,
        blend: 'screen',
        onTop: true,
      }),
      point3d(pt, { color: COLORS[i], radius: 7.5, glow: 12, blend: 'screen', onTop: true }),
    ]),
  );

  const eqCos = glowTex('q \\cdot d = \\cos(\\theta)', {
    x: -380,
    y: 412,
    size: 34,
    color: ROLE.focus,
    glow: 6,
  });

  // Left legend for the 3D sphere placed cleanly below the 3D viewport (zero overlap with 3D surface)
  const sphereHud = guardedDynamic(vSphere, (alpha) => {
    const posHi = hiPos.value;
    const normHi = hiNorm.value;
    const items = [
      { name: 'dog running (anchor)', col: ROLE.anchor, x: -835, y: 278 },
      { name: 'puppy runs (positive)', col: ROLE.positive, x: -375, y: 278 },
      { name: 'dog sleeps (competitor)', col: ROLE.competitor, x: -835, y: 328 },
      { name: 'sky is blue (unrelated)', col: ROLE.unrelated, x: -375, y: 328 },
    ];
    const nodes = items
      .map((it, idx) => {
        const boost = idx === 1 && posHi > 0.3;
        return [
          glowDot(it.x, it.y, {
            radius: boost ? 8 : 6,
            color: it.col,
            glow: boost ? 14 : 8,
            opacity: alpha,
          }),
          txt(it.name, it.x + 22, it.y, 26, it.col, 'sans', 'left')
            .glow(boost ? 7 : 0, it.col)
            .opacity(alpha),
        ];
      })
      .flat();

    if (normHi > 0.05) {
      nodes.push(
        txt('||v||₂ = 1  on unit sphere S^(d-1)', -380, -315, 28, ROLE.anchor, 'mono', 'center')
          .glow(8, ROLE.anchor)
          .opacity(normHi * alpha),
      );
    }
    return nodes;
  });

  // Left view 2: Format-changed re-encoding & held-out verification cycle (replaces sphere cleanly)
  const recheckLayer = guardedDynamic(vRecheck, (alpha) => {
    const cx = -390;
    const steps = [
      { y: -160, n: '1', label: 'New prefix / instruction format', col: ROLE.focus },
      { y: 15, n: '2', label: 'Re-encode all stored passages', col: ROLE.anchor },
      { y: 190, n: '3', label: 'Verify held-out query rankings', col: ROLE.positive },
    ];
    const nodes = [
      txt('FORMAT CHANGED AFTER INDEXING', cx, -280, 28, ROLE.focus, 'mono', 'center')
        .glow(6, ROLE.focus)
        .opacity(alpha),
    ];
    steps.forEach((st, idx) => {
      nodes.push(
        glowRing(cx - 260, st.y, 32, st.col, { width: 3.2, glow: 10, opacity: alpha }),
        txt(st.n, cx - 260, st.y, 28, st.col, 'mono', 'center').opacity(alpha),
        txt(st.label, cx - 205, st.y, 32, COSMOS.ink, 'sans', 'left').opacity(alpha),
      );
      if (idx < steps.length - 1) {
        nodes.push(
          arrow([cx - 260, st.y + 42], [cx - 260, steps[idx + 1].y - 42], {
            stroke: st.col,
            width: 3,
            tip: 12,
          }).opacity(alpha),
        );
      }
    });
    nodes.push(
      txt(
        'Keep one tested format in training, indexing, and search',
        cx,
        325,
        28,
        ROLE.positive,
        'mono',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // Right: Dual-encoder conduit pipeline (always visible & live)
  const rightLayer = guardedDynamic(s.value(1), () => {
    const px = 455;
    const p = pulseT.value;
    const sp = showPrefix.value;
    const nh = hiNorm.value;
    const sh = hiSpace.value;
    const words = ['A dog is running', 'a puppy runs', 'a dog sleeps', 'the sky is blue'];
    const cols = [ROLE.anchor, ROLE.positive, ROLE.competitor, ROLE.unrelated];
    const nodes = [rule(75, -370, 75, 420, COSMOS.rule, 1.8).opacity(0.55)];

    // Four input strings at top-right
    words.forEach((w, i) => {
      const y = -355 + i * 44;
      const prefix = sp > 0.5 ? (i === 0 ? 'query: ' : 'passage: ') : '';
      nodes.push(
        txt(prefix + w, px, y, 28, cols[i], 'mono', 'center').glow(sp > 0.5 ? 5 : 0, cols[i]),
      );
    });

    // Three conduit stages
    const stages = [
      { y: -80, label: 'shared encoder θ', col: ROLE.violet, hi: false },
      { y: 75, label: 'masked mean pool: mean(hᵢ)', col: ROLE.anchor, hi: false },
      { y: 230, label: 'L2 normalize: v / ||v||₂', col: ROLE.focus, hi: nh > 0.4 },
    ];
    stages.forEach((st) => {
      nodes.push(
        lumBar(px, st.y, 580, 74, {
          color: st.col,
          fillAlpha: st.hi ? 0.34 : 0.18,
          strokeWidth: st.hi ? 3.4 : 2.2,
          glow: st.hi ? 12 : 6,
          radius: 12,
        }),
        txt(st.label, px, st.y, 30, st.hi ? COSMOS.ink : st.col, 'mono', 'center'),
      );
    });

    // Conduit arrows between stages
    const spans = [
      [-185, -124],
      [-36, 30],
      [118, 186],
      [274, 340],
    ];
    spans.forEach(([y0, y1]) => {
      nodes.push(arrow([px, y0], [px, y1], { stroke: '#6d84b8', width: 2.8, tip: 11 }));
    });

    // Animated data photons flowing cleanly alongside arrows during pooling cue
    if (p > 0.01 && p < 0.99) {
      const py = -185 + p * 520;
      cols.forEach((col, i) => {
        nodes.push(glowDot(px + (i - 1.5) * 26, py, { radius: 6.5, color: col, glow: 11 }));
      });
    }

    // Output scoring space caption
    nodes.push(
      txt(
        sp > 0.5 ? 're-encoded vectors -> re-verify' : 'unit vectors -> shared scoring space',
        px,
        382,
        28,
        sh > 0.4 ? ROLE.focus : ROLE.positive,
        'mono',
        'center',
      ).glow(sh > 0.4 ? 7 : 3, ROLE.focus),
    );
    return nodes;
  });

  s.add(
    cinemaAtmosphere(ROLE.anchor, ROLE.violet),
    title,
    sphere.view,
    eqCos,
    sphereHud,
    recheckLayer,
    rightLayer,
  );

  // Continuous gentle 3D sphere orbit across the scene
  orbitScene(s, c, sphere.view, { theta: 0.42, phi: 0.96 }, { startOffset: 0.1, endMargin: 0.6 });

  playOn(s, c, 'repair-encode-pooling', (d) => pulseT.to(1, { duration: d, ease: linear }), 1.5);
  playOn(s, c, 'encode-candidate-vector-3-b1-1', (d) => hiSpace.to(1, { duration: d }), 0.45);
  playOn(s, c, 'encode-candidate-vector-0-b2-1', (d) => hiPos.to(1, { duration: d }), 0.45);
  playOn(s, c, 'encode-unit-vector-contract-b2-2', (d) => hiNorm.to(1, { duration: d }), 0.45);
  playOn(s, c, 'repair-encode-format', (d) => showPrefix.to(1, { duration: d }), 0.5);

  c.hide('encode-candidate-vector-3-b3-1', [sphere.view, eqCos]);
  playOn(s, c, 'encode-candidate-vector-3-b3-1', (d) => swapVis(vSphere, vRecheck, d), 0.75);
}
