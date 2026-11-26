// Scene 01: Where will token seven land?
// Prediction scene: keep 384, [128,256,128,128], 640, and 224 concealed until beat 1 cues!
import {
  COSMOS,
  PACK_128,
  ROLE,
  aura,
  buildMoePackSlabs3d,
  counts,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  packSegments,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const showPin = s.value(0);
  const showRule = s.value(0);
  const showAsk = s.value(0);
  const p0 = s.value(0); // expert 0 padding progress 64 -> 128
  const p1 = s.value(0); // expert 1 padding progress 192 -> 256
  const reveal384 = s.value(0); // STRICT: revealed c.after('dg-intro-1-2')
  const p23 = s.value(0); // experts 2 & 3 padding progress -> 128, 128
  const showBlocks = s.value(0);
  const showTotals = s.value(0); // STRICT: revealed c.after('dg-intro-1-5')
  const showLaunch = s.value(0);

  const currentWidths = () => [
    counts[0] + (PACK_128.padded[0] - counts[0]) * p0.value,
    counts[1] + (PACK_128.padded[1] - counts[1]) * p1.value,
    counts[2] + (PACK_128.padded[2] - counts[2]) * p23.value,
    counts[3] + (PACK_128.padded[3] - counts[3]) * p23.value,
  ];
  const pinRow = () => {
    const w = currentWidths();
    return w[0] + w[1];
  };

  const bgAura = aura(445, 20, 520, '#5ce1e622', '#ffd16618');
  const { view: pack3d } = buildMoePackSlabs3d(counts, currentWidths, pinRow, 640, phase, {
    x: 455,
    y: 15,
    unit: 94,
  });

  const title = heroTitle(['Where Will', 'Token 7 Land?'], {
    x: -860,
    y: -420,
    size: 58,
    lineHeight: 68,
    accent: ROLE.gold,
    eyebrow: 'DEEPGEMM · GROUPED MOE PACKING',
    subtitle: 'Four experts: [64, 192, 32, 128] useful rows',
  });

  const live = guardedDynamic(1, () => {
    const widths = currentWidths();
    const segs = packSegments(counts, widths);
    const barLeft = -690;
    const barScale = 640 / 640; // 1 px per row -> 640 px wide (-690 to -50)
    const toX = (row) => barLeft + row * barScale;
    const rowY = (i) => -86 + i * 86;
    const barH = 40;

    const nodes = [
      txt('3D MOE PACKED M-AXIS SLABS', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Cyan: useful rows  ·  Amber: 128-row padding', 455, 435, 26, COSMOS.muted, 'sans'),
      // Axis ticks
      line([toX(0), -138], [toX(640), -138], { stroke: COSMOS.dim, width: 2 }),
    ];

    for (const tick of [0, 128, 256, 384, 512, 640]) {
      const tx = toX(tick);
      nodes.push(
        line([tx, -146], [tx, -130], { stroke: COSMOS.dim, width: 2 }),
        txt(String(tick), tx, -168, 26, COSMOS.muted, 'mono'),
      );
    }

    for (let i = 0; i < 4; i++) {
      const seg = segs[i];
      const y = rowY(i);
      const sx = toX(seg.start);
      const usefulW = Math.max(2, seg.count * barScale);
      const totalW = Math.max(2, seg.width * barScale);
      const padW = totalW - usefulW;

      nodes.push(
        txt(`E${i}`, -840, y - 4, 28, COSMOS.ink, 'mono', 'left'),
        txt(`${seg.count}`, -772, y - 4, 26, ROLE.c, 'mono', 'left'),
      );

      // Useful segment
      nodes.push(
        rect(usefulW, barH, { fill: '#104c63', stroke: ROLE.c, width: 2.2, radius: 5 })
          .at(sx + usefulW * 0.5, y)
          .glow(5, ROLE.c),
      );

      // Padding tail
      if (padW > 2) {
        nodes.push(
          rect(padW, barH, {
            fill: '#2b1e10',
            stroke: ROLE.warn,
            width: 2.0,
            radius: 4,
            dash: [6, 5],
          }).at(sx + usefulW + padW * 0.5, y),
        );
      }

      // Block count badge after dg-intro-1-4
      if (showBlocks.value > 0.05) {
        const blk = PACK_128.padded[i] / 128;
        nodes.push(
          txt(`${blk} blk`, 12, y - 4, 26, ROLE.gold, 'mono', 'left').opacity(showBlocks.value),
        );
      }
    }

    // Token 7 pin at Expert 2 start
    const pinX = toX(segs[2].start);
    const pinY = rowY(2);
    const pinVis = Math.max(0.25, showPin.value);
    nodes.push(
      line([pinX, pinY - 30], [pinX, pinY + 34], { stroke: ROLE.gold, width: 4.5 })
        .glow(8, ROLE.gold)
        .opacity(pinVis),
    );

    // Pin readout strictly respects prediction withholding!
    const pinLabel =
      reveal384.value > 0.5
        ? 'Token 7 -> row 384'
        : showAsk.value > 0.5 && p0.value < 0.05
          ? 'Token 7 -> row ?'
          : p0.value > 0.05 && reveal384.value <= 0.5
            ? 'Token 7 shifting...'
            : 'Token 7 -> row 256';
    const pinColor = reveal384.value > 0.5 ? ROLE.good : ROLE.gold;
    nodes.push(
      txt(pinLabel, -860, 258, 30, pinColor, 'mono', 'left')
        .glow(6, pinColor)
        .opacity(Math.max(0.4, showPin.value)),
    );

    if (showRule.value > 0.05 && showTotals.value < 0.05) {
      nodes.push(
        txt(
          'Block rule: round each expert up to 128 rows',
          -860,
          314,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showRule.value),
      );
    }

    if (showAsk.value > 0.05 && p0.value < 0.05) {
      nodes.push(
        txt(
          'Predict: where does Token 7 land after padding?',
          -860,
          372,
          28,
          ROLE.gold,
          'serif',
          'left',
        )
          .glow(5, ROLE.gold)
          .opacity(showAsk.value),
      );
    }

    // Totals revealed strictly AFTER dg-intro-1-5
    if (showTotals.value > 0.05) {
      nodes.push(
        glassCell(-460, 355, 800, 88, showLaunch.value > 0.5 ? ROLE.c : ROLE.good, {
          fill: '#0e1d2c',
          glow: 8,
          opacity: showTotals.value,
        }),
        txt(
          showLaunch.value > 0.5
            ? '1 grouped launch: 640 res · 416 useful · 224 pad'
            : '640 reserved = 416 useful + 224 pad (1·2·1·1)',
          -460,
          355,
          26,
          showLaunch.value > 0.5 ? ROLE.c : ROLE.good,
          'mono',
        ).opacity(showTotals.value),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, pack3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pack3d, { theta: -0.22, phi: 0.94 });

  c.on('dg-intro-0-0', () =>
    s.play(showPin.to(1, { duration: remainDuration(c, 'dg-intro-0-0', 0.45) })),
  );
  c.on('dg-intro-0-3', () =>
    s.play(showPin.to(1, { duration: remainDuration(c, 'dg-intro-0-3', 0.35) })),
  );
  c.on('dg-intro-0-4', () =>
    s.play(showRule.to(1, { duration: remainDuration(c, 'dg-intro-0-4', 0.45) })),
  );
  c.on('dg-intro-0-5', () =>
    s.play(showAsk.to(1, { duration: remainDuration(c, 'dg-intro-0-5', 0.45) })),
  );

  c.on('dg-intro-1-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'dg-intro-1-0', 0.65) })),
  );
  c.on('dg-intro-1-1', () =>
    s.play(p1.to(1, { duration: remainDuration(c, 'dg-intro-1-1', 0.65) })),
  );
  c.after('dg-intro-1-2', () =>
    s.play(reveal384.to(1, { duration: remainAfterDuration(c, 'dg-intro-1-2', 0.35) })),
  );
  c.on('dg-intro-1-3', () =>
    s.play(p23.to(1, { duration: remainDuration(c, 'dg-intro-1-3', 0.65) })),
  );
  c.on('dg-intro-1-4', () =>
    s.play(showBlocks.to(1, { duration: remainDuration(c, 'dg-intro-1-4', 0.4) })),
  );
  c.after('dg-intro-1-5', () =>
    s.play(showTotals.to(1, { duration: remainAfterDuration(c, 'dg-intro-1-5', 0.4) })),
  );
  c.on('dg-intro-2-1', () =>
    s.play(showLaunch.to(1, { duration: remainDuration(c, 'dg-intro-2-1', 0.45) })),
  );
}
