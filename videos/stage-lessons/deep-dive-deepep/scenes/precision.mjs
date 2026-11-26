// Scene 16: What travels with an FP8 row?
// Prediction scene: Beat 0 shows BF16 256 B & FP8 128 B values, asks what else receiver needs!
// Beat 1 attaches 4-byte scale -> 132 B (after dep-result-precision-total).
// Beat 2 scales to 56 groups -> 7,392 B vs 14,336 B (~1.94x after dep-result-precision-ratio).
import {
  BF16_OVER_FP8_RATIO,
  BF16_TOTAL_BYTES,
  COSMOS,
  FP8_GROUPS,
  FP8_GROUP_SIZE,
  FP8_SCALE_BYTES,
  FP8_SCALE_BYTES_PER_GROUP,
  FP8_TOTAL_BYTES,
  FP8_WIDTH,
  ROLE,
  aura,
  buildFp8ScaleWireRig3d,
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

export default function precision(s, c) {
  const phase = s.value(0);
  const scaleVal = s.value(0); // STRICT: 0 during Beat 0 prediction!
  const cursorVal = s.value(0);
  const showBf = s.value(0);
  const showFp8 = s.value(0);
  const showScale = s.value(0); // c.on('precision-scale')
  const showTotal = s.value(0); // c.after('dep-result-precision-total')
  const showRatio = s.value(0); // c.after('dep-result-precision-ratio')

  const bgAura = aura(470, 12, 500, '#5ce1e622', '#a78bfa22');
  const { view: rig3d } = buildFp8ScaleWireRig3d(scaleVal, cursorVal, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['What Travels With', 'an FP8 Row?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.nvlink,
    eyebrow: 'PRECISION PAYLOAD · BF16 VS FP8 WIRE BYTES',
    subtitle: 'Compare 128 values on the same byte scale, then 56 groups',
  });

  const fmt = (n) => n.toLocaleString('en-US');

  const live = guardedDynamic(1, () => {
    const bfKnown = Math.round(showBf.value) >= 1;
    const fpOn = Math.round(showFp8.value) >= 1;
    const scaleOn = scaleVal.value > 0.05;
    const totKnown = Math.round(showTotal.value) >= 1;
    const ratioKnown = Math.round(showRatio.value) >= 1;

    const fullW = 760;
    const halfW = fullW * 0.5;
    const leftX = -840;
    const scaleW = (fullW * FP8_SCALE_BYTES_PER_GROUP) / 256;

    const nodes = [
      txt('3D BF16 VS FP8 WIRE TRANSPORT', 470, -415, 26, ROLE.nvlink, 'mono').glow(5, ROLE.nvlink),
      txt(
        ratioKnown
          ? `Full row: ${fmt(BF16_TOTAL_BYTES)} B vs ${fmt(FP8_TOTAL_BYTES)} B (~${BF16_OVER_FP8_RATIO.toFixed(2)}x)`
          : scaleOn
            ? 'Violet 4-byte scale rides past the 50% mark'
            : '128 values: BF16 = 256 B vs FP8 = 128 B + ?',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt(
        ratioKnown
          ? `Full row · ${fmt(FP8_WIDTH)} values (${FP8_GROUPS} groups)`
          : `One group · ${FP8_GROUP_SIZE} values`,
        leftX,
        -128,
        28,
        ROLE.token,
        'mono',
        'left',
      ),
      // BF16 Bar
      txt(
        bfKnown
          ? `BF16 · ${fmt(ratioKnown ? BF16_TOTAL_BYTES : 256)} bytes`
          : 'BF16 · 2 bytes per value',
        leftX,
        -68,
        26,
        ROLE.rank0,
        'mono',
        'left',
      ),
      rect(fullW, 56, { fill: '#153a70', stroke: ROLE.rank0, width: 2.4, radius: 6 }).at(
        leftX + fullW * 0.5,
        -12,
      ),
    ];

    if (fpOn) {
      nodes.push(
        // Half mark vertical ticks above & below the FP8 label
        line([leftX + halfW, 20], [leftX + halfW, 52], { stroke: COSMOS.dim, width: 2.2 }),
        line([leftX + halfW, 92], [leftX + halfW, 158], { stroke: COSMOS.dim, width: 2.2 }),
        txt('50%', leftX + halfW + 14, 42, 26, COSMOS.muted, 'mono', 'left'),
        // FP8 values bar
        txt(
          `FP8 values · ${fmt(ratioKnown ? FP8_WIDTH : FP8_GROUP_SIZE)} bytes`,
          leftX,
          68,
          26,
          ROLE.nvlink,
          'mono',
          'left',
        ),
        rect(halfW, 56, { fill: '#104e63', stroke: ROLE.nvlink, width: 2.4, radius: 6 }).at(
          leftX + halfW * 0.5,
          124,
        ),
      );
      if (scaleOn) {
        const curScaleW = Math.max(4, scaleW * Math.min(1, showScale.value));
        nodes.push(
          rect(curScaleW, 56, { fill: '#5b258a', stroke: ROLE.bad, width: 2.6, radius: 4 })
            .at(leftX + halfW + curScaleW * 0.5, 124)
            .glow(8, ROLE.bad),
          txt(
            ratioKnown
              ? `+ ${FP8_SCALE_BYTES} B scales (56 x 4 B)`
              : `+ ${FP8_SCALE_BYTES_PER_GROUP} B scale`,
            leftX + halfW + curScaleW + 18,
            124,
            26,
            ROLE.bad,
            'mono',
            'left',
          ),
        );
      }
    }

    // Bottom verdict / prediction prompt
    let botText = 'Predict: what else does the receiver need?';
    let botCol = ROLE.token;
    if (ratioKnown) {
      botText = `BF16 / FP8 = ${fmt(BF16_TOTAL_BYTES)} / ${fmt(FP8_TOTAL_BYTES)} = ${BF16_OVER_FP8_RATIO.toFixed(2)}x`;
      botCol = ROLE.good;
    } else if (totKnown) {
      botText = `Group total: 128 + 4 = 132 bytes (past half)`;
      botCol = ROLE.good;
    } else if (scaleOn) {
      botText = 'Attaching 4-byte FP32 scale to the group...';
      botCol = ROLE.bad;
    }

    nodes.push(
      glassCell(-440, 250, 840, 96, botCol, { fill: '#0e1b28', glow: 7 }),
      txt(botText, -440, 250, 27, botCol, 'mono'),
      txt(
        ratioKnown
          ? 'Route metadata & headers add extra wire bytes'
          : 'Check decoded values, then time full layer end to end',
        -860,
        355,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.after('dep-result-precision-bf16', () =>
    s.play(showBf.to(1, { duration: remainAfterDuration(c, 'dep-result-precision-bf16', 0.3) })),
  );
  c.on('precision-fp8', () =>
    s.play(showFp8.to(1, { duration: remainDuration(c, 'precision-fp8', 0.5) })),
  );
  c.on('precision-scale', () => {
    const dur = remainDuration(c, 'precision-scale', 0.65);
    s.play(showScale.to(1, { duration: dur }));
    s.play(scaleVal.to(1, { duration: dur }));
    s.play(cursorVal.to(0.6, { duration: dur }));
  });
  c.after('dep-result-precision-total', () =>
    s.play(
      showTotal.to(1, { duration: remainAfterDuration(c, 'dep-result-precision-total', 0.3) }),
    ),
  );
  c.after('dep-result-precision-ratio', () => {
    const dur = remainAfterDuration(c, 'dep-result-precision-ratio', 0.35);
    s.play(showRatio.to(1, { duration: dur }));
    s.play(cursorVal.to(1, { duration: dur }));
  });
}
