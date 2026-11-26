// Scene 02: attention - Two query heads attend over the exact same shared KV history.
import {
  ATTENTION,
  COSMOS,
  QUERY_VECTORS,
  ROLE,
  buildVectorPlane,
  cinemaAtmosphere,
  glowTex,
  glowVector,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  renderGqaRack2d,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function attention(s, c) {
  const phase = s.value(0);
  const lit = s.value(0);
  const cursor = s.value(-1);

  // Head 0 progression
  const h0Query = s.value(0);
  const h0Scaled = s.value(0);
  const h0Weights = s.value(0);
  const h0Blend = s.value(0);

  // Head 1 progression (strictly withheld until 'answer' & 'combination')
  const h1Query = s.value(0);
  const h1Ask = s.value(0);
  const h1Answer = s.value(0);
  const h1Blend = s.value(0);

  const title = heroTitle(['Two readers at', 'the same history'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.query,
    eyebrow: 'SHARED KV · DISTINCT WEIGHTS',
  });

  const formula = glowTex(
    String.raw`\operatorname{softmax}\!\left(\frac{Q K^{\top}}{\sqrt{2}}\right)V`,
    { x: 465, y: -395, size: 36, color: ROLE.gold, glow: 6 },
  );

  // Dual synchronized vector planes on the right half
  const plane0 = buildVectorPlane({
    originX: 40,
    originY: -34,
    scale: 100,
    xMin: -0.25,
    xMax: 2.2,
    yMin: -0.25,
    yMax: 1.5,
    step: 1,
    xLabel: 'Rain',
    yLabel: 'fell',
    showTicks: true,
  });
  const plane1 = buildVectorPlane({
    originX: 40,
    originY: 342,
    scale: 94,
    xMin: -0.25,
    xMax: 2.2,
    yMin: -0.25,
    yMax: 2.15,
    step: 1,
    xLabel: 'Rain',
    yLabel: 'fell',
    showTicks: true,
  });

  const fmtPair = (arr) => arr.map((v) => v.toFixed(2)).join(', ');

  const live = guardedDynamic(1, () => {
    const nodes = [
      ...renderGqaRack2d({
        left: -855,
        top: -215,
        width: 710,
        height: 550,
        mode: 1,
        tokens: 2,
        slots: 4,
        lit: lit.value,
        cursor: cursor.value,
        phase: phase.value,
        colNames: ['Rain', 'fell', '2', '3'],
      }),
      rule(-90, -305, -90, 410, COSMOS.rule, 1.6).opacity(0.6),
      txt(
        'Shared Group 0:  Rain K=V=(1,0)   ·   fell K=V=(0,1)',
        405,
        -295,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
    ];

    // Base shared K/V unit vectors on both planes
    for (const pl of [plane0, plane1]) {
      nodes.push(
        glowVector(pl.origin, pl.toScreen(1, 0), {
          color: ROLE.value,
          width: 4,
          tipSize: 13,
          glow: 5,
        }),
        glowVector(pl.origin, pl.toScreen(0, 1), {
          color: ROLE.value,
          width: 4,
          tipSize: 13,
          glow: 5,
        }),
      );
    }

    // --- HEAD 0 (top right) ---
    const q0Op = h0Query.value;
    const sc0 = h0Scaled.value;
    const w0Op = h0Weights.value;
    const b0Op = h0Blend.value;
    const a0 = ATTENTION[0];
    const rx = 385;

    if (q0Op > 0.02) {
      const tipQ0 = [QUERY_VECTORS[0][0] * q0Op, QUERY_VECTORS[0][1] * q0Op];
      nodes.push(
        glowVector(plane0.origin, plane0.toScreen(...tipQ0), {
          color: ROLE.query,
          width: 6,
          tipSize: 16,
          glow: 9,
          opacity: q0Op,
        }),
        txt('Q0 = [2, 0]', rx, -215, 32, ROLE.query, 'mono', 'left').opacity(q0Op),
        txt(
          sc0 > 0.5 ? `Scaled: ${fmtPair(a0.scores)}` : 'Dot products: 2, 0',
          rx,
          -160,
          28,
          ROLE.key,
          'mono',
          'left',
        ).opacity(q0Op),
      );
    }
    if (w0Op > 0.02) {
      const barW = 380;
      const wRain = barW * a0.weights[0];
      const wFell = barW * a0.weights[1];
      nodes.push(
        txt(`Weights: ${fmtPair(a0.weights)}`, rx, -108, 28, COSMOS.ink, 'mono', 'left').opacity(
          w0Op,
        ),
        lumBar(rx + wRain / 2, -62, wRain - 4, 24, {
          color: ROLE.key,
          fillOpacity: 0.55,
          glow: 7,
          radius: 4,
          opacity: w0Op,
        }),
        lumBar(rx + wRain + wFell / 2, -62, wFell - 4, 24, {
          color: ROLE.pos,
          fillOpacity: 0.5,
          glow: 6,
          radius: 4,
          opacity: w0Op,
        }),
      );
    }
    if (b0Op > 0.02) {
      const tipOut0 = [a0.output[0] * b0Op, a0.output[1] * b0Op];
      nodes.push(
        glowVector(plane0.origin, plane0.toScreen(...tipOut0), {
          color: ROLE.gold,
          width: 6.5,
          tipSize: 16,
          glow: 11,
          opacity: b0Op,
        }),
        txt(`Output: (${fmtPair(a0.output)})`, rx, -12, 30, ROLE.gold, 'mono', 'left')
          .glow(6, ROLE.gold)
          .opacity(b0Op),
      );
    }

    // Subtle divider between Head 0 and Head 1
    nodes.push(rule(-50, 62, 860, 62, COSMOS.rule, 1.5).opacity(0.55));

    // --- HEAD 1 (bottom right) ---
    const q1Op = h1Query.value;
    const ask1 = h1Ask.value;
    const ans1 = h1Answer.value;
    const b1Op = h1Blend.value;
    const a1 = ATTENTION[1];

    if (q1Op > 0.02) {
      const tipQ1 = [QUERY_VECTORS[1][0] * q1Op, QUERY_VECTORS[1][1] * q1Op];
      nodes.push(
        glowVector(plane1.origin, plane1.toScreen(...tipQ1), {
          color: ROLE.query,
          width: 6,
          tipSize: 16,
          glow: 9,
          opacity: q1Op,
        }),
        txt('Q1 = [0, 2]', rx, 118, 32, ROLE.query, 'mono', 'left').opacity(q1Op),
      );
    }

    // Strict prediction withholding: show question until c.after('answer')
    if (ans1 > 0.02) {
      const barW = 380;
      const wRain = barW * a1.weights[0];
      const wFell = barW * a1.weights[1];
      nodes.push(
        txt(`Scaled: ${fmtPair(a1.scores)}`, rx, 174, 28, ROLE.key, 'mono', 'left').opacity(ans1),
        txt(`Weights: ${fmtPair(a1.weights)}`, rx, 224, 28, COSMOS.ink, 'mono', 'left').opacity(
          ans1,
        ),
        lumBar(rx + wRain / 2, 270, wRain - 4, 24, {
          color: ROLE.key,
          fillOpacity: 0.45,
          glow: 5,
          radius: 4,
          opacity: ans1,
        }),
        lumBar(rx + wRain + wFell / 2, 270, wFell - 4, 24, {
          color: ROLE.gold,
          fillOpacity: 0.6,
          glow: 9,
          radius: 4,
          opacity: ans1,
        }),
      );
    } else if (ask1 > 0.02) {
      nodes.push(
        txt('Same keys & values.', rx, 186, 28, COSMOS.muted, 'sans', 'left').opacity(ask1),
        txt('Which token gets more weight?', rx, 240, 30, ROLE.gold, 'serif', 'left')
          .glow(7, ROLE.gold)
          .opacity(ask1),
      );
    }

    if (b1Op > 0.02) {
      const tipOut1 = [a1.output[0] * b1Op, a1.output[1] * b1Op];
      nodes.push(
        glowVector(plane1.origin, plane1.toScreen(...tipOut1), {
          color: ROLE.gold,
          width: 6.5,
          tipSize: 16,
          glow: 11,
          opacity: b1Op,
        }),
        txt(`Output: (${fmtPair(a1.output)})`, rx, 326, 30, ROLE.gold, 'mono', 'left')
          .glow(6, ROLE.gold)
          .opacity(b1Op),
      );
    }

    // Bottom floating summary line
    const footText =
      ans1 > 0.5
        ? 'Q1 gives ~80% weight to fell, using the exact same cached history'
        : ask1 > 0.5
          ? 'Predict: Q1 points along (0, 1) -> Rain or fell?'
          : 'Each query head produces its own weights from the shared K/V group';
    nodes.push(
      txt(
        footText,
        0,
        446,
        28,
        ans1 > 0.5 ? ROLE.gold : ask1 > 0.5 ? ROLE.gold : COSMOS.muted,
        'sans',
        'center',
      ),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.value), title, formula, plane0.node, plane1.node, live);
  runPhase(s, c, phase, 14);

  playCue(s, c, 'positions', (d) => s.play(cursor.to(-1, { duration: Math.min(0.2, d) })), {
    dur: 0.25,
  });
  playCue(
    s,
    c,
    'score',
    (d) => s.play(lit.to(0, { duration: 0.25 }), h0Query.to(1, { duration: d })),
    { dur: 0.65 },
  );
  playCue(s, c, 'scale', (d) => s.play(h0Scaled.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'weights',
    (d) => s.play(cursor.to(0, { duration: 0.2 }), h0Weights.to(1, { duration: d })),
    { after: true, dur: 0.5 },
  );
  playCue(s, c, 'blend', (d) => s.play(h0Blend.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });

  playCue(
    s,
    c,
    'second',
    (d) =>
      s.play(
        cursor.to(-1, { duration: 0.18 }),
        lit.to(1, { duration: 0.3 }),
        h1Query.to(1, { duration: d }),
      ),
    { dur: 0.65 },
  );
  playCue(s, c, 'ask', (d) => s.play(h1Ask.to(1, { duration: d })), { dur: 0.35 });
  playCue(
    s,
    c,
    'answer',
    (d) => s.play(cursor.to(1, { duration: 0.2 }), h1Answer.to(1, { duration: d })),
    { after: true, dur: 0.5 },
  );
  playCue(s, c, 'combination', (d) => s.play(h1Blend.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
}
