// Scene 10: alignment-uniformity - "Separate a close positive pair from a collapsed space"
// Pure Cinema HERO 3D UNIT HYPERSPHERE: 4 glowing query-positive pairs orbit S^2 with emerald
// alignment beams, collapse onto a single singular pole (strict prediction hold -> 1/4 tie, ln 4),
// then expand uniformly across the 3D sphere!
import { curve3d, line3d, point3d } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildHypersphere3d,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playAfter,
  playOn,
  rule,
  txt,
} from '../parts.mjs';

export default function alignmentUniformity(s, c) {
  const pairs = 4;
  const spread = s.value(1);
  const hiAlign = s.value(0);
  const showLoss = s.value(0);
  const showSpreadSummary = s.value(0);

  const title = heroTitle(['Alignment vs. uniformity', 'on the unit hypersphere'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.positive,
  });

  // Hero orbiting 3D unit hypersphere S^2
  const sphere = buildHypersphere3d({
    x: -255,
    y: 45,
    radius: 2.7,
    theta: -0.72,
    phi: 1.05,
    distance: 13.0,
    unit: 118,
    accent: ROLE.anchor,
  });

  // 4 well-separated tetrahedral-ish anchors on S^2 that collapse smoothly toward pole (lon=0, lat=0)
  const baseCoords = [
    { lon: 0.0, lat: 0.12 },
    { lon: Math.PI * 0.5, lat: 0.42 },
    { lon: Math.PI, lat: -0.32 },
    { lon: Math.PI * 1.5, lat: -0.18 },
  ];

  const ptPair = (pIdx, isPos) => () => {
    const sp = spread.value;
    const base = baseCoords[pIdx];
    const lon = (base.lon + (isPos ? 0.17 : 0)) * sp;
    const lat = (base.lat + (isPos ? 0.08 : 0)) * sp;
    return sphere.ptOnSphere(lon, lat);
  };

  for (let p = 0; p < pairs; p++) {
    const qFn = ptPair(p, false);
    const posFn = ptPair(p, true);
    sphere.view.add(
      line3d([0, 0, 0], qFn, {
        color: ROLE.anchor,
        width: p === 0 ? 3.2 : 2.2,
        opacity: 0.55,
        blend: 'screen',
      }),
      // Alignment attraction beam connecting query -> positive partner
      line3d(qFn, posFn, {
        color: ROLE.positive,
        width: p === 0 ? 5.2 : 3.8,
        glow: 11,
        blend: 'screen',
        onTop: true,
      }),
      point3d(qFn, {
        color: ROLE.anchor,
        radius: p === 0 ? 9.5 : 7.5,
        glow: 13,
        blend: 'screen',
        onTop: true,
      }),
      point3d(posFn, {
        color: ROLE.positive,
        radius: p === 0 ? 9.5 : 7.5,
        glow: 13,
        blend: 'screen',
        onTop: true,
      }),
    );
  }

  // Repulsion geodesic ring connecting pair anchors around the sphere when spread > 0
  for (let p = 0; p < pairs; p++) {
    const next = (p + 1) % pairs;
    sphere.view.add(
      curve3d(
        (t) => {
          const a = ptPair(p, false)();
          const b = ptPair(next, false)();
          const x = a[0] * (1 - t) + b[0] * t;
          const y = a[1] * (1 - t) + b[1] * t;
          const z = a[2] * (1 - t) + b[2] * t;
          const n = Math.hypot(x, y, z) || 1;
          return [
            (x / n) * sphere.radius * 1.01,
            (y / n) * sphere.radius * 1.01,
            (z / n) * sphere.radius * 1.01,
          ];
        },
        0,
        1,
        {
          color: ROLE.competitor,
          width: 1.8,
          opacity: 0.42,
          glow: 4,
          blend: 'screen',
          samples: 24,
        },
      ),
    );
  }

  const eqCollapse = glowTex('\\mathcal{L}_{\\text{tied}} = \\ln N = \\ln 4 \\approx 1.386', {
    x: 520,
    y: 120,
    size: 36,
    color: ROLE.focus,
    glow: 7,
  });

  // Right-hand telemetry & visual uniformity/collapse diagnostics
  const hudLayer = guardedDynamic(s.value(1), () => {
    const sp = spread.value;
    const sl = showLoss.value;
    const su = showSpreadSummary.value;
    const rx = 520;
    const nodes = [
      rule(175, -330, 175, 405, COSMOS.rule, 1.8).opacity(0.55),
      // Legend dots
      glowDot(245, -285, { radius: 8, color: ROLE.anchor, glow: 11 }),
      txt('Query  qᵢ', 272, -285, 30, ROLE.anchor, 'sans', 'left'),
      glowDot(530, -285, { radius: 8, color: ROLE.positive, glow: 11 }),
      txt('Positive  pᵢ', 557, -285, 30, ROLE.positive, 'sans', 'left'),
      rule(225, -242, 835, -242, COSMOS.rule, 1.4).opacity(0.5),
    ];

    // Live state label (A8: crisp 2-state label, no brief transient flash)
    const isCollapsed = sp < 0.35;
    const stateLabel = isCollapsed ? 'COLLAPSED TO ONE POINT' : 'ALIGNED & UNIFORM ON S²';
    const stateCol = isCollapsed ? ROLE.competitor : ROLE.positive;
    nodes.push(txt(stateLabel, rx, -190, 30, stateCol, 'mono', 'center').glow(6, stateCol));

    if (sl > 0.05 && su < 0.5) {
      const op = sl * (1 - su * 2);
      // 4-way equal tie bar (25% each)
      nodes.push(
        txt('4-WAY TIE: EVERY PARTNER GETS 25%', rx, -90, 26, ROLE.focus, 'mono', 'center').opacity(
          op,
        ),
      );
      for (let k = 0; k < 4; k++) {
        const bx = 290 + k * 150;
        nodes.push(
          lumBar(bx, -25, 134, 52, {
            color: k === 0 ? ROLE.positive : ROLE.competitor,
            fillAlpha: 0.34,
            strokeWidth: 2.2,
            glow: 7,
            radius: 7,
            opacity: op,
          }),
          txt('25%', bx, -25, 28, COSMOS.ink, 'mono', 'center').opacity(op),
        );
      }
      nodes.push(
        txt(
          'Perfect alignment alone collapses ranking',
          rx,
          240,
          28,
          ROLE.competitor,
          'sans',
          'center',
        ).opacity(op),
      );
    } else if (su >= 0.5) {
      const op = (su - 0.5) * 2;
      nodes.push(
        txt('ALIGNMENT', 235, -90, 28, ROLE.positive, 'mono', 'left')
          .glow(5, ROLE.positive)
          .opacity(op),
        txt(
          'Keep each positive close to its query',
          235,
          -45,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(op),
        txt('UNIFORMITY', 235, 55, 28, ROLE.anchor, 'mono', 'left')
          .glow(5, ROLE.anchor)
          .opacity(op),
        txt(
          'Spread distinct pairs across S^(d-1)',
          235,
          100,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(op),
        txt(
          'Both forces together preserve discrimination',
          rx,
          235,
          28,
          ROLE.focus,
          'sans',
          'center',
        )
          .glow(5, ROLE.focus)
          .opacity(op),
      );
    } else if (isCollapsed) {
      // Prediction hold question while collapsed!
      nodes.push(
        txt('All 4 pairs sit at the exact same spot.', rx, -70, 30, COSMOS.ink, 'sans', 'center'),
        txt(
          'Can the query still pick out its partner?',
          rx,
          5,
          34,
          ROLE.focus,
          'serif',
          'center',
        ).glow(7, ROLE.focus),
      );
    } else {
      nodes.push(
        txt(
          'Green partner stays close to cyan query',
          rx,
          -80,
          30,
          ROLE.positive,
          'sans',
          'center',
        ).glow(hiAlign.value > 0.3 ? 6 : 0, ROLE.positive),
        txt('Other pairs sit far across the sphere', rx, -25, 28, COSMOS.muted, 'sans', 'center'),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.positive), title, sphere.view, hudLayer);
  orbitScene(s, c, sphere.view, { theta: 0.45, phi: 0.94 }, { startOffset: 0.1, endMargin: 0.55 });

  playOn(s, c, 'cl-alignment-uniformity-align', (d) => hiAlign.to(1, { duration: d }), 0.5);
  playOn(s, c, 'cl-alignment-uniformity-collapse', (d) => spread.to(0, { duration: d }), 2.0);
  c.show('cl-alignment-uniformity-loss', eqCollapse, { after: true });
  playAfter(s, c, 'cl-alignment-uniformity-loss', (d) => showLoss.to(1, { duration: d }), 0.45);
  c.hide('cl-alignment-uniformity-spread', eqCollapse);
  playOn(
    s,
    c,
    'cl-alignment-uniformity-spread',
    (d) => [spread.to(1, { duration: d }), showSpreadSummary.to(1, { duration: d })],
    2.0,
  );
}
