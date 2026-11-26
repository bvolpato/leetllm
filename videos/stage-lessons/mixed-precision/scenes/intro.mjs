// Scene 01: Which weight keeps the update?
// Aligned FP16 & FP32 precision rails + magnifying close-up beam + strict prediction withholding.
import {
  COSMOS,
  DECREMENT,
  FP16_AFTER_DEC,
  FP16_BELOW,
  FP32_AFTER_DEC,
  FP32_LOWER_TICK,
  FP32_UNIT,
  FP32_UPPER_TICK,
  ONE,
  WANTED_WEIGHT,
  aura,
  beatRemainDuration,
  bitFieldRibbon,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const travel = s.value(0);
  const zoom = s.value(0);
  const halfLand = s.value(0);
  const singleLand = s.value(0);
  const showRoleSplit = s.value(0);

  const bgAura = aura(180, -20, 620, '#5ce1e622', '#60a5fa12');

  const title = heroTitle(['Which Weight', 'Keeps the Update?'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'MIXED PRECISION · WEIGHT UPDATE',
  });

  // Main ruler coordinates: FP16 neighbor below 1 on left, 1.0 on right
  const railLeft = -240;
  const railRight = 790;
  const xAt = (w) => railLeft + ((w - FP16_BELOW) / (ONE - FP16_BELOW)) * (railRight - railLeft);
  const yFp16 = -140;
  const yFp32 = 55;

  // Close-up coordinates centered below FP32 rail
  const zoomCenter = 360;
  const zoomY = 305;

  const live = guardedDynamic(1, () => {
    const tr = travel.value;
    const zm = zoom.value;
    const hl = halfLand.value;
    const sl = singleLand.value;
    const rs = showRoleSplit.value;
    const ph = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(ph * 3.4);

    const reqWeight = ONE - DECREMENT * tr;
    const reqX = xAt(reqWeight);
    const wantedX = xAt(WANTED_WEIGHT);

    const nodes = [
      // Left-side live requested step readout
      txt('OPTIMIZER STEP', -855, -210, 26, COSMOS.muted, 'mono', 'left'),
      txt('1 - 0.0001', -855, -142, 54, COSMOS.ink, 'mono', 'left'),
      txt('TARGET WEIGHT', -855, -35, 26, COSMOS.gold, 'mono', 'left'),
      txt(reqWeight.toFixed(tr > 0.99 ? 4 : 5), -855, 36, 62, COSMOS.gold, 'mono', 'left').glow(
        8,
        COSMOS.gold,
      ),

      // Compact IEEE-754 bit-field legend on lower-left (visually shows why FP32 has 8,192x ticks)
      txt('FP16 (1s · 5e · 10m)', -855, 160, 26, COSMOS.blue, 'mono', 'left'),
      bitFieldRibbon({
        x: -855,
        y: 212,
        totalWidth: 420,
        height: 30,
        signBits: 1,
        expBits: 5,
        fracBits: 10,
        fracColor: COSMOS.blue,
      }).group,
      txt('FP32 (1s · 8e · 23m)', -855, 286, 26, COSMOS.cyan, 'mono', 'left'),
      bitFieldRibbon({
        x: -855,
        y: 338,
        totalWidth: 420,
        height: 30,
        signBits: 1,
        expBits: 8,
        fracBits: 23,
        fracColor: COSMOS.cyan,
      }).group,
    ];

    // FP16 precision rail
    nodes.push(
      txt('FP16', railLeft - 65, yFp16, 40, COSMOS.blue, 'mono', 'right').glow(6, COSMOS.blue),
      line([railLeft, yFp16], [railRight, yFp16], { stroke: '#35486e', width: 4 }),
      // Neighbor ticks
      line([xAt(FP16_BELOW), yFp16 - 24], [xAt(FP16_BELOW), yFp16 + 24], {
        stroke: COSMOS.blue,
        width: 6,
      }).glow(6, COSMOS.blue),
      line([xAt(ONE), yFp16 - 24], [xAt(ONE), yFp16 + 24], {
        stroke: COSMOS.blue,
        width: 6,
      }).glow(6, COSMOS.blue),
      txt(FP16_BELOW.toFixed(8), xAt(FP16_BELOW), yFp16 + 56, 28, COSMOS.muted, 'mono'),
      txt('1.0', xAt(ONE), yFp16 + 56, 30, COSMOS.ink, 'mono'),
    );

    // FP32 precision rail (dense glowing tick comb)
    nodes.push(
      txt('FP32', railLeft - 65, yFp32, 40, COSMOS.cyan, 'mono', 'right').glow(6, COSMOS.cyan),
      glowingTrail(
        [
          [railLeft, yFp32],
          [railRight, yFp32],
        ],
        { color: COSMOS.cyan, width: 5, glow: 8, core: true },
      ),
      txt('8,192 ticks between neighbors', railLeft, yFp32 + 52, 26, COSMOS.cyan, 'sans', 'left'),
    );

    // Subtle fine tick hash marks along FP32 rail
    for (let k = 0; k <= 40; k++) {
      const tx = railLeft + (k / 40) * (railRight - railLeft);
      nodes.push(
        line([tx, yFp32 - 11], [tx, yFp32 + 11], { stroke: COSMOS.cyan, width: 1.5 }).opacity(0.45),
      );
    }

    // Requested yellow slide bar + markers on BOTH rails
    if (tr > 0.01) {
      nodes.push(
        glowingTrail(
          [
            [railRight, yFp16 - 42],
            [reqX, yFp16 - 42],
          ],
          { color: COSMOS.gold, width: 4, glow: 8, core: false },
        ),
        glowingTrail(
          [
            [railRight, yFp32 - 42],
            [reqX, yFp32 - 42],
          ],
          { color: COSMOS.gold, width: 4, glow: 8, core: false },
        ),
        txt('0.9999', reqX, yFp16 - 84, 32, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
      );
    }

    // Yellow requested dots on both rails
    nodes.push(
      glowDot(reqX, yFp16 - 42, { radius: 9, color: COSMOS.gold, glow: 12 }),
      glowDot(reqX, yFp32 - 42, { radius: 9, color: COSMOS.gold, glow: 12 }),
    );

    // FP16 landing (strictly withheld until half-landing cue!)
    if (hl > 0.02) {
      const destX = xAt(FP16_AFTER_DEC);
      const lx = reqX + (destX - reqX) * hl;
      const ly = yFp16 - 42 + 42 * hl;
      nodes.push(
        glowingTrail(
          [
            [reqX, yFp16 - 42],
            [lx, ly],
          ],
          { color: COSMOS.rose, width: 3.5, glow: 8, opacity: hl },
        ),
        glowDot(lx, ly, { radius: 11, color: COSMOS.rose, glow: 14, opacity: hl }),
        txt('FP16 stored: 1  (update lost)', railLeft, yFp16 - 84, 28, COSMOS.rose, 'mono', 'left')
          .glow(6, COSMOS.rose)
          .opacity(hl),
      );
    }

    // FP32 main rail landing (strictly withheld until single-landing cue!)
    if (sl > 0.02) {
      const destX = xAt(FP32_AFTER_DEC);
      const lx = reqX + (destX - reqX) * sl;
      const ly = yFp32 - 42 + 42 * sl;
      nodes.push(
        glowDot(lx, ly, { radius: 11, color: COSMOS.cyan, glow: 14, opacity: sl }),
        txt(
          `FP32 stored: ${FP32_AFTER_DEC.toFixed(8)}`,
          railLeft,
          yFp32 - 84,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        )
          .glow(6, COSMOS.cyan)
          .opacity(sl),
      );
    }

    // FP32 close-up magnifying cone + surrounding ticks
    if (zm > 0.02) {
      const span = 520 * zm;
      const zAt = (w) => zoomCenter + ((w - WANTED_WEIGHT) / FP32_UNIT) * span;
      const xLow = zAt(FP32_LOWER_TICK);
      const xHigh = zAt(FP32_UPPER_TICK);

      nodes.push(
        // Magnifying rays from FP32 rail to close-up ticks
        line([wantedX, yFp32 + 14], [xLow, zoomY - 28], {
          stroke: COSMOS.cyan,
          width: 2,
          dash: [8, 6],
        }).opacity(0.45 * zm),
        line([wantedX, yFp32 + 14], [xHigh, zoomY - 28], {
          stroke: COSMOS.cyan,
          width: 2,
          dash: [8, 6],
        }).opacity(0.45 * zm),

        txt('FP32 CLOSE-UP', xLow - 36, zoomY, 26, COSMOS.cyan, 'mono', 'right').opacity(zm),
        line([xLow - 24, zoomY], [xHigh + 24, zoomY], { stroke: '#3a5678', width: 4 }).opacity(zm),

        // Lower and upper FP32 ticks
        line([xLow, zoomY - 22], [xLow, zoomY + 22], { stroke: COSMOS.cyan, width: 6 })
          .glow(8 * pulse, COSMOS.cyan)
          .opacity(zm),
        line([xHigh, zoomY - 22], [xHigh, zoomY + 22], { stroke: COSMOS.cyan, width: 6 })
          .glow(8 * pulse, COSMOS.cyan)
          .opacity(zm),

        // Yellow target dot floating between the two FP32 ticks
        glowDot(zoomCenter, zoomY - 42, { radius: 9, color: COSMOS.gold, glow: 12, opacity: zm }),
      );

      // Show tick coordinates only once zoomed wide enough to avoid overlap
      if (zm > 0.65) {
        const lblOp = Math.min(1, (zm - 0.65) / 0.35);
        nodes.push(
          txt(FP32_LOWER_TICK.toFixed(8), xLow, zoomY + 54, 28, COSMOS.ink, 'mono').opacity(lblOp),
          txt(FP32_UPPER_TICK.toFixed(8), xHigh, zoomY + 54, 28, COSMOS.ink, 'mono').opacity(lblOp),
        );
      }

      // FP32 close-up snap to lower tick on single-landing
      if (sl > 0.02) {
        const storedX = zAt(FP32_AFTER_DEC);
        const cx = zoomCenter + (storedX - zoomCenter) * sl;
        const cy = zoomY - 42 + 42 * sl;
        nodes.push(
          glowingTrail(
            [
              [zoomCenter, zoomY - 42],
              [cx, cy],
            ],
            { color: COSMOS.cyan, width: 4, glow: 10, opacity: sl * zm },
          ),
          glowDot(cx, cy, { radius: 11, color: COSMOS.cyan, glow: 14, opacity: sl * zm }),
          txt('Stored tick', storedX, zoomY + 96, 26, COSMOS.cyan, 'mono')
            .glow(6, COSMOS.cyan)
            .opacity(sl * zm),
        );
      }
    }

    // Beat 2 bottom takeaway strip: separate format per job
    if (rs > 0.02) {
      nodes.push(
        txt(
          'FP32 optimizer state  ·  16-bit Tensor Core matmul (half the operand bytes)',
          0,
          445,
          30,
          COSMOS.emerald,
          'sans',
        )
          .glow(6, COSMOS.emerald)
          .opacity(rs),
      );
    } else if (hl < 0.02 && sl < 0.02) {
      nodes.push(
        txt(
          'Predict: which stored weight keeps the -0.0001 update?',
          180,
          445,
          30,
          COSMOS.gold,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('request-step', () => s.play(travel.to(1, { duration: 1.4 })));
  c.on('inspect-ticks', () => s.play(zoom.to(1, { duration: 0.7 })));
  c.after('half-landing', () =>
    s.play(halfLand.to(1, { duration: remainDuration(c, 'half-landing', 0.4, 0.35, true) })),
  );
  c.after('single-landing', () =>
    s.play(singleLand.to(1, { duration: remainDuration(c, 'single-landing', 0.4, 0.35, true) })),
  );
  c.onBeat(2, () => s.play(showRoleSplit.to(1, { duration: beatRemainDuration(c, 2, 0.55) })));
}
