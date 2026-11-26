// Scene 26: Inspect four precision choices and actual temporaries: 4 independent dtype lanes + PEFT FP32 promotion + TRL BF16 cast + bnb dequantized temp buffer.
import {
  COSMOS,
  arrow,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function precisionContract(s, c) {
  const phase = s.value(0);
  const showLanes = s.value(0);
  const promoteFP32 = s.value(0);
  const showTRLNote = s.value(0);
  const trlCastBF16 = s.value(0);
  const showBackward = s.value(0);
  const tempBuffer = s.value(0);

  const bgAura = aura(0, 10, 620, '#60a5fa1e', '#ffd16618');
  const title = heroTitle(['Four Precision Choices', 'and Live Temporaries'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'DTYPE INSPECTION CONTRACT',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const prom = promoteFP32.value > 0.4;
    const trl = trlCastBF16.value > 0.4;
    const bwd = showBackward.value > 0.3;
    const tmp = tempBuffer.value;
    const pulse = 0.75 + 0.25 * Math.sin(p * 3.8);

    const adapterStatus = trl
      ? 'TRL quantized path casts LoRA -> BF16 (excludes DoRA m)'
      : prom
        ? 'PEFT default promotes BF16 LoRA factors -> FP32'
        : 'BF16 before wrapper promotion (disable to keep BF16)';

    const lanes = [
      {
        name: '1. Packed Base Storage',
        val: '4-bit NF4 + nested scales',
        col: COSMOS.blue,
        hl: showLanes.value > 0.2,
      },
      {
        name: '2. Base Computation',
        val: 'BF16 matmul (requested separately)',
        col: COSMOS.cyan,
        hl: showLanes.value > 0.2,
      },
      { name: '3. Adapter Factors', val: adapterStatus, col: COSMOS.gold, hl: prom || trl },
      {
        name: '4. Optimizer State',
        val: 'Inspect Adam moments & master copies',
        col: COSMOS.violet,
        hl: showTRLNote.value > 0.2,
      },
    ];

    const nodes = [
      txt(
        'INSPECT TENSORS AFTER PREPARE, WRAP & TRAINER INIT',
        855,
        -380,
        26,
        COSMOS.muted,
        'mono',
        'right',
      ),
    ];

    lanes.forEach((lane, i) => {
      const y = -195 + i * 112;
      nodes.push(
        txt(lane.name, -855, y, 28, lane.col, 'mono', 'left'),
        glassCell(230, y, 1240, 82, lane.col, {
          fill: lane.hl ? '#141e38' : '#10172b',
          glow: lane.hl ? 9 * pulse : 4,
        }),
        glowDot(-355, y, { radius: 6, color: lane.col }),
        txt(lane.val, -325, y, 28, COSMOS.ink, 'sans', 'left'),
      );
    });

    // Bottom backward dequantization temporary buffer zone
    nodes.push(
      glassCell(0, 322, 1680, 178, bwd ? COSMOS.rose : COSMOS.cyan, {
        fill: bwd ? '#1c1324' : '#10182d',
        glow: bwd ? 10 : 4,
      }),
      txt(
        bwd
          ? 'BACKWARD PASS (bnb 0.50.2): DEQUANTIZED WEIGHT BUFFER MATERIALIZES FOR INPUT GRADS'
          : 'LIVE MEMORY INCLUDES PACKED WEIGHTS + DEQUANTIZED BACKWARD TEMPORARIES',
        0,
        266,
        26,
        bwd ? COSMOS.rose : COSMOS.muted,
        'mono',
      ),
      glassCell(-535, 344, 340, 74, COSMOS.blue, { fill: '#14264d', glow: 6 }),
      txt('packed 4-bit W', -535, 344, 28, COSMOS.blue, 'mono'),
      arrow([-345, 344], [-210, 344], { stroke: COSMOS.cyan, width: 4.5, tip: 13 }),
      rect(680, 74, { fill: '#133547', stroke: COSMOS.cyan, width: 2.5, radius: 8 })
        .at(160, 344)
        .glow(tmp > 0.3 ? 11 : 4, COSMOS.cyan)
        .opacity(Math.max(0.32, tmp)),
      txt('full BF16 dequantized W temporary', 160, 344, 28, COSMOS.cyan, 'mono').opacity(
        Math.max(0.45, tmp),
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('precision-contract-1', () => s.play(showLanes.to(1, { duration: 0.4 })));
  c.on('precision-promote', () => s.play(promoteFP32.to(1, { duration: 0.45 })));
  c.on('precision-contract-2', () => s.play(showTRLNote.to(1, { duration: 0.35 })));
  c.on('precision-trainer', () => s.play(trlCastBF16.to(1, { duration: 0.45 })));
  c.on('precision-contract-3', () => s.play(showBackward.to(1, { duration: 0.4 })));
  c.on('precision-temporary', () =>
    s.play(tempBuffer.to(1, { duration: remainDuration(c, 'precision-temporary', 0.55) })),
  );
}
