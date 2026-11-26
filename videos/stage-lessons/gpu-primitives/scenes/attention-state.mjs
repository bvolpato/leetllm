// Scene 18: Weighted attention carries its own output accumulator (m, d, O) + 3D quadratic arithmetic vs linear SRAM state.
import {
  ATTENTION,
  COSMOS,
  FIRST,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  siliconSlab3d,
  swapViews,
  txt,
} from '../parts.mjs';

function buildQuadraticVsLinear3d(phaseVal) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 16.0,
    unit: 112,
    focus: [0, 0, 0.3],
  }).at(380, 15);

  // Left inside 3D: 5x5 N x N quadratic score matrix slab (dim rose/slate)
  for (let r = 0; r < 5; r++) {
    for (let col = 0; col < 5; col++) {
      const x = -3.1 + col * 0.56;
      const y = -1.2 + r * 0.56;
      view.add(...box3d(x, y, 0.0, 0.44, 0.44, 0.24, '#241422', COSMOS.rose, 0.68));
    }
  }

  // Right inside 3D: N x 1 linear SRAM state strip (glowing cyan/emerald)
  for (let r = 0; r < 5; r++) {
    const y = -1.2 + r * 0.56;
    view.add(...box3d(1.1, y, 0.0, 0.48, 0.44, 0.52, '#0f2b3a', COSMOS.cyan, 0.85));
    view.add(...box3d(1.75, y, 0.0, 1.05, 0.44, 0.52, '#0d302c', COSMOS.emerald, 0.85));
  }

  view.add(...siliconSlab3d(3.4, 2.0, -0.08, 0.14, '#0f172c', COSMOS.blue, '#3d568a', 0.48));
  void phaseVal;
  return view;
}

