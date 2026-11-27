// Scene 22: Protect a two-slot buffer while copy and compute overlap: Hopper TMA + WGMMA async pipeline.
import { tilePipelinePrefix } from '../../../films/flash-attention/model.mjs';
import {
  COSMOS,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

const STATE_COLOR = {
  free: COSMOS.dim,
  copying: COSMOS.cyan,
  ready: COSMOS.gold,
  reading: COSMOS.emerald,
};

export default function asyncPipeline(s, c) {
  const stepVal = s.value(0); // 0..8 matching tilePipelinePrefix(steps)
  const showFa3 = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e622', '#fb923c16');
  const title = heroTitle(['Hopper Async', 'Two-Slot Pipeline'], {
    x: -855,
    y: -410,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'TMA COPY · WGMMA COMPUTE · FA3',
  });

  const live = guardedDynamic(1, () => {
    const steps = Math.max(0, Math.min(8, Math.round(stepVal.value)));
    const snap = tilePipelinePrefix(steps);
    const fa3 = showFa3.value;

    const slotA = snap.slots.A;
    const slotB = snap.slots.B;
    const colA = STATE_COLOR[slotA.status];
    const colB = STATE_COLOR[slotB.status];

    const nodes = [
      // Producer (TMA) on left, Consumer (WGMMA 128 threads / 4 warps) on right
      glassCell(-660, -10, 380, 260, COSMOS.cyan, { fill: '#0e1b2d', glow: 8 }),
      txt('PRODUCER WARP', -660, -90, 26, COSMOS.cyan, 'mono'),
      txt('Hopper TMA', -660, -34, 38, COSMOS.ink, 'serif').glow(6, COSMOS.cyan),
      txt('Async HBM → SMEM', -660, 22, 26, COSMOS.muted, 'sans'),
      txt('bypasses registers', -660, 66, 26, COSMOS.muted, 'sans'),

      glassCell(660, -10, 380, 260, COSMOS.emerald, { fill: '#0d2224', glow: 8 }),
      txt('CONSUMER WARPGROUP', 660, -90, 26, COSMOS.emerald, 'mono'),
      txt('WGMMA + Softmax', 660, -34, 34, COSMOS.ink, 'serif').glow(6, COSMOS.emerald),
      txt('128 threads (4 warps)', 660, 22, 26, COSMOS.muted, 'sans'),
      txt('waits for copy-complete', 660, 66, 26, COSMOS.muted, 'sans'),

      // Two-slot SMEM ring buffer in the center (Slot A top, Slot B bottom)
      glassCell(0, -135, 520, 175, colA, {
        fill: '#111a2e',
        glow: slotA.status === 'free' ? 2 : 10,
      }),
      txt('SMEM SLOT A', 0, -182, 26, COSMOS.muted, 'mono'),
      txt(slotA.tile === null ? 'empty' : `K/V Tile ${slotA.tile}`, 0, -132, 38, colA, 'mono').glow(
        6,
        colA,
      ),
      txt(`state: ${slotA.status.toUpperCase()}`, 0, -82, 26, colA, 'mono'),

      glassCell(0, 115, 520, 175, colB, {
        fill: '#111a2e',
        glow: slotB.status === 'free' ? 2 : 10,
      }),
      txt('SMEM SLOT B', 0, 68, 26, COSMOS.muted, 'mono'),
      txt(slotB.tile === null ? 'empty' : `K/V Tile ${slotB.tile}`, 0, 118, 38, colB, 'mono').glow(
        6,
        colB,
      ),
      txt(`state: ${slotB.status.toUpperCase()}`, 0, 168, 26, colB, 'mono'),
    ];

    // Active copy / consume energy beams
    if (slotA.status === 'copying') {
      nodes.push(glowingArc([-468, -70], [-262, -135], -24, { color: COSMOS.cyan, width: 4.0 }));
    }
    if (slotB.status === 'copying') {
      nodes.push(glowingArc([-468, 50], [-262, 115], 24, { color: COSMOS.cyan, width: 4.0 }));
    }
    if (slotA.status === 'reading') {
      nodes.push(glowingArc([262, -135], [468, -70], -24, { color: COSMOS.emerald, width: 4.0 }));
    }
    if (slotB.status === 'reading') {
      nodes.push(glowingArc([262, 115], [468, 50], 24, { color: COSMOS.emerald, width: 4.0 }));
    }

    // Safety invariant / FA3 benchmark bar
    if (fa3 > 0.02) {
      nodes.push(
        glassCell(0, 345, 1660, 114, COSMOS.gold, { fill: '#1a1712', glow: 9, opacity: fa3 }),
        txt('FLASHATTENTION-3 (HOPPER H100 REPORTED)', 0, 314, 26, COSMOS.muted, 'mono').opacity(
          fa3,
        ),
        txt(
          'Up to 740 TFLOP/s FP16  ·  ~1.2 PFLOP/s FP8 (block-quantized)',
          0,
          362,
          30,
          COSMOS.gold,
          'mono',
        )
          .glow(6, COSMOS.gold)
          .opacity(fa3),
      );
    } else {
      nodes.push(
        txt(
          'Copy-complete ≠ consumed: producer cannot overwrite A until consumer releases it',
          0,
          340,
          26,
          COSMOS.amber,
          'mono',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('async-pipeline-beat-1', () => s.play(stepVal.to(0, { duration: 0.01 })));
  c.on('async-pipeline-beat-2', () => s.play(stepVal.to(1, { duration: 0.01 })));
  c.on('fa-copy-a', () => s.play(stepVal.to(2, { duration: 0.01 })));
  c.on('fa-read-a', () => s.play(stepVal.to(3, { duration: 0.01 })));
  c.on('fa-copy-b', () => s.play(stepVal.to(5, { duration: 0.01 })));
  c.on('fa-release-a', () => s.play(stepVal.to(8, { duration: 0.01 })));
  c.on('async-pipeline-beat-3', () =>
    s.play(showFa3.to(1, { duration: remainDuration(c, 'async-pipeline-beat-3', 0.45) })),
  );
}
