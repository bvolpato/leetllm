// Scene 5: attention: "Where will the contextual blend land?"
// Equal-unit 2D slice (coord 1 vs coord 4) with glowing convex-hull triangle of value vertices.
// Each value arrow shrinks by its attention weight and translates head-to-tail to land the
// completed contextual read strictly inside the triangle, while a 4-coord accumulator tracks all 4 features.
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  MODEL,
  ROLE,
  TOK_COLORS,
  WORDS,
  cinemaAtmosphere,
  clamp,
  fmt,
  glowRing,
  glowVector,
  lumBar,
  pct,
  playCue,
  slice14,
  sum,
  vectorPlane,
  vectorRow,
} from '../parts.mjs';

export default function attention(s, c) {
  const title = heroTitle(['Contextual blend', 'inside the hull'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.valid,
  });

  const w = MODEL.weights[2]; // [w0, w1, w2]
  const prods = MODEL.V.map((row, i) => row.map((v) => v * w[i]));
  const p1 = prods[0];
  const p2 = prods[0].map((v, j) => v + prods[1][j]);
  const p3 = MODEL.A[2];

  // Progress channels for the 3 head-to-tail transfers (0 -> 1 scale, 1 -> 2 translate)
  const step0 = s.value(0);
  const step1 = s.value(0);
  const step2 = s.value(0);
  const stageVis = s.value(1);

  const plane = vectorPlane({
    originX: -395,
    originY: 135,
    scaleX: 215,
    scaleY: 215,
    xMin: -1.6,
    xMax: 1.75,
    yMin: -1.25,
    yMax: 1.85,
    xTicks: [-1, 0, 1],
    yTicks: [-1, 0, 1],
    xLabel: 'c1',
    yLabel: 'c4',
  });

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const s0 = step0.value;
    const s1 = step1.value;
    const s2 = step2.value;
    const nodes = [];

    const verts = MODEL.V.map((v) => plane.toScreen(...slice14(v)));
    const origin = plane.toScreen(0, 0);

    // Convex hull triangle connecting the three value points
    nodes.push(
      glowingTrail([...verts, verts[0]], {
        color: '#6e83b7',
        width: 2.6,
        glow: 5,
        core: false,
        opacity: 0.72 * alpha,
      }),
      glowDot(origin[0], origin[1], { radius: 5, color: COSMOS.muted, glow: 4, opacity: alpha }),
    );

    // Value vertex beacons with external labels
    const labelOffsets = [
      [34, 8, 'left'],
      [-34, 12, 'right'],
      [-34, -10, 'right'],
    ];
    verts.forEach((pt, i) => {
      const [dx, dy, anc] = labelOffsets[i];
      nodes.push(
        glowRing(pt[0], pt[1], 13, TOK_COLORS[i], { width: 3, glow: 9, opacity: alpha }),
        txt(WORDS[i], pt[0] + dx, pt[1] + dy, 28, TOK_COLORS[i], 'mono', anc).opacity(alpha),
      );
    });

    // Step 0: function vector scales from full V[0] -> w[0]*V[0] at origin
    if (s0 > 0.02) {
      const factor = 1 + (w[0] - 1) * clamp(s0);
      const tip = plane.toScreen(MODEL.V[0][0] * factor, MODEL.V[0][3] * factor);
      nodes.push(
        glowVector(origin, tip, { color: TOK_COLORS[0], width: 5.5, glow: 11, opacity: alpha }),
      );
    }

    // Step 1: returns vector scales (0..1) then translates onto tip of p1 (1..2)
    if (s1 > 0.02) {
      const sc = clamp(s1);
      const mv = clamp(s1 - 1);
      const factor = 1 + (w[1] - 1) * sc;
      const from = [p1[0] * mv, p1[3] * mv];
      const to = [from[0] + MODEL.V[1][0] * factor, from[1] + MODEL.V[1][3] * factor];
      nodes.push(
        glowVector(plane.toScreen(...from), plane.toScreen(...to), {
          color: TOK_COLORS[1],
          width: 5.5,
          glow: 11,
          opacity: alpha,
        }),
      );
    }

    // Step 2: "the" vector scales (0..1) then translates onto tip of p2 (1..2)
    if (s2 > 0.02) {
      const sc = clamp(s2);
      const mv = clamp(s2 - 1);
      const factor = 1 + (w[2] - 1) * sc;
      const from = [p2[0] * mv, p2[3] * mv];
      const to = [from[0] + MODEL.V[2][0] * factor, from[1] + MODEL.V[2][3] * factor];
      nodes.push(
        glowVector(plane.toScreen(...from), plane.toScreen(...to), {
          color: TOK_COLORS[2],
          width: 5.5,
          glow: 11,
          opacity: alpha,
        }),
      );
      if (mv > 0.85) {
        const readPt = plane.toScreen(...slice14(p3));
        nodes.push(
          glowRing(readPt[0], readPt[1], 14, ROLE.query, { width: 3.5, glow: 14, opacity: alpha }),
          txt('read', readPt[0] - 15, 100, 28, ROLE.query, 'mono', 'center')
            .glow(8, ROLE.query)
            .opacity(alpha),
        );
      }
    }

    // RIGHT PANEL: Live weight bars & full 4-coordinate accumulator
    const rx = 450;
    nodes.push(
      txt('attention weights ("the" query)', rx, -300, 30, ROLE.query, 'mono', 'center').opacity(
        alpha,
      ),
    );
    WORDS.forEach((word, i) => {
      const wy = -215 + i * 95;
      const barW = w[i] * 360;
      const active = (i === 0 && s0 > 0.05) || (i === 1 && s1 > 0.05) || (i === 2 && s2 > 0.05);
      nodes.push(
        txt(word, 255, wy, 30, TOK_COLORS[i], 'mono', 'right').opacity(alpha),
        lumBar(290 + barW / 2, wy, barW, 40, {
          color: TOK_COLORS[i],
          fillOpacity: active ? 0.55 : 0.25,
          strokeWidth: active ? 2.8 : 1.8,
          glow: active ? 10 : 4,
          opacity: alpha,
        }),
        txt(`${fmt(w[i], 3)} (${pct(w[i])})`, 710, wy, 28, TOK_COLORS[i], 'mono', 'left').opacity(
          alpha,
        ),
      );
    });

    // Live 4-coordinate running sum
    const curSum = [0, 1, 2, 3].map(
      (j) => prods[0][j] * clamp(s0) + prods[1][j] * clamp(s1 - 1) + prods[2][j] * clamp(s2 - 1),
    );
    const doneCnt = (s0 > 0.9 ? 1 : 0) + (s1 > 1.9 ? 1 : 0) + (s2 > 1.9 ? 1 : 0);
    nodes.push(
      txt(
        doneCnt === 3
          ? 'complete 4-coord read (inside hull)'
          : `accumulated read (${doneCnt}/3 sources)`,
        rx,
        145,
        30,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(doneCnt === 3 ? 7 : 0, ROLE.query)
        .opacity(alpha),
      vectorRow({
        cx: rx,
        cy: 245,
        values: curSum,
        cellW: 152,
        cellH: 76,
        gap: 14,
        color: ROLE.query,
        digits: 3,
        opacity: alpha,
      }),
      txt(
        'c1 (x-axis) · c2 · c3 · c4 (y-axis)',
        rx,
        340,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.query), title, plane.node, mainLayer);

  playCue(s, c, 'mix-function', (d) => s.play(step0.to(1, { duration: d })), { dur: 1.1 });
  playCue(s, c, 'mix-returns', (d) => s.play(step1.to(2, { duration: d })), { dur: 1.6 });
  playCue(s, c, 'mix-the', (d) => s.play(step2.to(2, { duration: d })), { dur: 1.6 });
  void sum;
}