export default function attentionState(s, c) {
  const phase = s.value(0);
  const showAccum = s.value(1);
  const rescaleFrac = s.value(0);
  const addNewMass = s.value(0);
  const showNormalized = s.value(0);
  const showUnscaledWarn = s.value(0);

  const showTiled = s.value(0);
  const showQuadNote = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e622', '#6ee7b718');
  const storage3d = buildQuadraticVsLinear3d(phase);

  // Beat 0-1: (m, d, Ox, Oy) synced rescaling & 2D output vector compass
  const accumView = guardedDynamic(showAccum, (a) => {
    const rs = rescaleFrac.value;
    const nw = addNewMass.value;
    const nm = showNormalized.value;
    const wn = showUnscaledWarn.value;

    const oldVal = FIRST.denominator * (1 + (Math.exp(-2) - 1) * rs);
    const freshVal = ATTENTION.fresh * nw;
    const barLeft = -690;
    const barMaxW = 740;
    const pxPerUnit = barMaxW / 1.5;

    const rows = [
      { name: 'd', old: oldVal, fresh: freshVal, y: -150, colA: COSMOS.blue, colB: COSMOS.cyan },
      { name: 'Oₓ', old: oldVal, fresh: 0, y: -15, colA: COSMOS.blue, colB: COSMOS.cyan },
      { name: 'Oᵧ', old: 0, fresh: freshVal, y: 120, colA: COSMOS.blue, colB: COSMOS.cyan },
    ];

    const nodes = [
      heroTitle(['Fused Attention:', 'Carry (m, d, O)'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.emerald,
        eyebrow: 'VALUES [1,0], [1,0] (PAIR 1)  ·  [0,1], [0,1] (PAIR 2)',
      }).opacity(a),

      txt(
        'RESCALE OLD d AND OLD O TOGETHER BY e⁻²',
        -690,
        -225,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
    ];

    rows.forEach((row) => {
      const wA = row.old * pxPerUnit;
      const wB = row.fresh * pxPerUnit;
      nodes.push(
        txt(row.name, -790, row.y, 40, COSMOS.ink, 'mono').opacity(a),
        rect(barMaxW, 66, { fill: '#10182b', stroke: '#273557', width: 2, radius: 8 })
          .at(barLeft + barMaxW * 0.5, row.y)
          .opacity(a),
      );
      if (wA > 2) {
        nodes.push(
          rect(wA, 60, { fill: row.colA, stroke: '#ffffff', width: 1, radius: 6 })
            .at(barLeft + wA * 0.5, row.y)
            .glow(7, row.colA)
            .opacity(0.92 * a),
        );
      }
      if (wB > 2) {
        nodes.push(
          rect(wB, 60, { fill: row.colB, stroke: '#ffffff', width: 1, radius: 6 })
            .at(barLeft + wA + wB * 0.5, row.y)
            .glow(8, row.colB)
            .opacity(0.92 * a),
        );
      }
      nodes.push(
        txt(
          (row.old + row.fresh).toFixed(3),
          barLeft + barMaxW + 30,
          row.y,
          32,
          COSMOS.gold,
          'mono',
          'left',
        ).opacity(a),
      );
    });

    // Right-hand 2D Output Vector Compass
    const cx = 560;
    const cy = 105;
    const axisLen = 250;
    const curTotal = Math.max(0.001, oldVal + freshVal);
    const vx = (oldVal / curTotal) * axisLen;
    const vy = (freshVal / curTotal) * axisLen;

    nodes.push(
      txt('OUTPUT VECTOR O / d', cx, -225, 26, COSMOS.emerald, 'mono').opacity(a),
      line([cx - 125, cy], [cx - 125 + axisLen + 20, cy], { stroke: '#3a4b73', width: 3 }).opacity(
        a,
      ),
      line([cx - 125, cy], [cx - 125, cy - axisLen - 20], { stroke: '#3a4b73', width: 3 }).opacity(
        a,
      ),
      txt('x [1,0]', cx + 150, cy + 32, 26, COSMOS.blue, 'mono').opacity(a),
      txt('y [0,1]', cx - 125, cy - axisLen - 44, 26, COSMOS.cyan, 'mono').opacity(a),
      glowingArc([cx - 125, cy], [cx - 125 + vx, cy - vy], 0, {
        color: nm > 0.5 ? COSMOS.emerald : COSMOS.gold,
        width: 5.5,
        opacity: a,
      }),
      glowDot(cx - 125 + vx, cy - vy, {
        radius: 10,
        color: nm > 0.5 ? COSMOS.emerald : COSMOS.gold,
        opacity: a,
      }),
    );

    if (nm > 0.02) {
      nodes.push(
        glassCell(0, 268, 1280, 82, COSMOS.emerald, {
          fill: '#0d2624',
          glow: 10,
          opacity: nm * a,
        }),
        txt(
          `O / d = [${ATTENTION.output[0].toFixed(3)}, ${ATTENTION.output[1].toFixed(3)}]   ≈   15% horizontal, 85% vertical`,
          0,
          268,
          30,
          COSMOS.emerald,
          'mono',
        )
          .glow(6, COSMOS.emerald)
          .opacity(nm * a),
      );
    }

    if (wn > 0.02) {
      nodes.push(
        glassCell(0, 386, 1520, 78, COSMOS.rose, { fill: '#22101a', glow: 8, opacity: wn * a }),
        txt(
          'Leaving old O unscaled overweights pair 1 even when denominator d is exact',
          0,
          386,
          28,
          COSMOS.rose,
          'sans',
        ).opacity(wn * a),
      );
    }

    return group(...nodes);
  });

  // Beat 2: FlashAttention tiled linear state vs quadratic arithmetic (paired with storage3d)
  const tiledView = guardedDynamic(showTiled, (a) => {
    const qn = showQuadNote.value;
    const nodes = [
      heroTitle(['FlashAttention:', 'Linear State on Chip'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.cyan,
        eyebrow: 'TILED SRAM STREAMING · ONE TILE AT A TIME',
      }).opacity(a),

      txt('3D: N×N SCORES (AVOIDED) vs N×d STATE', 380, -395, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),

      glassCell(-440, -125, 830, 146, COSMOS.emerald, { fill: '#0d2624', glow: 9, opacity: a }),
      txt('SAVED MEMORY:  O(N · d)', -440, -158, 32, COSMOS.emerald, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity(a),
      txt(
        'Output O & stats (m, d) scale linearly with N',
        -440,
        -96,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(a),

      glassCell(-440, 85, 830, 146, qn > 0.5 ? COSMOS.gold : COSMOS.rose, {
        fill: '#22121d',
        glow: 9,
        opacity: a,
      }),
      txt('ARITHMETIC FLOPS:  O(N²)', -440, 52, 32, COSMOS.rose, 'mono').opacity(a),
      txt('FLOPs stay quadratic · no N×N matrix stored', -440, 114, 26, COSMOS.ink, 'sans').opacity(
        a,
      ),

      glassCell(-440, 295, 830, 118, COSMOS.cyan, { fill: '#0e1d32', glow: 8, opacity: a }),
      txt(
        'Online (m, d, O) stays in SRAM across K,V tiles',
        -440,
        295,
        27,
        COSMOS.cyan,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, accumView, tiledView);
  runPhase(s, c, phase, 14);

  c.on('attention-state-step-1', () => s.play(rescaleFrac.to(1, { duration: 0.7 })));
  c.on('attention-new-mass', () => s.play(addNewMass.to(1, { duration: 0.55 })));
  c.on('attention-normalize', () => s.play(showNormalized.to(1, { duration: 0.45 })));
  c.on('attention-state-step-2', () => s.play(showUnscaledWarn.to(1, { duration: 0.4 })));

  c.show('attention-linear', storage3d, { lead: -0.22, fade: 0.22 });
  c.on('attention-linear', () => {
    swapViews(s, showAccum, showTiled, 0.16, 0.22);
    const dDur = Math.max(0.8, c.end - c.cue('attention-linear').start - 0.55);
    s.play(storage3d.orbit({ theta: 0.16, phi: 0.88 }, { duration: dDur }));
  });
  c.on('attention-state-step-3', () =>
    s.play(showQuadNote.to(1, { duration: remainDuration(c, 'attention-state-step-3', 0.45) })),
  );
}
