// Scene 11: Which activations share a scale? Tensor-wide scale wipes 0.001; per-row MX power-of-two rescues 0.001 -> 0.000977 and shifts 500 -> 512.
import {
  COSMOS,
  aura,
  experiment,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function localScales(s, c) {
  const phase = s.value(0);
  const showSharedTiny = s.value(0);
  const showSharedSpike = s.value(0);
  const splitRows = s.value(0);
  const showSpikeProbe = s.value(0);
  const showSpike512 = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61f', '#ffd16618');
  const title = heroTitle(['Which Values', 'Share a Scale?'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.cyan,
    eyebrow: 'TENSOR-WIDE VS PER-ROW POWER-OF-TWO SCALES',
  });

  const live = guardedDynamic(1, () => {
    const shT = showSharedTiny.value;
    const shS = showSharedSpike.value;
    const spl = splitRows.value;
    const spP = showSpikeProbe.value;
    const sp512 = showSpike512.value;
    const isSplit = spl > 0.5;

    const nodes = [];

    // Top two 32-value rows visualized as glowing segmented ribbons
    const rowX0 = -240;
    const rowW = 1040;
    const cellW = rowW / 32;
    const yR0 = -255;
    const yR1 = -145;

    nodes.push(
      txt('Row 0 (32 vals · min 0.001)', -260, yR0, 26, COSMOS.cyan, 'mono', 'right'),
      txt('Row 1 (32 vals · max 500)', -260, yR1, 26, COSMOS.amber, 'mono', 'right'),
    );

    for (let k = 0; k < 32; k++) {
      const cx = rowX0 + k * cellW + cellW * 0.5;
      const isTiny = k === 0;
      const isSpike = k === 3;
      nodes.push(
        rect(cellW - 3, 48, {
          fill: isTiny ? '#14324c' : '#0f182c',
          stroke: isTiny ? COSMOS.cyan : '#2a395c',
          width: isTiny ? 3 : 1.4,
          radius: 4,
        })
          .at(cx, yR0)
          .glow(isTiny ? 8 : 0, COSMOS.cyan),
        rect(cellW - 3, 48, {
          fill: isSpike ? '#302010' : '#0f182c',
          stroke: isSpike ? COSMOS.gold : '#2a395c',
          width: isSpike ? 3 : 1.4,
          radius: 4,
        })
          .at(cx, yR1)
          .glow(isSpike ? 8 : 0, COSMOS.gold),
      );
    }

    // Scale ownership bracket(s) around the two rows
    if (!isSplit) {
      nodes.push(
        rect(rowW + 24, 186, { fill: null, stroke: COSMOS.rose, width: 3.4, radius: 14 })
          .at(rowX0 + rowW * 0.5, (yR0 + yR1) * 0.5)
          .glow(8, COSMOS.rose),
        txt(
          '1 SHARED TENSOR SCALE · S = 500 / 448 ≈ 1.116',
          rowX0 + rowW * 0.5,
          -342,
          26,
          COSMOS.rose,
          'mono',
        ).glow(5, COSMOS.rose),
      );
    } else {
      nodes.push(
        rect(rowW + 20, 68, { fill: null, stroke: COSMOS.emerald, width: 3.2, radius: 10 })
          .at(rowX0 + rowW * 0.5, yR0)
          .glow(8, COSMOS.emerald),
        rect(rowW + 20, 68, { fill: null, stroke: COSMOS.gold, width: 3.2, radius: 10 })
          .at(rowX0 + rowW * 0.5, yR1)
          .glow(8, COSMOS.gold),
        txt(
          'Row 0 scale: S_0 = 2^-8 (step 2^-17)',
          rowX0 + rowW * 0.5,
          -318,
          26,
          COSMOS.emerald,
          'mono',
        ),
        txt(
          'Row 1 scale: S_1 = 2 (power of 2 ≥ 500/448)',
          rowX0 + rowW * 0.5,
          -72,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
    }

    // Left magnified ruler: Row 0 index 0 (input 0.001)
    const lx0 = -815;
    const lx1 = -75;
    const ly = 188;
    const stepTen = experiment.tensorScale * 2 ** -9; // ~0.00218
    const tinyVal = isSplit
      ? experiment.block[0][0].reconstructed
      : experiment.tensor[0][0].reconstructed;
    const maxL = isSplit ? 0.0012 : 0.0024;
    const mapL = (v) => lx0 + (v / maxL) * (lx1 - lx0);

    nodes.push(
      glassCell(-445, 228, 810, 368, isSplit ? COSMOS.emerald : COSMOS.rose, {
        fill: '#0c1424',
        glow: 7,
      }),
      txt('INDEX [0, 0] · SOURCE = 0.001', -445, 78, 26, COSMOS.cyan, 'mono'),
      line([lx0, ly], [lx1, ly], { stroke: '#465885', width: 3.2 }),
      line([mapL(0), ly - 22], [mapL(0), ly + 22], { stroke: COSMOS.muted, width: 3 }),
      txt('0', mapL(0), ly + 50, 26, COSMOS.muted, 'mono'),
    );

    if (!isSplit) {
      nodes.push(
        line([mapL(stepTen), ly - 22], [mapL(stepTen), ly + 22], { stroke: COSMOS.rose, width: 3 }),
        txt('first step ≈ 0.00218', mapL(stepTen), ly + 50, 26, COSMOS.rose, 'mono', 'right'),
        glowDot(mapL(0.001), ly - 16, { radius: 8, color: COSMOS.blue }),
        txt('0.001', mapL(0.001), ly - 48, 26, COSMOS.blue, 'mono'),
        ...(shT > 0.02
          ? [
              glowDot(mapL(0), ly + 16, { radius: 9, color: COSMOS.rose, opacity: shT }),
              txt(`Stored = ${tinyVal} (flushed to zero!)`, -445, 342, 32, COSMOS.rose, 'mono')
                .glow(6, COSMOS.rose)
                .opacity(shT),
            ]
          : []),
      );
    } else {
      const mxRes = experiment.block[0][0].reconstructed;
      nodes.push(
        line([mapL(mxRes), ly - 22], [mapL(mxRes), ly + 22], {
          stroke: COSMOS.emerald,
          width: 3.4,
        }),
        glowDot(mapL(0.001), ly - 16, { radius: 8, color: COSMOS.blue }),
        txt('0.001', mapL(0.001) + 22, ly - 48, 26, COSMOS.blue, 'mono'),
        glowDot(mapL(mxRes), ly + 16, { radius: 9, color: COSMOS.emerald }),
        txt(`Rescued: ${mxRes.toFixed(6)} (~0.00098)`, -445, 342, 30, COSMOS.emerald, 'mono').glow(
          6,
          COSMOS.emerald,
        ),
      );
    }

    // Right magnified ruler: Row 1 index 3 (input 500)
    const rx0 = 75;
    const rx1 = 815;
    const ry = 188;
    const mapR = (v) => rx0 + ((v - 472) / (528 - 472)) * (rx1 - rx0);
    const spikeOut = sp512 > 0.5 ? experiment.block[1][3].reconstructed : 500;

    nodes.push(
      glassCell(445, 228, 810, 368, sp512 > 0.5 ? COSMOS.gold : COSMOS.cyan, {
        fill: '#0c1424',
        glow: 7,
      }),
      txt('INDEX [1, 3] · SOURCE = 500', 445, 78, 26, COSMOS.amber, 'mono'),
      line([rx0, ry], [rx1, ry], { stroke: '#465885', width: 3.2 }),
      line([mapR(480), ry - 20], [mapR(480), ry + 20], { stroke: COSMOS.dim, width: 2.6 }),
      txt('480', mapR(480), ry + 50, 26, COSMOS.dim, 'mono'),
      line([mapR(500), ry - 20], [mapR(500), ry + 20], { stroke: COSMOS.blue, width: 2.6 }),
      txt('500', mapR(500), ry + 50, 26, COSMOS.blue, 'mono'),
      line([mapR(512), ry - 22], [mapR(512), ry + 22], { stroke: COSMOS.gold, width: 3.2 }),
      txt('512', mapR(512), ry + 50, 26, COSMOS.gold, 'mono'),
      glowDot(mapR(500), ry - 16, { radius: 8, color: COSMOS.blue }),
    );

    if (!isSplit) {
      nodes.push(
        ...(shS > 0.02
          ? [
              glowDot(mapR(500), ry + 16, { radius: 9, color: COSMOS.cyan, opacity: shS }),
              txt('448 × (500/448) = 500 (exact)', 445, 342, 30, COSMOS.cyan, 'mono').opacity(shS),
            ]
          : []),
      );
    } else {
      nodes.push(
        txt(
          spP > 0.5
            ? '500 / 2 = 250  →  nearest E4M3 = 256'
            : 'Row 1 uses power-of-two scale S_1 = 2',
          445,
          286,
          26,
          COSMOS.cyan,
          'mono',
        ),
        ...(sp512 > 0.02
          ? [
              glowDot(mapR(512), ry + 16, { radius: 9, color: COSMOS.gold, opacity: sp512 }),
              txt(`256 × 2 = ${spikeOut}  (+12 unit error)`, 445, 348, 32, COSMOS.gold, 'mono')
                .glow(6, COSMOS.gold)
                .opacity(sp512),
            ]
          : []),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('local-shared', () =>
    s.play(showSharedTiny.to(1, { duration: remainDuration(c, 'local-shared', 0.45) })),
  );
  c.on('local-shared-spike', () =>
    s.play(showSharedSpike.to(1, { duration: remainDuration(c, 'local-shared-spike', 0.45) })),
  );
  c.on('local-tiny', () =>
    s.play(splitRows.to(1, { duration: remainDuration(c, 'local-tiny', 0.55) })),
  );
  c.on('local-probe', () =>
    s.play(showSpikeProbe.to(1, { duration: remainDuration(c, 'local-probe', 0.45) })),
  );
  c.on('local-spike', () =>
    s.play(showSpike512.to(1, { duration: remainDuration(c, 'local-spike', 0.45) })),
  );
}
