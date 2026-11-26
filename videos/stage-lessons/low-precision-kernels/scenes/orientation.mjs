// Scene 19: Turn the grouping axis: 3D 32x32 matrix slab turning from horizontal row-0 scale (0.001 -> 0) to fresh vertical col-1 scale (0.001 -> 0.000977).
import {
  COSMOS,
  ORIENT_WS,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line3d,
  orbitScene,
  points3d,
  remainDuration,
  runPhase,
  siliconSlab3d,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function orientation(s, c) {
  const phase = s.value(0);
  const showColLook = s.value(0);
  const showTransposeWarn = s.value(0);
  const toFreshCol = s.value(0);
  const showSurvived = s.value(0);

  const bgAura = aura(320, 10, 560, '#ffd16622', '#6ee7b71a');
  const title = heroTitle(['Turn the', 'Grouping Axis'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.gold,
    eyebrow: '32 × 32 MATRIX · ROW-WISE VS COLUMN-WISE GROUPS',
  });

  // 3D orbiting 32x32 matrix slab with spike at (0,0) and tiny 0.001 at (0,1)
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 0.98,
    distance: 15.2,
    unit: 102,
    focus: [0, 0, 0.35],
  }).at(360, 20);

  const matrixBase = siliconSlab3d(2.4, 2.4, 0.0, 0.24, '#13203d', COSMOS.blue, '#6c8cd5', 0.62);
  // Spike 700 tower at (-2.05, -2.05) and tiny 0.001 cell at (-1.35, -2.05)
  const spikeTower = box3d(-2.25, -2.25, 0.02, 0.55, 0.55, 2.15, '#965c14', COSMOS.amber, 0.88);
  const tinyCell = box3d(-1.55, -2.25, 0.02, 0.55, 0.55, 0.35, '#195c78', COSMOS.gold, 0.92);

  // Horizontal row-0 wireframe slab (includes BOTH 700 and 0.001!)
  const rowCage = wireframeSlab3d([0.0, -1.97, 0.36], 2.38, 0.38, 0.34, {
    color: COSMOS.rose,
    width: 3.2,
    glow: 9,
  });

  // Vertical column-1 wireframe slab (includes 0.001 + thirty-one 1s, EXCLUDES 700!)
  const colCage = wireframeSlab3d([-1.27, 0.0, 0.36], 0.38, 2.38, 0.34, {
    color: COSMOS.emerald,
    width: 3.2,
    glow: 9,
  });

  // Grid guides on top of the 32x32 matrix
  const gridLines = [];
  for (let i = -2; i <= 2; i++) {
    const p = i * 1.1;
    gridLines.push(
      line3d([p, -2.35, 0.03], [p, 2.35, 0.03], { color: '#394f7a', width: 1.2, opacity: 0.45 }),
      line3d([-2.35, p, 0.03], [2.35, p, 0.03], { color: '#394f7a', width: 1.2, opacity: 0.45 }),
    );
  }

  const scanPhotons = points3d(
    () => {
      const ph = phase.value;
      const colMode = toFreshCol.value > 0.5;
      const u = (ph * 0.55) % 1;
      if (!colMode) {
        return [[-2.2 + u * 4.4, -1.97, 0.72]];
      }
      return [[-1.27, -2.2 + u * 4.4, 0.72]];
    },
    { color: COSMOS.gold, radius: 7, glow: 14, blend: 'screen', onTop: true },
  );

  view3d.add(
    ...matrixBase,
    ...gridLines,
    ...spikeTower,
    ...tinyCell,
    ...rowCage,
    ...colCage,
    scanPhotons,
  );

  const live = guardedDynamic(1, () => {
    const cl = showColLook.value;
    const tw = showTransposeWarn.value;
    const fc = toFreshCol.value;
    const sv = showSurvived.value;
    const isFresh = fc > 0.5;

    const nodes = [
      // 3D captions
      txt(
        '3D 32 × 32 MATRIX · (0,0) = 700 · (0,1) = 0.001',
        360,
        -390,
        26,
        COSMOS.gold,
        'mono',
      ).glow(5, COSMOS.gold),
      txt(
        isFresh
          ? 'Emerald vertical group excludes 700 (reads wider source)'
          : 'Rose horizontal group traps 0.001 beside 700',
        360,
        420,
        26,
        isFresh ? COSMOS.emerald : COSMOS.rose,
        'sans',
      ),

      // Left panel 1: Horizontal row group
      glassCell(-510, -140, 690, 164, COSMOS.rose, { fill: '#201020', glow: isFresh ? 3 : 9 }),
      txt('HORIZONTAL ROW 0 GROUP (1 × 32)', -825, -190, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        `Contains 700 & 0.001 → S_row = ${ORIENT_WS.rowScales[0]}`,
        -825,
        -138,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        `Cell (0, 1) rounds 0.001 → ${ORIENT_WS.rowTiny.reconstructed} (lost!)`,
        -825,
        -88,
        28,
        COSMOS.rose,
        'mono',
        'left',
      ),

      // Left panel 2: Naive transpose trap
      glassCell(-510, 65, 690, 148, COSMOS.amber, {
        fill: '#1e1612',
        glow: 8,
        opacity: 0.2 + 0.8 * Math.max(cl, tw),
      }),
      txt('TRAP: TRANSPOSE OLD FP8 BYTES', -825, 22, 26, COSMOS.amber, 'mono', 'left').opacity(
        0.2 + 0.8 * Math.max(cl, tw),
      ),
      txt(
        tw > 0.5
          ? 'Carries the dead 0 into column 1 (0.001 already lost)'
          : 'Column 1 holds 0.001 and thirty-one 1s (no spike!)',
        -825,
        82,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(0.2 + 0.8 * Math.max(cl, tw)),

      // Left panel 3: Fresh column quantization from wider source
      glassCell(-495, 280, 720, 178, COSMOS.emerald, {
        fill: '#0d2224',
        glow: 10,
        opacity: 0.18 + 0.82 * fc,
      }),
      txt(
        'FRESH VERTICAL COLUMN 1 (32 × 1)',
        -825,
        224,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(0.18 + 0.82 * fc),
      txt('Wider col: max = 1 → S_col = 2^-8', -825, 276, 28, COSMOS.ink, 'mono', 'left').opacity(
        0.18 + 0.82 * fc,
      ),
      txt(
        sv > 0.5
          ? `0.001 → ${ORIENT_WS.columnTiny.reconstructed.toFixed(6)} (~0.00098)`
          : 'Quantize each axis from wider source',
        -825,
        330,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      )
        .glow(6, COSMOS.emerald)
        .opacity(0.18 + 0.82 * fc),
    ];

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, view3d, { theta: -0.15, phi: 0.88 });

  c.on('lp-orientation-build-0', () =>
    s.play(showColLook.to(1, { duration: remainDuration(c, 'lp-orientation-build-0', 0.45) })),
  );
  c.on('lp-orientation-transpose', () =>
    s.play(
      showTransposeWarn.to(1, { duration: remainDuration(c, 'lp-orientation-transpose', 0.45) }),
    ),
  );
  c.on('lp-orientation-build-1', () =>
    s.play(toFreshCol.to(1, { duration: remainDuration(c, 'lp-orientation-build-1', 0.55) })),
  );
  c.on('lp-orientation-fresh', () =>
    s.play(showSurvived.to(1, { duration: remainDuration(c, 'lp-orientation-fresh', 0.45) })),
  );
}
