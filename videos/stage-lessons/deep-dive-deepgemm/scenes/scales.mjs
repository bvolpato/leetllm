// Scene 06: What does each group contribute?
// PREDICTION SCENE: keep 2.5, 6.5, and shrunk bar 1 strictly concealed until beat 1 cues!
import {
  COSMOS,
  ROLE,
  SCALED_DOT,
  aura,
  buildFp8WgmmaCube3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function scales(s, c) {
  const phase = s.value(0);
  const kCursor = s.value(0);
  const promoVal = s.value(0.1);
  const showRaw = s.value(0);
  const showScales = s.value(0);
  const shrink = s.value(0); // 0 -> 1 shrinks group 1 bar from 5 -> 2.5
  const reveal25 = s.value(0); // STRICT: c.after('dg-scales-1-1')
  const reveal65 = s.value(0); // STRICT: c.after('dg-scales-1-2')
  const showWrong9 = s.value(0);
  const showDequant = s.value(0);

  const bgAura = aura(445, 20, 520, '#a78bfa22', '#5ce1e618');
  const { view: cube3d } = buildFp8WgmmaCube3d(kCursor, promoVal, phase, {
    x: 455,
    y: 15,
    unit: 94,
  });

  const title = heroTitle(['What Does Each', 'Group Contribute?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.scale,
    eyebrow: 'BLOCK-SCALED DOT · INSIDE K',
    subtitle: 'Two K-groups with independent activation & weight scales',
  });

  const live = guardedDynamic(1, () => {
    const sh = shrink.value;
    const g0Val = SCALED_DOT.raw[0]; // 4
    const g1Val = SCALED_DOT.raw[1] + (SCALED_DOT.partial[1] - SCALED_DOT.raw[1]) * sh; // 5 -> 2.5
    const pxPerUnit = 66;
    const barBaseX = -730;

    const nodes = [
      txt('3D BLOCK-SCALED FP32 PROMOTION', 455, -415, 26, ROLE.scale, 'mono').glow(5, ROLE.scale),
      txt(
        'Violet cube: per-group s_a · s_b inside K reduction',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Group 0 and Group 1 stored pairs
    const groups = [
      { idx: 0, label: 'GROUP 0', a: [1, 2], z: [2, 1], sa: 0.5, sz: 2, raw: 4, sp: 1, x: -670 },
      {
        idx: 1,
        label: 'GROUP 1',
        a: [3, 4],
        z: [-1, 2],
        sa: 2,
        sz: 0.25,
        raw: 5,
        sp: 0.5,
        x: -250,
      },
    ];

    groups.forEach((g) => {
      const border = g.idx === 1 && sh > 0.1 ? ROLE.gold : ROLE.scale;
      nodes.push(
        glassCell(g.x, -104, 388, 174, border, {
          fill: '#0e1629',
          glow: g.idx === 1 && sh > 0.1 ? 9 : 4,
        }),
        txt(g.label, g.x, -162, 26, ROLE.scale, 'mono'),
        txt(`a=[${g.a.join(',')}]  b=[${g.z.join(',')}]`, g.x, -120, 26, COSMOS.ink, 'mono'),
      );
      if (showRaw.value > 0.05) {
        nodes.push(txt(`raw dot = ${g.raw}`, g.x, -78, 26, ROLE.c, 'mono').opacity(showRaw.value));
      }
      if (showScales.value > 0.05) {
        nodes.push(
          txt(`s = ${g.sa} × ${g.sz} = ${g.sp}`, g.x, -40, 26, ROLE.gold, 'mono').opacity(
            showScales.value,
          ),
        );
      }
    });

    // Contribution ruler (Group 0 bar = 4, Group 1 bar shrinks 5 -> 2.5)
    nodes.push(
      line([barBaseX, 24], [barBaseX + 9.5 * pxPerUnit, 24], { stroke: COSMOS.dim, width: 2 }),
    );
    for (const tick of [0, 2, 4, 6, 8, 9]) {
      const tx = barBaseX + tick * pxPerUnit;
      nodes.push(
        line([tx, 16], [tx, 32], { stroke: COSMOS.dim, width: 2 }),
        txt(String(tick), tx, 60, 26, COSMOS.muted, 'mono'),
      );
    }

    const w0 = g0Val * pxPerUnit;
    const w1 = g1Val * pxPerUnit;
    nodes.push(
      txt('G0', -835, 122, 28, ROLE.c, 'mono', 'left'),
      rect(w0, 44, { fill: '#104c63', stroke: ROLE.c, width: 2.2, radius: 5 })
        .at(barBaseX + w0 * 0.5, 122)
        .glow(5, ROLE.c),
      txt('4.0', barBaseX + w0 + 18, 122, 28, ROLE.c, 'mono', 'left'),

      txt('G1', -835, 196, 28, ROLE.scale, 'mono', 'left'),
      rect(w1, 44, {
        fill: sh > 0.1 ? '#361f66' : '#1b2848',
        stroke: sh > 0.1 ? ROLE.gold : ROLE.scale,
        width: 2.2,
        radius: 5,
      })
        .at(barBaseX + w1 * 0.5, 196)
        .glow(sh > 0.1 ? 8 : 4, sh > 0.1 ? ROLE.gold : ROLE.scale),
      txt(
        reveal25.value > 0.5 ? '2.5 (5 × 0.5)' : sh > 0.05 ? 'scaling...' : '5.0 raw',
        barBaseX + w1 + 18,
        196,
        28,
        reveal25.value > 0.5 ? ROLE.gold : COSMOS.muted,
        'mono',
        'left',
      ),
    );

    // Prediction prompt before reveal65
    if (showScales.value > 0.5 && sh < 0.05) {
      nodes.push(
        txt('Predict: 4 × 1 + 5 × 0.5 = ?', -860, 290, 32, ROLE.gold, 'serif', 'left').glow(
          6,
          ROLE.gold,
        ),
      );
    }

    // Answer revealed strictly after dg-scales-1-2
    if (reveal65.value > 0.05) {
      nodes.push(
        glassCell(-460, 305, 800, 82, ROLE.good, {
          fill: '#0f2822',
          glow: 9,
          opacity: reveal65.value,
        }),
        txt(
          showDequant.value > 0.5
            ? 'Dequant: 6×(-0.25) + 8×0.5 = 2.5 -> 6.5'
            : showWrong9.value > 0.5
              ? 'Scaled = 6.5 · Borrowed = 9.0 (2× err)'
              : 'Scaled dot = 4 + 2.5 = 6.5',
          -460,
          305,
          26,
          showWrong9.value > 0.5 && showDequant.value < 0.5 ? ROLE.gold : ROLE.good,
          'mono',
        ).opacity(reveal65.value),
      );
    }

    nodes.push(
      txt(
        showDequant.value > 0.5
          ? 'Both routes match: scale belongs inside the K sum'
          : 'Scale factors multiply partial dots before summing across K',
        -860,
        396,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, cube3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cube3d, { theta: -0.2, phi: 0.92 });

  c.on('dg-scales-0-0', () =>
    s.play(kCursor.to(0.5, { duration: remainDuration(c, 'dg-scales-0-0', 0.45) })),
  );
  c.on('dg-scales-0-2', () =>
    s.play(showRaw.to(1, { duration: remainDuration(c, 'dg-scales-0-2', 0.45) })),
  );
  c.on('dg-scales-0-3', () =>
    s.play(showScales.to(1, { duration: remainDuration(c, 'dg-scales-0-3', 0.45) })),
  );

  c.on('dg-scales-1-0', () => {
    const dur = remainDuration(c, 'dg-scales-1-0', 0.75);
    s.play(shrink.to(1, { duration: dur }));
    s.play(kCursor.to(1.8, { duration: dur }));
  });
  c.after('dg-scales-1-1', () =>
    s.play(reveal25.to(1, { duration: remainAfterDuration(c, 'dg-scales-1-1', 0.35) })),
  );
  c.after('dg-scales-1-2', () => {
    const dur = remainAfterDuration(c, 'dg-scales-1-2', 0.35);
    s.play(reveal65.to(1, { duration: dur }));
    s.play(promoVal.to(1, { duration: dur }));
  });
  c.after('dg-scales-1-3', () =>
    s.play(showWrong9.to(1, { duration: remainAfterDuration(c, 'dg-scales-1-3', 0.4) })),
  );
  c.on('dg-scales-2-1', () =>
    s.play(showDequant.to(1, { duration: remainDuration(c, 'dg-scales-2-1', 0.45) })),
  );
  c.on('dg-scales-2-2', () =>
    s.play(kCursor.to(2, { duration: remainDuration(c, 'dg-scales-2-2', 0.4) })),
  );
}
